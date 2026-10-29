"""Compatibility entry point for the full handled-product catalog importer.

First run discover-lg-products.py, then cache-lg-details.py. This entry point
accepts the same --pillow-path option as import-lg-catalog.py.
"""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name('import-lg-catalog.py')),run_name='__main__')
