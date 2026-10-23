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
  "description": "M for Mute v0.0.4",
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
     "mode": 1,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Mute Selected Tracks",
       "parameter_shortname": "Mute",
       "parameter_type": 2,
       "parameter_invisible": 0
      }
     }
    }
   },
   {
    "box": {
     "id": "obj-10",
     "maxclass": "newobj",
     "text": "live.path live_set",
     "patching_rect": [
      25.0,
      270.0,
      180.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-11",
     "maxclass": "newobj",
     "text": "t b l",
     "patching_rect": [
      25.0,
      305.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-12",
     "maxclass": "message",
     "text": "get tracks",
     "patching_rect": [
      25.0,
      340.0,
      145.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-13",
     "maxclass": "newobj",
     "text": "live.object",
     "patching_rect": [
      185.0,
      340.0,
      85.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-14",
     "maxclass": "newobj",
     "text": "route tracks return_tracks",
     "patching_rect": [
      300.0,
      340.0,
      80.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 3
    }
   },
   {
    "box": {
     "id": "obj-15",
     "maxclass": "newobj",
     "text": "zl iter 2",
     "patching_rect": [
      25.0,
      375.0,
      65.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-16",
     "maxclass": "newobj",
     "text": "t b b",
     "patching_rect": [
      135.0,
      95.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-17",
     "maxclass": "newobj",
     "text": "route is_part_of_selection",
     "patching_rect": [
      405.0,
      340.0,
      75.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-18",
     "maxclass": "newobj",
     "text": "sel 1",
     "patching_rect": [
      405.0,
      375.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-19",
     "maxclass": "message",
     "text": "get mute",
     "patching_rect": [
      405.0,
      410.0,
      110.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-20",
     "maxclass": "newobj",
     "text": "loadbang",
     "patching_rect": [
      25.0,
      410.0,
      65.0,
      22.0
     ],
     "numinlets": 0,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-21",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      105.0,
      410.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-24",
     "maxclass": "newobj",
     "text": "live.object",
     "patching_rect": [
      300.0,
      450.0,
      80.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-25",
     "maxclass": "message",
     "text": "get is_part_of_selection",
     "patching_rect": [
      300.0,
      485.0,
      180.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-26",
     "maxclass": "newobj",
     "text": "route mute",
     "patching_rect": [
      405.0,
      520.0,
      75.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-27",
     "maxclass": "newobj",
     "text": "!- 1",
     "patching_rect": [
      405.0,
      555.0,
      45.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-28",
     "maxclass": "newobj",
     "text": "prepend set mute",
     "patching_rect": [
      405.0,
      590.0,
      110.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-29",
     "maxclass": "message",
     "text": "get return_tracks",
     "patching_rect": [
      25.0,
      445.0,
      165.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-30",
     "maxclass": "newobj",
     "text": "print M-for-Mute-BUTTON",
     "patching_rect": [
      510.0,
      90.0,
      180.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "obj-31",
     "maxclass": "newobj",
     "text": "print M-for-Mute-TRIGGER",
     "patching_rect": [
      510.0,
      120.0,
      180.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "obj-32",
     "maxclass": "newobj",
     "text": "print M-for-Mute-SONG-API",
     "patching_rect": [
      510.0,
      340.0,
      190.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "obj-33",
     "maxclass": "newobj",
     "text": "print M-for-Mute-TRACK-LIST",
     "patching_rect": [
      510.0,
      370.0,
      195.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "obj-34",
     "maxclass": "newobj",
     "text": "print M-for-Mute-RETURN-TRACK-LIST",
     "patching_rect": [
      510.0,
      400.0,
      245.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "obj-35",
     "maxclass": "newobj",
     "text": "print M-for-Mute-TRACK-ID",
     "patching_rect": [
      510.0,
      430.0,
      190.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "obj-36",
     "maxclass": "newobj",
     "text": "print M-for-Mute-LIVE-API",
     "patching_rect": [
      510.0,
      460.0,
      190.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "obj-37",
     "maxclass": "newobj",
     "text": "print M-for-Mute-UNROUTED",
     "patching_rect": [
      510.0,
      490.0,
      200.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "obj-38",
     "maxclass": "newobj",
     "text": "print M-for-Mute-SELECTED",
     "patching_rect": [
      510.0,
      520.0,
      200.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 0
    }
   },
   {
    "box": {
     "id": "obj-39",
     "maxclass": "newobj",
     "text": "print M-for-Mute-SET",
     "patching_rect": [
      510.0,
      550.0,
      160.0,
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
      "obj-10",
      0
     ],
     "destination": [
      "obj-13",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-3",
      0
     ],
     "destination": [
      "obj-16",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-3",
      0
     ],
     "destination": [
      "obj-30",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-16",
      0
     ],
     "destination": [
      "obj-31",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-16",
      0
     ],
     "destination": [
      "obj-12",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-16",
      0
     ],
     "destination": [
      "obj-29",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-29",
      0
     ],
     "destination": [
      "obj-13",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-12",
      0
     ],
     "destination": [
      "obj-13",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-13",
      0
     ],
     "destination": [
      "obj-14",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-13",
      0
     ],
     "destination": [
      "obj-32",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-14",
      0
     ],
     "destination": [
      "obj-15",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-14",
      0
     ],
     "destination": [
      "obj-33",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-14",
      1
     ],
     "destination": [
      "obj-15",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-14",
      1
     ],
     "destination": [
      "obj-34",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-15",
      0
     ],
     "destination": [
      "obj-11",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-15",
      0
     ],
     "destination": [
      "obj-35",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-11",
      1
     ],
     "destination": [
      "obj-24",
      1
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-11",
      0
     ],
     "destination": [
      "obj-25",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-25",
      0
     ],
     "destination": [
      "obj-24",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-24",
      0
     ],
     "destination": [
      "obj-17",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-24",
      0
     ],
     "destination": [
      "obj-36",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-17",
      0
     ],
     "destination": [
      "obj-18",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-17",
      1
     ],
     "destination": [
      "obj-37",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-18",
      0
     ],
     "destination": [
      "obj-19",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-18",
      0
     ],
     "destination": [
      "obj-38",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-19",
      0
     ],
     "destination": [
      "obj-24",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-24",
      0
     ],
     "destination": [
      "obj-26",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-26",
      0
     ],
     "destination": [
      "obj-27",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-27",
      0
     ],
     "destination": [
      "obj-28",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-28",
      0
     ],
     "destination": [
      "obj-24",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-28",
      0
     ],
     "destination": [
      "obj-39",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-20",
      0
     ],
     "destination": [
      "obj-21",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-21",
      0
     ],
     "destination": [
      "obj-10",
      0
     ]
    }
   }
  ],
  "dependency_cache": [],
  "autosave": 0
 }
}