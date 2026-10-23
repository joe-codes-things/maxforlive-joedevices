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
   620.0,
   300.0
  ],
  "openrect": [
   0.0,
   0.0,
   0.0,
   0.0
  ],
  "openinpresentation": 1,
  "devicewidth": 600.0,
  "description": "Locators (Markers) Create Navigate v0.0.3",
  "digest": "Map Create to `, Back to Num Pad 7, and Forward to Num Pad 9",
  "tags": "locators, Arrangement, navigation, key map, diagnostic",
  "title": "Locators (Markers) Create Navigate",
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
     "text": "Locators (Markers) Create Navigate",
     "patching_rect": [
      20.0,
      15.0,
      540.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      10.0,
      540.0,
      24.0
     ],
     "fontsize": 16.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "comment",
     "text": "Map Set/Delete to `, Previous Locator to Num Pad 7, and Next Locator to Num Pad 9 in Key Map Mode.",
     "patching_rect": [
      20.0,
      50.0,
      580.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      38.0,
      580.0,
      24.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "comment",
     "text": "Navigation moves the Arrangement cursor and Play Start Indicator without starting playback.",
     "patching_rect": [
      20.0,
      80.0,
      580.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      65.0,
      580.0,
      24.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-4",
     "maxclass": "comment",
     "text": "Set/Delete Locator",
     "patching_rect": [
      25.0,
      120.0,
      150.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      15.0,
      100.0,
      170.0,
      20.0
     ],
     "textjustification": 1
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "live.button",
     "patching_rect": [
      55.0,
      145.0,
      90.0,
      30.0
     ],
     "presentation": 1,
     "presentation_rect": [
      50.0,
      120.0,
      100.0,
      36.0
     ],
     "parameter_enable": 1,
     "mode": 0,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Set Delete Locator",
       "parameter_shortname": "Set/Delete",
       "parameter_type": 2,
       "parameter_invisible": 0
      }
     },
     "transition": 2
    }
   },
   {
    "box": {
     "id": "obj-6",
     "maxclass": "newobj",
     "text": "t b",
     "patching_rect": [
      55.0,
      180.0,
      45.0,
      22.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-7",
     "maxclass": "message",
     "text": "0",
     "patching_rect": [
      110.0,
      180.0,
      35.0,
      22.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-8",
     "maxclass": "comment",
     "text": "Previous Locator",
     "patching_rect": [
      225.0,
      120.0,
      150.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      210.0,
      100.0,
      180.0,
      20.0
     ],
     "textjustification": 1
    }
   },
   {
    "box": {
     "id": "obj-9",
     "maxclass": "live.button",
     "patching_rect": [
      255.0,
      145.0,
      90.0,
      30.0
     ],
     "presentation": 1,
     "presentation_rect": [
      250.0,
      120.0,
      100.0,
      36.0
     ],
     "parameter_enable": 1,
     "mode": 0,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Previous Locator",
       "parameter_shortname": "Previous",
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
     "text": "t b",
     "patching_rect": [
      255.0,
      180.0,
      45.0,
      22.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-11",
     "maxclass": "message",
     "text": "-1",
     "patching_rect": [
      310.0,
      180.0,
      35.0,
      22.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-12",
     "maxclass": "comment",
     "text": "Next Locator",
     "patching_rect": [
      425.0,
      120.0,
      150.0,
      20.0
     ],
     "presentation": 1,
     "presentation_rect": [
      410.0,
      100.0,
      180.0,
      20.0
     ],
     "textjustification": 1
    }
   },
   {
    "box": {
     "id": "obj-13",
     "maxclass": "live.button",
     "patching_rect": [
      455.0,
      145.0,
      90.0,
      30.0
     ],
     "presentation": 1,
     "presentation_rect": [
      450.0,
      120.0,
      100.0,
      36.0
     ],
     "parameter_enable": 1,
     "mode": 0,
     "saved_attribute_attributes": {
      "valueof": {
       "parameter_longname": "Next Locator",
       "parameter_shortname": "Next",
       "parameter_type": 2,
       "parameter_invisible": 0
      }
     },
     "transition": 2
    }
   },
   {
    "box": {
     "id": "obj-14",
     "maxclass": "newobj",
     "text": "t b",
     "patching_rect": [
      455.0,
      180.0,
      45.0,
      22.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-15",
     "maxclass": "message",
     "text": "1",
     "patching_rect": [
      510.0,
      180.0,
      35.0,
      22.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-16",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      270.0,
      235.0,
      65.0,
      22.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-17",
     "maxclass": "newobj",
     "text": "js locators_markers_create_navigate.js",
     "patching_rect": [
      350.0,
      235.0,
      260.0,
      22.0
     ]
    }
   }
  ],
  "lines": [
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
   },
   {
    "patchline": {
     "source": [
      "obj-6",
      0
     ],
     "destination": [
      "obj-7",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-7",
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
      "obj-9",
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
   },
   {
    "patchline": {
     "source": [
      "obj-11",
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
      "obj-15",
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
      "obj-16",
      0
     ],
     "destination": [
      "obj-17",
      0
     ]
    }
   }
  ],
  "parameters": {
   "obj-5": [
    "Set Delete Locator",
    "Set/Delete",
    0
   ],
   "obj-9": [
    "Previous Locator",
    "Previous",
    0
   ],
   "obj-13": [
    "Next Locator",
    "Next",
    0
   ]
  },
  "dependency_cache": [
   {
    "name": "locators_markers_create_navigate.js",
    "bootpath": ".",
    "type": "TEXT",
    "implicit": 1
   }
  ]
 }
}