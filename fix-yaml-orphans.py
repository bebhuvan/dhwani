#!/usr/bin/env python3
import re
import glob

files = glob.glob('src/content/works/*.md')

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix pattern: publishDate followed by orphaned list items before the body starts
    content = re.sub(
        r'(publishDate: \d{4}-\d{2}-\d{2})\n(?:  - [^\n]+\n)+(?=\n)',
        r'\1\n---\n',
        content
    )

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed all YAML orphaned lines")
