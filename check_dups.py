import re

content = open('src/i18n/translations.ts', encoding='utf-8').read()
langs = ['fr','en','es','de','it','pt','ar','zh','ja','ru','nl']

for lang in langs:
    # Find the block for this language
    start = content.find(f'  {lang}: {{')
    if start == -1:
        print(f'{lang}: NOT FOUND')
        continue
    # Find closing brace
    brace_count = 0
    i = start
    while i < len(content):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                break
        i += 1
    block = content[start:i+1]
    
    keys = re.findall(r'"([a-zA-Z0-9._-]+)":', block)
    seen = {}
    dups = []
    for k in keys:
        if k in seen:
            dups.append(k)
        else:
            seen[k] = 1
    
    if dups:
        print(f'{lang} DUPS: {", ".join(set(dups))}')
    else:
        print(f'{lang}: OK ({len(keys)} keys)')
