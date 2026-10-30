import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';
import { estimateProducts, estimateSchedules, estimateBudgets, estimateIndustries } from '../src/data/estimateOptions.ts';

const fail = (status, message) => Object.assign(new Error(message), { status });
const TOKEN_AGE = 2 * 60 * 60 * 1000;
const RATE_WINDOW = 10 * 60 * 1000;
const isEmail = value => typeof value === 'string' && value.length <= 254 && /^[^\s<>(),;:"\\\r\n@]+@[^\s<>(),;:"\\\r\n@]+\.[^\s<>(),;:"\\\r\n@]+$/.test(value);

export function loadMailConfig(env = process.env) {
  return {
    host: env.SMTP_HOST?.trim(),
    port: Number(env.SMTP_PORT || 465),
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : Number(env.SMTP_PORT || 465) === 465,
    user: env.SMTP_USER?.trim(),
    password: env.SMTP_PASSWORD,
    from: env.SMTP_FROM?.trim() || env.SMTP_USER?.trim(),
    to: env.QUOTE_TO_EMAIL?.trim(),
  };
}

export function validateEstimate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw fail(400, '견적 문의 내용을 입력해 주세요.');
  const text = (key, label, max, required = false, multiline = false) => {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) || (!multiline && /[\r\n]/.test(value)) || (required && !value.trim())) throw fail(400, `${label} 항목을 확인해 주세요. (최대 ${max}자)`);
    return value.trim();
  };
  const product = estimateProducts.find(item => item.id === input.product);
  if (!product || !product.details.includes(input.detail)) throw fail(400, '제품과 상세 분류를 선택해 주세요.');
  if (!['business', 'individual'].includes(input.customerType)) throw fail(400, '고객 구분을 선택해 주세요.');
  if (input.consent !== true) throw fail(400, '개인정보 수집 및 이용에 동의해 주세요.');
  const name = text('name', '담당자명', 50, true);
  const phone = text('phone', '연락처', 25, true);
  if (!/^0\d{8,10}$/.test(phone.replace(/[\s()-]/g, ''))) throw fail(400, '연락 가능한 전화번호를 확인해 주세요.');
  const email = text('email', '이메일', 254, true);
  if (!isEmail(email)) throw fail(400, '이메일 주소를 확인해 주세요.');
  const company = text('company', '회사명', 100, input.customerType === 'business');
  const businessNumber = text('businessNumber', '사업자등록번호', 12);
  if (businessNumber && !/^\d{10}$/.test(businessNumber.replaceAll('-', ''))) throw fail(400, '사업자등록번호 10자리를 확인해 주세요.');
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 9999) throw fail(400, '구매 수량은 1~9,999 사이의 정수로 입력해 주세요.');
  if (!estimateSchedules.includes(input.schedule) || !estimateBudgets.includes(input.budget)) throw fail(400, '구매 시기와 예산을 선택해 주세요.');
  const industry = text('industry', '설치 장소', 30);
  if (industry && !estimateIndustries.includes(industry)) throw fail(400, '설치 장소를 선택해 주세요.');
  return {
    product: product.name, detail: input.detail, model: text('model', '모델명', 100), quantity: input.quantity,
    customerType: input.customerType === 'business' ? '기업 / 사업자' : '개인', company, businessNumber, name, phone, email,
    industry, address: text('address', '설치 현장 주소', 250, true), schedule: input.schedule, budget: input.budget,
    message: text('message', '문의 내용', 5000, true, true), consent: true,
  };
}

