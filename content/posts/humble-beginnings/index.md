---
title: "Humble beginnings"
date: 2026-11-14T09:00:00Z
draft: false
summary: "Perseus, my very first puzzle: a sequential discovery box with a blind four-level maze inside. It never quite worked, so it will never be released, and here are all its secrets."

# --- The puzzle (shown in the puzzle-facts box; leave a field blank to hide its row) ---
designers: ["Carlos Moreno Serrano"]
maker: ""
year: 2025
puzzle_types: ["sequential discovery"]
pieces:
level: ""
difficulty: ""
acquired: ""

# --- Blog ---
tags: ["puzzle design", "3D printing", "mazes", "magnets"]
series: ["My designs"]
series_order: 1
series_label: "October 2025"
featureimage: "cover.jpg"
featureimagecaption: "Perseus with the box made see-through: four maze levels, four pins and the ball"
instagram: true
instagram_caption: ""
---

{{< puzzle-facts >}}

I forgot one puzzle in [my first post](/posts/the-first-piece/): Perseus, my very first puzzle. It is a
sequential discovery puzzle. I started designing it in late August 2025 and finished it on the
31st October 2025, after months of manual effort in Fusion 360. It was a bit of a failure, so it won't be released. That means there is no harm in sharing its secrets. ;)

This is the first post in a series about my designs, in the order I made them. I hope you enjoy seeing my design process and the challenges I had to face.

## The goal

Perseus is a steel ball fixed in place by a magnet. You can see it through a little window, which gives you a clue that something should happen to it. The goal is to guide Perseus out of a blind maze, through four levels, to the
exit. The exit is locked by the cover, and the cover is held on by pins, but you don't know any of that. The puzzle was going to be released with the goal: "Help Perseus exit the maze".

{{< model src="perseus.glb" poster="cover.jpg" caption="Perseus, locked, with the box and cover see-through. The maze levels are numbered from the bottom: 1 blue, 2 green, 3 pink, 4 purple; the yellow squares are the holes between levels. The orange bar is the tool, stored in its slot underneath." >}}

{{< photos cols="2" >}}
assembled.jpg | The box with the cover on (render)
parts.jpg     | Cover, box and tool, with the four pins and Perseus (render)
{{< /photos >}}

## The design

![Perseus in Fusion 360, with the cover and the box in see-through copies beside the finished parts](fusion-360.png "Perseus in Fusion 360. The see-through copies show the pin holes in the cover (left) and the maze inside the box (middle).")

Designing Perseus was not easy. I had to do many sketches on my trusty notepad and then carefully draw them in Fusion 360 by hand. I had to carve every single tunnel of the maze and it was a headache to be able to connect each level together. One of the things I did was use auxiliary planes to slice the model and divide everything into smaller components/parts so I could make them transparent or invisible. Also, resetting the puzzle was not easy, because you had to solve the puzzle again backwards and I had to use the maps and listen to the sound of Perseus to tell where it was. I finally managed to set it up in the starting position on top of the magnet and it wouldn't be the last time... I had to test it multiple times, which meant resetting the puzzle multiple times. That really was the thing that made me feel the puzzle was not fun enough.

## How it is solved

{{< disassembly >}}
step-01-tool.mp4         | Take the tool out of its slot under the cover end.
step-02-spin.mp4         | Spin the puzzle. The pins fly outwards: two slide all the way into the cover, but the other two stop halfway, because their holes in the cover are too short.
step-03-magnet.mp4       | Those two pins have to go the other way, back into the box, so spinning cannot free them. The plan was to slide the tool's magnet along the top of the box and drag them in.
step-04-cover.mp4        | With all four pins clear of the joint, the cover lifts off and opens the exit.
step-05-push.mp4         | One of the released pins goes in through the little window and pushes Perseus off the magnet.
step-06-level3-up.mp4    | Level 3: roll to the far corner, then turn the box upside down so Perseus drops up into level 4.
step-07-level4.mp4       | Level 4, upside down. At the end, turn the box back over: Perseus falls into the other half of level 3.
step-08-level3-down.mp4  | Level 3 again, until a hole drops Perseus down to level 2.
step-09-level2-down.mp4  | Level 2, down to level 1.
step-10-level1-up.mp4    | Level 1 is the longest. Then over again, up into the last part of level 2.
step-11-exit.mp4         | Level 2 to the exit. Perseus is free.
{{< /disassembly >}}

## What went wrong

Step 3 didn't work in practice. The magnet in the tool was not strong enough, and the walls were too
thick, so it could not drag the second pair of pins. In the end you had to fiddle with the box to get out the pins that go
in opposing directions.

You may ask yourself: why didn't I fix those problems? Why not get a stronger magnet and make the walls thinner? And here is one thing that every aspiring designer should consider: "Will the puzzle be fun?" You might think that this is a silly question, but I have fallen into the trap of creating overcomplicated, too difficult puzzles (you will see in future posts) and I really didn't think a four-level blind maze was fun enough, so I decided to stop there.

On the positive side, my only copy of Perseus made its way to my very first puzzle party, the [XXXXCIIIV MPP](https://allardspuzzlingtimes.blogspot.com/2026/06/mpp-xxxxciiiv.html) (the Midlands Puzzle Party, hosted by Allard Walker) on the 30th May 2026. There, some people got interested in trying it and I think it was [Kevin Sadler](https://www.puzzlemad.co.uk/) who solved it, and I believe I gave it to him as a result.
