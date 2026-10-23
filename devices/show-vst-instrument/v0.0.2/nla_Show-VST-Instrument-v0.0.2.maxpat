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
   400.0,
   180.0
  ],
  "openrect": [
   0.0,
   0.0,
   0.0,
   0.0
  ],
  "bglocked": 0,
  "openinpresentation": 1,
  "devicewidth": 380.0,
  "description": "Show VST Instrument v0.0.2",
  "digest": "Toggle the first VST instrument editor on the selected MIDI track",
  "tags": "VST, plug-in, editor, window, key map",
  "title": "Show VST Instrument",
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
     "text": "Show VST Instrument",
     "patching_rect": [
      20.0,
      15.0,
      340.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      10.0,
      340.0,
      24.0
     ],
     "fontsize": 16.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "comment",
     "text": "Select a MIDI track. Map this button to Cmd+E to toggle its first VST instrument window.",
     "patching_rect": [
      20.0,
      50.0,
      360.0,
      35.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      38.0,
      360.0,
      35.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "live.button",
     "patching_rect": [
      150.0,
      110.0,
      90.0,
      30.0
     ],
     "presentation": 1,
     "presentation_rect": [
      145.0,
      88.0,
      100.0,
      36.0
     ],
     "parameter_enable": 1,
     "mode": 0,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "VST Window",
       "parameter_shortname": "VST Window",
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
      265.0,
      110.0,
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
     "text": "js show_vst_instrument.js",
     "patching_rect": [
      265.0,
      145.0,
      175.0,
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
    "VST Window",
    "VST Window",
    0
   ]
  },
  "dependency_cache": [
   {
    "name": "show_vst_instrument.js",
    "bootpath": ".",
    "type": "TEXT",
    "implicit": 1
   }
  ]
 }
}