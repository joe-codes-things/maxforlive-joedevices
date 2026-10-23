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
   560.0,
   140.0
  ],
  "openrect": [
   0.0,
   0.0,
   0.0,
   0.0
  ],
  "bglocked": 0,
  "openinpresentation": 1,
  "devicewidth": 560.0,
  "description": "M for Mute v0.0.6",
  "digest": "Toggle selected tracks' activators",
  "tags": "Live API, track, mute, key map",
  "title": "M for Mute",
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
     "text": "M for Mute",
     "patching_rect": [
      25.0,
      20.0,
      360.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      12.0,
      500.0,
      24.0
     ],
     "fontsize": 16.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "comment",
     "text": "Map this Mute button to lowercase m. Toggles selected track activators.",
     "patching_rect": [
      25.0,
      50.0,
      520.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      42.0,
      520.0,
      20.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "live.button",
     "patching_rect": [
      25.0,
      90.0,
      90.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      72.0,
      160.0,
      28.0
     ],
     "parameter_enable": 1,
     "mode": 0,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Mute Selected Tracks",
       "parameter_shortname": "Mute",
       "parameter_type": 2,
       "parameter_invisible": 0
      }
     },
     "transition": 2
    }
   },
   {
    "box": {
     "id": "obj-10",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      25.0,
      270.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-11",
     "maxclass": "newobj",
     "text": "js m_for_mute.js",
     "patching_rect": [
      105.0,
      270.0,
      130.0,
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
      "obj-10",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-10",
      0
     ],
     "destination": [
      "obj-11",
      0
     ]
    }
   }
  ],
  "dependency_cache": [],
  "autosave": 0
 }
}