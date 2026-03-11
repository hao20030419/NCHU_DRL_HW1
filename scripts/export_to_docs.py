"""Export the static frontend into the `docs/` folder for GitHub Pages.

Usage:
  python scripts\export_to_docs.py --backend https://my-backend.example.com

This will copy `templates/index.html` and the `static/` folder into `docs/`.
It will replace the placeholder %%BACKEND_URL%% in the HTML with the provided backend URL.
"""
import os
import shutil
import argparse


def copy_static(dst):
    src_static = os.path.join(os.path.dirname(__file__), '..', 'static')
    src_static = os.path.abspath(src_static)
    dst_static = os.path.join(dst, 'static')
    if os.path.exists(dst_static):
        shutil.rmtree(dst_static)
    shutil.copytree(src_static, dst_static)


def copy_index(dst, backend_url):
    src = os.path.join(os.path.dirname(__file__), '..', 'templates', 'index.html')
    src = os.path.abspath(src)
    with open(src, 'r', encoding='utf-8') as f:
        html = f.read()
    html = html.replace('%%BACKEND_URL%%', backend_url)
    os.makedirs(dst, exist_ok=True)
    dst_file = os.path.join(dst, 'index.html')
    with open(dst_file, 'w', encoding='utf-8') as f:
        f.write(html)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--backend', default='', help='Backend base URL to call (no trailing slash)')
    parser.add_argument('--out', default='docs', help='Output docs folder')
    args = parser.parse_args()
    out = os.path.abspath(args.out)
    if os.path.exists(out):
        shutil.rmtree(out)
    os.makedirs(out, exist_ok=True)
    copy_index(out, args.backend)
    copy_static(out)
    print('Exported static site to', out)


if __name__ == '__main__':
    main()
