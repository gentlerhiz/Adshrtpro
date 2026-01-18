#!/usr/bin/env python3
import re
import csv
import argparse

COPY_RE = re.compile(r"^COPY\s+([^\s(]+)\s*\(([^)]+)\)\s+FROM\s+stdin;", re.IGNORECASE)

def escape_val(f):
    if f == "\\N":
        return 'NULL'
    # treat bare 'N' as NULL (pg_dump sometimes uses N as placeholder)
    if f == 'N':
        return 'NULL'
    if f in ('t','f'):
        return 'TRUE' if f == 't' else 'FALSE'
    if re.match(r'^-?\d+$', f):
        return f
    if re.match(r'^-?\d+\.\d+$', f):
        return f
    escaped = f.replace("'", "''")
    return f"'{escaped}'"


def convert(inpath, outpath):
    with open(inpath, 'r', encoding='utf8', errors='replace') as inf, open(outpath, 'w', encoding='utf8') as outf:
        lines = iter(inf)
        for line in lines:
            m = COPY_RE.match(line)
            if not m:
                outf.write(line)
                continue

            table = m.group(1)
            cols = [c.strip() for c in m.group(2).split(',')]

            # read data rows until a line with only "\\." is found
            for data_line in lines:
                if data_line.rstrip('\n') == '\\.' or data_line.rstrip('\r\n') == '\\.':
                    break
                # parse tab-separated with CSV (no quoting)
                reader = csv.reader([data_line], delimiter='\t', quoting=csv.QUOTE_NONE, escapechar='\\')
                try:
                    fields = next(reader)
                except Exception:
                    fields = data_line.rstrip('\n').split('\t')

                vals = []
                # map fields to columns with some heuristics
                for col, f in zip(cols, fields):
                    # treat literal "N" as NULL for timestamp-like columns
                    if f == 'N' and re.search(r'(_at$|^expires_at$)', col, re.IGNORECASE):
                        vals.append('NULL')
                        continue
                    vals.append(escape_val(f))

                if len(vals) != len(cols):
                    # try to tolerate by padding NULLs
                    if len(vals) < len(cols):
                        vals += ['NULL'] * (len(cols) - len(vals))
                    else:
                        # join extras into last column
                        extras = vals[len(cols)-1:]
                        vals = vals[:len(cols)-1] + ["'" + "\t".join([e.strip("'") for e in extras]) + "'"]

                insert = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(vals)});\n"
                outf.write(insert)
    print(f"Converted {inpath} -> {outpath}")


if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Convert PostgreSQL COPY ... FROM stdin; blocks into INSERT statements')
    p.add_argument('-i', '--input', required=True, help='Input SQL file')
    p.add_argument('-o', '--output', required=True, help='Output SQL file')
    args = p.parse_args()
    convert(args.input, args.output)
