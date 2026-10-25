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
   500.0,
   190.0
  ],
  "openrect": [
   0.0,
   0.0,
   0.0,
   0.0
  ],
  "bglocked": 0,
  "openinpresentation": 1,
  "devicewidth": 480.0,
  "description": "Mixer Window v0.0.1",
  "digest": "Open a custom Live mixer window with channel volume faders",
  "tags": "Live API, mixer, volume, routing",
  "title": "Mixer Window",
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
     "text": "Mixer Window",
     "patching_rect": [
      20.0,
      15.0,
      430.0,
      24.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      12.0,
      430.0,
      24.0
     ],
     "fontsize": 16.0
    }
   },
   {
    "box": {
     "id": "obj-2",
     "maxclass": "comment",
     "text": "Open a separate mixer window with vertical volume faders and each channel's current input/output routing.",
     "patching_rect": [
      20.0,
      50.0,
      460.0,
      36.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      40.0,
      460.0,
      36.0
     ]
    }
   },
   {
    "box": {
     "id": "obj-3",
     "maxclass": "live.button",
     "patching_rect": [
      24.0,
      105.0,
      120.0,
      32.0
     ],
     "presentation": 1,
     "presentation_rect": [
      20.0,
      88.0,
      145.0,
      36.0
     ],
     "parameter_enable": 0,
     "mode": 0,
     "transition": 2
    }
   },
   {
    "box": {
     "id": "obj-4",
     "maxclass": "newobj",
     "text": "sel 1",
     "patching_rect": [
      24.0,
      160.0,
      45.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-5",
     "maxclass": "newobj",
     "text": "js mixer_window.js",
     "patching_rect": [
      280.0,
      160.0,
      140.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-6",
     "maxclass": "newobj",
     "text": "live.thisdevice",
     "patching_rect": [
      280.0,
      195.0,
      100.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 2
    }
   },
   {
    "box": {
     "id": "obj-10",
     "maxclass": "message",
     "text": "ready",
     "patching_rect": [
      390.0,
      195.0,
      45.0,
      22.0
     ],
     "numinlets": 2,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-12",
     "maxclass": "newobj",
     "text": "deferlow",
     "patching_rect": [
      280.0,
      310.0,
      65.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-7",
     "maxclass": "newobj",
     "text": "pcontrol",
     "patching_rect": [
      280.0,
      230.0,
      70.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1
    }
   },
   {
    "box": {
     "id": "obj-8",
     "maxclass": "newobj",
     "text": "p mixer-window",
     "patching_rect": [
      280.0,
      270.0,
      110.0,
      22.0
     ],
     "numinlets": 1,
     "numoutlets": 1,
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
       0.0,
       0.0,
       1480.0,
       800.0
      ],
      "openrect": [
       80.0,
       80.0,
       1480.0,
       800.0
      ],
      "openinpresentation": 1,
      "boxes": [
       {
        "box": {
         "id": "ui-in",
         "maxclass": "inlet",
         "patching_rect": [
          20.0,
          20.0,
          25.0,
          25.0
         ]
        }
       },
       {
        "box": {
         "id": "ui",
         "maxclass": "jsui",
         "text": "jsui mixer_window_ui.js",
         "filename": "mixer_window_ui.js",
         "patching_rect": [
          20.0,
          60.0,
          1440.0,
          760.0
         ],
         "presentation": 1,
         "presentation_rect": [
          0.0,
          0.0,
          1440.0,
          760.0
         ],
         "numinlets": 1,
         "numoutlets": 1,
         "parameter_enable": 0
        }
       },
       {
        "box": {
         "id": "ui-out",
         "maxclass": "outlet",
         "patching_rect": [
          20.0,
          850.0,
          25.0,
          25.0
         ]
        }
       }
      ],
      "lines": [
       {
        "patchline": {
         "source": [
          "ui-in",
          0
         ],
         "destination": [
          "ui",
          0
         ]
        }
       },
       {
        "patchline": {
         "source": [
          "ui",
          0
         ],
         "destination": [
          "ui-out",
          0
         ]
        }
       }
      ],
      "dependency_cache": []
     }
    }
   },
   {
    "box": {
     "id": "obj-9",
     "maxclass": "comment",
     "text": "Routing is displayed from Live; use Live to change input/output assignments. Track changes refresh automatically.",
     "patching_rect": [
      180.0,
      95.0,
      300.0,
      55.0
     ],
     "presentation": 1,
     "presentation_rect": [
      180.0,
      88.0,
      300.0,
      48.0
     ],
     "fontsize": 10.0
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
      "obj-12",
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
      "obj-8",
      0
     ]
    }
   },
   {
    "patchline": {
     "source": [
      "obj-8",
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
      "obj-5",
      1
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
      "obj-8",
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
      "obj-12",
      0
     ]
    }
   }
  ],
  "dependency_cache": [
   {
    "name": "mixer_window.js",
    "bootpath": ".",
    "type": "TEXT",
    "implicit": 1
   },
   {
    "name": "mixer_window_ui.js",
    "bootpath": ".",
    "type": "TEXT",
    "implicit": 1
   }
  ],
  "autosave": 0
 }
}