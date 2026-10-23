{
 "patcher": {
  "fileversion": 1,
  "appversion": {
   "major": 9,
   "minor": 2,
   "revision": 0,
   "architecture": "arm64",
   "modernui": 1
  },
  "rect": [
   80.0,
   80.0,
   440.0,
   205.0
  ],
  "openrect": [
   0.0,
   0.0,
   0.0,
   0.0
  ],
  "openinpresentation": 1,
  "devicewidth": 420.0,
  "description": "Set Note Lengths v0.0.1",
  "digest": "Select MIDI notes and map Set Lengths to lowercase l",
  "tags": "MIDI, notes, duration, grid, key map, diagnostic",
  "title": "Set Note Lengths",
  "default_fontsize": 12.0,
  "default_fontface": 0,
  "default_fontname": "Arial",
  "gridonopen": 1,
  "gridsize": [
   15.0,
   15.0
  ],
  "boxes": [
   {
    "box": {
     "id": "obj-1",
     "maxclass": "comment",
     "text": "Set Note Lengths",
     "patching_rect": [
      20.0,
      15.0,
      360.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      10.0,
      360.0,
      24.0
     ],
     "fontsize": 16.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "comment",
     "text": "Select MIDI notes and map this button to lowercase l in Key Map Mode.",
     "patching_rect": [
      20.0,
      50.0,
      400.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      38.0,
      400.0,
      24.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "comment",
     "text": "Sets selected note durations to the active grid; note starts stay unchanged.",
     "patching_rect": [
      20.0,
      80.0,
      400.0,
      35.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      65.0,
      400.0,
      35.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-4",
     "maxclass": "live.button",
     "patching_rect": [
      165.0,
      125.0,
      90.0,
      30.0
     ],
     "presentation": 1,
     "presentation_rect": [
      160.0,
      112.0,
      100.0,
      36.0
     ],
     "parameter_enable": 1,
     "mode": 0,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Set Note Lengths",
       "parameter_shortname": "Set Lengths",
       "parameter_type": 2,
       "parameter_invisible": 0
      }
     },
     "transition": 2
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      275.0,
      130.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-6",
     "maxclass": "newobj",
     "text": "js set_note_lengths.js",
     "patching_rect": [
      275.0,
      165.0,
      155.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 0
    }
   }
  ],
  "lines": [
   {
    "patchline": {
     "source": [
      "obj-4",
      0
     ],
     "destination": [
      "obj-5",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-5",
      0
     ],
     "destination": [
      "obj-6",
      0
     ]
    }
   }
  ],
  "parameters": {
   "obj-4": [
    "Set Note Lengths",
    "Set Lengths",
    0
   ]
  },
  "dependency_cache": [
   {
    "name": "set_note_lengths.js",
    "bootpath": ".",
    "type": "TEXT",
    "implicit": 1
   }
  ]
 }
}