export function createEstimateService(mail = {}, { transport } = {}) {
  const secret = randomBytes(32);
  const attempts = new Map();
  const submissions = new Map();
  const configured = Boolean(mail.host && Number.isInteger(mail.port) && mail.port > 0 && mail.port <= 65535 && mail.user && mail.password && isEmail(mail.from) && isEmail(mail.to));
  const sender = transport || (configured ? nodemailer.createTransport({
    host: mail.host, port: mail.port, secure: mail.secure, requireTLS: !mail.secure,
    auth: { user: mail.user, pass: mail.password },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
    disableFileAccess: true, disableUrlAccess: true,
  }) : null);
  const signature = value => createHmac('sha256', secret).update(value).digest('hex');
  const clean = () => {
    const now = Date.now();
    for (const [key, record] of attempts) if (record.until <= now) attempts.delete(key);
    for (const [key, record] of submissions) if (record.until <= now) submissions.delete(key);
  };
  return {
    issueToken() {
      if (!configured) throw fail(503, '현재 온라인 문의를 전송할 수 없습니다. 대표전화 031-233-5559로 문의해 주세요.');
      const value = `${Date.now()}.${randomBytes(16).toString('hex')}`;
      return `${value}.${signature(value)}`;
    },
    async submit(input, token, ip) {
      clean();
      if (!configured) throw fail(503, '현재 온라인 문의를 전송할 수 없습니다. 대표전화 031-233-5559로 문의해 주세요.');
      if (typeof token !== 'string' || !/^\d{13}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token)) throw fail(403, '문의 시간이 만료되었습니다. 다시 전송해 주세요.');
      const [timestamp, nonce, signed] = token.split('.');
      if (Number(timestamp) > Date.now() || Date.now() - Number(timestamp) > TOKEN_AGE || !timingSafeEqual(Buffer.from(signed, 'hex'), Buffer.from(signature(`${timestamp}.${nonce}`), 'hex'))) throw fail(403, '문의 시간이 만료되었습니다. 다시 전송해 주세요.');
      const estimate = validateEstimate(input);
      if (input.website) throw fail(400, '문의 내용을 확인해 주세요.');
      const fingerprint = signature(JSON.stringify(estimate));
      const previous = submissions.get(token);
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw fail(409, '문의 내용이 변경되었습니다. 페이지를 새로고침해 주세요.');
        if (previous.status === 'sent') return { reference: previous.reference };
        throw fail(409, '문의 내용을 전송하고 있습니다. 잠시만 기다려 주세요.');
      }
      const attempt = attempts.get(ip) ?? { count: 0, until: Date.now() + RATE_WINDOW };
      if (attempt.count >= 5 || attempts.size >= 10_000 || submissions.size >= 10_000) throw fail(429, '문의가 많습니다. 10분 뒤 다시 시도하거나 대표전화로 연락해 주세요.');
      attempt.count += 1;
      attempts.set(ip, attempt);
      const reference = randomUUID();
      const submittedAt = new Date().toISOString();
      submissions.set(token, { fingerprint, reference, status: 'sending', until: Date.now() + TOKEN_AGE });
      const lines = [
        '연솔루션 홈페이지 견적 문의', `접수번호: ${reference}`, `전송시각: ${submittedAt}`,
        '', '[제품 정보]', `제품: ${estimate.product}`, `상세 분류: ${estimate.detail}`, `모델명: ${estimate.model || '상담 후 결정'}`, `수량: ${estimate.quantity}`,
        '', '[고객 정보]', `고객 구분: ${estimate.customerType}`, `회사명: ${estimate.company || '-'}`, `사업자등록번호: ${estimate.businessNumber || '-'}`,
        `담당자명: ${estimate.name}`, `연락처: ${estimate.phone}`, `이메일: ${estimate.email}`,
        '', '[설치 현장 정보]', `설치 장소: ${estimate.industry || '-'}`, `현장 주소: ${estimate.address}`, `구매 시기: ${estimate.schedule}`, `예산: ${estimate.budget}`,
        '', '[문의 내용]', estimate.message, '', `개인정보 수집 및 이용 동의: 동의 (${submittedAt})`,
      ];
      try {
        const result = await sender.sendMail({
          from: { name: '연솔루션 견적 문의', address: mail.from }, to: mail.to,
          replyTo: { name: estimate.name, address: estimate.email },
          subject: `[연솔루션 견적 문의] ${estimate.product} · ${estimate.company || estimate.name}`,
          text: lines.join('\n'), messageId: `<${reference}@${mail.from.split('@')[1]}>`,
        });
        if (!result.accepted?.some(address => String(address).toLowerCase() === mail.to.toLowerCase())) throw new Error('Recipient not accepted');
        submissions.set(token, { fingerprint, reference, status: 'sent', until: Date.now() + TOKEN_AGE });
        return { reference };
      } catch {
        submissions.delete(token);
        throw fail(502, '메일을 전송하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도하거나 대표전화 031-233-5559로 문의해 주세요.');
      }
    },
  };
}
