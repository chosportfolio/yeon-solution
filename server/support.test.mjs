import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createProjectServer } from './index.mjs';
import { createEstimateService, loadMailConfig, validateEstimate } from './support.mjs';

const origin = 'http://127.0.0.1:5173';
const mail = { host: 'smtp.example.test', port: 465, secure: true, user: 'sender@example.test', password: 'test-only', from: 'sender@example.test', to: 'quotes@example.test' };
const input = {
  product: 'air-conditioner', detail: '상업용 시스템에어컨', model: '', quantity: 3,
  customerType: 'business', company: '견적 테스트 회사', businessNumber: '123-45-67890',
  name: '테스트 담당자', phone: '010-1234-5678', email: 'customer@example.test',
  industry: '사무실 · 업무시설', address: '테스트 현장 주소', schedule: '상담 후 결정', budget: '상담 후 결정',
  message: '설치 면적 30평, 시스템에어컨 3대 견적을 요청합니다.\n추가 현장 상담도 부탁드립니다.', consent: true, website: '',
};

test('공개 견적 API: 인증 없이 메일 전송, 고정 수신자, Reply-To, 중복 및 악용 방지', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'yeon-support-test-'));
  const sent = [];
  let shouldFail = false;
  const server = createProjectServer({
    dataDir, username: 'admin', password: 'test-only-long-password', allowedOrigins: [origin], mail,
    mailTransport: { sendMail: async message => { if (shouldFail) throw new Error('SMTP rejected'); sent.push(message); return { accepted: [mail.to] }; } },
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => { server.closeAllConnections(); server.close(resolve); });
    const target = resolve(dataDir);
    assert.ok(target.startsWith(`${resolve(tmpdir())}\\`) || target.startsWith(`${resolve(tmpdir())}/`));
    await rm(target, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const getToken = async () => {
    const response = await fetch(`${base}/api/support/quote-token`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    return (await response.json()).token;
  };
  const post = (payload, token, requestOrigin = origin) => fetch(`${base}/api/support/estimate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(requestOrigin ? { Origin: requestOrigin } : {}), ...(token ? { 'X-Quote-Token': token } : {}) }, body: JSON.stringify(payload),
  });
  assert.equal((await post(input)).status, 403);
  const token = await getToken();
  assert.equal((await post(input, token, 'https://attacker.invalid')).status, 403);
  assert.equal((await post(input, token, '')).status, 403);
  assert.equal((await post({ ...input, consent: false }, token)).status, 400);
  assert.equal((await post({ ...input, name: 'Header\r\nBcc: injected@example.test' }, token)).status, 400);
  assert.equal((await post({ ...input, email: 'customer@example.test,other@example.test' }, token)).status, 400);
  assert.equal((await post({ ...input, website: 'spam.invalid' }, token)).status, 400);
  assert.equal((await post({ ...input, message: '가'.repeat(20_000) }, token)).status, 413);
  assert.equal(sent.length, 0);

  const response = await post({ ...input, to: 'attacker@example.test', from: 'attacker@example.test' }, token);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.ok(result.reference);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, mail.to);
  assert.equal(sent[0].from.address, mail.from);
  assert.equal(sent[0].replyTo.address, input.email);
  assert.match(sent[0].text, /시스템에어컨/);
  assert.ok(sent[0].text.includes(input.message));
  assert.ok(sent[0].text.includes(result.reference));
  assert.ok(!JSON.stringify(result).includes(mail.password));
  assert.ok(!JSON.stringify(result).includes(mail.to));
  assert.deepEqual(await (await post(input, token)).json(), result);
  assert.equal(sent.length, 1, '전송 결과를 재조회해도 동일 문의는 한 번만 발송');
  assert.equal((await post({ ...input, message: '변경한 문의 내용' }, token)).status, 409);

  const retryToken = await getToken();
  shouldFail = true;
  const failed = await post(input, retryToken);
  assert.equal(failed.status, 502);
  assert.match((await failed.json()).error, /전송하지 못했습니다/);
  shouldFail = false;
  assert.equal((await post(input, retryToken)).status, 200, '실패한 문의는 같은 토큰으로 재시도 가능');
  for (let index = 0; index < 2; index++) assert.equal((await post(input, await getToken())).status, 200);
  assert.equal((await post(input, await getToken())).status, 429);
});

test('메일 미설정 또는 수신 거절을 성공으로 처리하지 않음', async () => {
  const unconfigured = createEstimateService();
  assert.throws(() => unconfigured.issueToken(), { status: 503 });
  await assert.rejects(() => unconfigured.submit(input, 'not-a-token', 'test'), { status: 503 });
  const rejected = createEstimateService(mail, { transport: { sendMail: async () => ({ accepted: [] }) } });
  await assert.rejects(() => rejected.submit(input, rejected.issueToken(), 'test'), { status: 502 });
});

test('전송 중 재시도는 중복 메일을 만들지 않고, 완료 후 동일 접수번호 반환', async () => {
  let complete;
  const pending = new Promise(resolve => { complete = resolve; });
  const service = createEstimateService(mail, { transport: { sendMail: () => pending } });
  const token = service.issueToken();
  const first = service.submit(input, token, 'test');
  await assert.rejects(() => service.submit(input, token, 'test'), { status: 409 });
  complete({ accepted: [mail.to] });
  const result = await first;
  assert.deepEqual(await service.submit(input, token, 'test'), result);
});

test('필수값, 분류, 전화, 수량, 본문 검증 및 개인 문의', () => {
  for (const changes of [{ name: '' }, { company: '' }, { detail: 'unknown' }, { product: 'unknown' }, { phone: '12' }, { quantity: -1 }, { quantity: 1.5 }, { schedule: 'unknown' }, { message: 'a'.repeat(5001) }, { address: '' }]) assert.throws(() => validateEstimate({ ...input, ...changes }), { status: 400 });
  assert.equal(validateEstimate({ ...input, customerType: 'individual', company: '', businessNumber: '' }).customerType, '개인');
  assert.equal(loadMailConfig({ SMTP_PORT: '587' }).secure, false);
  assert.equal(loadMailConfig({ SMTP_USER: mail.from }).from, mail.from);
});
