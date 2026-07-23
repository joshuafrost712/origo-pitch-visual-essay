#!/usr/bin/env python3
"""make-transparent.py — key out a white background in a PNG, leaving it transparent.

Usage:
    python3 tools/make-transparent.py <file-or-dir> [--tolerance N] [--feather N] [--out DIR] [--global]

Arguments:
    <file-or-dir>   A single .png file, or a directory (every *.png in it,
                     non-recursive, is processed).

Options:
    --tolerance N    How far from pure white (255,255,255), per channel,
                      still counts as background. Default: 30.
    --feather N       Soften the alpha edge by N px (a small blur applied to
                      the alpha mask) to avoid a hard fringe. Default: 1.
                      Use 0 to disable.
    --out DIR         Write outputs into DIR instead of next to the input.
                      DIR is created if it doesn't exist.
    --global          Key out ALL near-white pixels anywhere in the image,
                      regardless of whether they connect to the edges.
                      Default behavior instead flood-fills from the four
                      corners, so only background white touching an edge
                      is removed — interior white (e.g. white text, eyes)
                      is preserved.

Output:
    For input "foo.png" writes "foo-transparent.png" (RGBA, same
    dimensions) next to the input, or into --out DIR if given. Files
    already named "*-transparent.png" are skipped (idempotent — safe to
    re-run on a directory). The source file is never overwritten.

Requires Pillow (PIL). Install with:
    pip install Pillow
"""

import argparse
import os
import sys

try:
    from PIL import Image, ImageFilter
except ImportError:
    print("Missing dependency: Pillow is required. Install it with: pip install Pillow",
          file=sys.stderr)
    sys.exit(1)


def build_white_mask(rgb, tolerance):
    """Return a 'L' mode image where 255 = near-white, 0 = not near-white."""
    r, g, b = rgb.split()

    def near_white_channel(channel):
        # point() maps each pixel value 0-255 through the lookup: 255 if
        # within tolerance of pure white, else 0.
        threshold = 255 - tolerance
        return channel.point(lambda v: 255 if v >= threshold else 0)

    rm = near_white_channel(r)
    gm = near_white_channel(g)
    bm = near_white_channel(b)

    # Combine: a pixel is "near white" only if all three channels are.
    from PIL import ImageChops
    mask = ImageChops.multiply(rm, gm)
    mask = ImageChops.multiply(mask, bm)
    return mask


def flood_fill_from_corners(mask, width, height):
    """Given a near-white mask ('L', 255=white), return a new mask where
    only the white regions reachable from the four corners are kept (255),
    everything else is 0. Uses ImageDraw.floodfill via a simple BFS on
    pixel data for portability (no extra deps)."""
    pixels = mask.load()
    visited = bytearray(width * height)
    result = Image.new("L", (width, height), 0)
    result_px = result.load()

    from collections import deque

    q = deque()
    corners = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    for cx, cy in corners:
        idx = cy * width + cx
        if pixels[cx, cy] == 255 and not visited[idx]:
            visited[idx] = 1
            q.append((cx, cy))
            result_px[cx, cy] = 255

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height:
                idx = ny * width + nx
                if not visited[idx] and pixels[nx, ny] == 255:
                    visited[idx] = 1
                    result_px[nx, ny] = 255
                    q.append((nx, ny))

    return result


def make_transparent(path, tolerance, feather, use_global):
    img = Image.open(path).convert("RGB")
    width, height = img.size

    white_mask = build_white_mask(img, tolerance)

    if use_global:
        bg_mask = white_mask
    else:
        bg_mask = flood_fill_from_corners(white_mask, width, height)

    # Alpha = 0 where background, 255 elsewhere.
    from PIL import ImageChops
    alpha = ImageChops.invert(bg_mask)

    if feather and feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(radius=feather))

    rgba = img.convert("RGBA")
    rgba.putalpha(alpha)

    # Percentage of pixels made transparent (alpha == 0, i.e. fully removed).
    hist = alpha.histogram()
    total = width * height
    fully_transparent = hist[0] if hist else 0
    pct_transparent = (fully_transparent / total * 100) if total else 0.0

    return rgba, pct_transparent


def resolve_output_path(input_path, out_dir):
    base = os.path.basename(input_path)
    name, ext = os.path.splitext(base)
    out_name = f"{name}-transparent{ext}"
    if out_dir:
        return os.path.join(out_dir, out_name)
    return os.path.join(os.path.dirname(input_path), out_name)


def collect_pngs(target):
    if os.path.isdir(target):
        files = sorted(
            os.path.join(target, f)
            for f in os.listdir(target)
            if f.lower().endswith(".png")
        )
        return files
    return [target]


def main():
    parser = argparse.ArgumentParser(
        description="Make the white background of a PNG transparent.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("target", help="A .png file or a directory of .png files")
    parser.add_argument("--tolerance", type=int, default=30,
                         help="Per-channel distance from pure white still counted as background (default: 30)")
    parser.add_argument("--feather", type=int, default=1,
                         help="Blur radius (px) applied to the alpha edge to avoid a hard fringe (default: 1, use 0 to disable)")
    parser.add_argument("--out", type=str, default=None,
                         help="Output directory (default: write next to each input file)")
    parser.add_argument("--global", dest="use_global", action="store_true",
                         help="Key out all near-white pixels regardless of connectivity to the edges")
    args = parser.parse_args()

    if not os.path.exists(args.target):
        print(f"Error: path not found: {args.target}", file=sys.stderr)
        sys.exit(1)

    if args.out:
        os.makedirs(args.out, exist_ok=True)

    candidates = collect_pngs(args.target)
    if not candidates:
        print(f"No .png files found in {args.target}", file=sys.stderr)
        sys.exit(1)

    any_processed = False
    for path in candidates:
        base = os.path.basename(path)
        name, _ext = os.path.splitext(base)
        if name.endswith("-transparent"):
            print(f"skip (already processed): {path}")
            continue

        out_path = resolve_output_path(path, args.out)
        if os.path.abspath(out_path) == os.path.abspath(path):
            print(f"skip (would overwrite source): {path}", file=sys.stderr)
            continue

        try:
            rgba, pct_transparent = make_transparent(
                path, args.tolerance, args.feather, args.use_global
            )
        except Exception as exc:  # noqa: BLE001 - report and continue with other files
            print(f"error processing {path}: {exc}", file=sys.stderr)
            continue

        rgba.save(out_path, "PNG")
        any_processed = True
        print(f"{path} -> {out_path} ({pct_transparent:.1f}% transparent)")

    if not any_processed:
        sys.exit(1)


if __name__ == "__main__":
    main()
