"""Create a portable source archive from an explicit allowlist, never from the whole workspace."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[2]
output = root / "generated-artifacts" / "ylli-render-neon.zip"
output.parent.mkdir(exist_ok=True)
folders = ["artifacts/api-server", "artifacts/ylli-matematikes", "lib", "scripts", "deployment"]
root_files = ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", ".npmrc",
              "tsconfig.json", "tsconfig.base.json", "render.yaml", ".gitignore", "replit.md"]
excluded = {"node_modules", "dist", ".git", ".replit-artifact", "__pycache__", "migrations-backup"}
files = [root / name for name in root_files]
for folder in folders:
    files.extend(p for p in (root / folder).rglob("*") if p.is_file()
                 and not any(part in excluded for part in p.relative_to(root).parts))
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for path in sorted(set(files)):
        name = path.name.lower()
        if path.is_symlink() or name.startswith(".env") or name.endswith((".pem", ".key", ".dump", ".tsbuildinfo", ".log")):
            continue
        archive.write(path, path.relative_to(root))
print(f"Created {output.relative_to(root)} ({output.stat().st_size:,} bytes); no secrets or learner data included.")
