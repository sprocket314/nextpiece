---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: true
summary: ""                 # one or two sentences for cards, RSS and search results

# --- The puzzle (shown in the puzzle-facts box; leave a field blank to hide its row) ---
designers: []               # taxonomy, e.g. ["Stewart Coffin"]
maker: ""                   # who made this copy, e.g. "Pelikan" or "3D printed by me"
year:                       # year designed, e.g. 1985
puzzle_types: []            # taxonomy: burr, board burr, interlocking, kumiki, sequential, take-apart, packing ...
pieces:                     # piece count
level: ""                   # moves to free the 1st.2nd.3rd piece, e.g. "5.4.2"
difficulty: ""              # e.g. "3/5"
acquired: ""                # where and when you got it, e.g. "IPP 42 exchange, 2026"

# --- Blog ---
tags: []
series: []                  # for multi-part posts, e.g. ["Designing a board burr"]
series_order:               # 1, 2, 3 ... within the series
featureimage: "cover.jpg"   # cover image in this folder: hero, card thumbnail and social card
featureimagecaption: ""
instagram: true             # false = don't post this one to Instagram
instagram_caption: ""       # optional: your own caption instead of title + summary + hashtags
---

{{< puzzle-facts >}}

Opening paragraph.

<!-- Photos, 3D models and disassembly steps: see "Shortcodes" in README.md. -->
