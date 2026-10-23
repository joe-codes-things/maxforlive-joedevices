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
   380.0,
   170.0
  ],
  "openrect": [
   0.0,
   0.0,
   0.0,
   0.0
  ],
  "bglocked": 0,
  "openinpresentation": 1,
  "devicewidth": 360.0,
  "description": "Q for Quantize v0.0.4",
  "digest": "Quantize selected MIDI note start times to the active clip grid",
  "tags": "MIDI, quantize, notes, grid",
  "title": "Q for Quantize",
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
     "text": "Q for Quantize",
     "patching_rect": [
      20.0,
      15.0,
      320.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      10.0,
      320.0,
      24.0
     ],
     "fontsize": 16.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "comment",
     "text": "Select MIDI notes and map this button to lowercase q. Quantizes starts to the active grid.",
     "patching_rect": [
      20.0,
      50.0,
      340.0,
      35.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      38.0,
      340.0,
      35.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "live.button",
     "patching_rect": [
      140.0,
      105.0,
      80.0,
      30.0
     ],
     "presentation": 1,
     "presentation_rect": [
      140.0,
      85.0,
      80.0,
      35.0
     ],
     "parameter_enable": 1,
     "mode": 0,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Quantize",
       "parameter_shortname": "Quantize",
       "parameter_type": 2,
       "parameter_invisible": 0
      }
     },
     "transition": 2
    }
   },
   {
    "box": {
     "id": "obj-4",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      245.0,
      105.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "newobj",
     "text": "js q_for_quantize.js",
     "patching_rect": [
      245.0,
      140.0,
      140.0,
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
      "obj-3",
      0
     ],
     "destination": [
      "obj-4",
      0
     ]
    }
   },
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
   }
  ],
  "parameters": {
   "obj-3": [
    "Quantize",
    "Quantize",
    0
   ]
  },
  "dependency_cache": [
   {
    "name": "q_for_quantize.js",
    "bootpath": ".",
    "type": "TEXT",
    "implicit": 1
   }
  ]
 }
}