---
title: "Example post: Burr No. 305"
date: 2026-11-09T12:00:00Z
draft: false
summary: "A classic solid six-piece burr, used to show what a puzzle post here looks like: facts box, gallery, disassembly steps and a 3D model you can turn around."

designers: ["Unknown"]
maker: "Not built yet: OpenSCAD renders"
year:
puzzle_types: ["burr"]
pieces: 6
level: "1"
difficulty: ""
acquired: ""

tags: ["six-piece burr", "solid burr", "example"]
series: []
series_order:
featureimage: "cover.png"
featureimagecaption: "Burr No. 305, assembled"
---

{{< puzzle-facts >}}

This is a worked example of a puzzle post on Next Piece. It will be replaced by real posts
soon. The puzzle is a real one, though: **Burr No. 305** from Bill Cutler's tabulation of the
314 solid notchable six-piece burrs.

A six-piece burr is three pairs of notched 2×2×6 sticks crossing at right angles. *Solid*
means the six sticks fill the burr shape completely: 104 cubes and not one gap. With no room to
wiggle, the very first move has to take the puzzle apart, which makes it a level-1 burr. The
sticks are named by their Känel numbers, a compact code for a stick's notches:
**52, 615, 792, 960, 975, 992**. They fit together in exactly one way.

## The pieces

{{< photos cols="2" >}}
cover.png  | Assembled
pieces.png | The six sticks laid flat. Red 52, blue 615, yellow 792, green 960, orange 975, purple 992.
{{< /photos >}}

## Turn it around

The pieces pulled apart from the centre so you can see how the notches meet.

{{< model src="burr-305-exploded.glb" poster="exploded.png" caption="Burr No. 305, exploded view." >}}

## Taking it apart

Every separation below is a single straight slide, checked by a search over all the
ways each group of sticks can move.

{{< disassembly >}}
step-1.png | Red, green and purple (52, 960 and 992) slide out together along the red stick.
step-2.png | One move later the burr is in two halves of three sticks.
step-3.png | Each half gives up one stick: red slides sideways out of its half, yellow lifts out of the other.
step-4.png | The last two pairs come apart: green from purple, blue from orange.
{{< /disassembly >}}

## How the images were made

The sticks were generated from the six Känel numbers, checked to have exactly one assembly,
rendered in OpenSCAD and converted to a coloured GLB for the viewer with the blog's
`tools/stl2glb.py`. The colours are PLA filaments in stock, so a printed copy can match.
