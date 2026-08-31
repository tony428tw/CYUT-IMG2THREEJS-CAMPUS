// src/createCampusModel.ts
import * as THREE2 from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";

// object-sculpt-spec.json
var object_sculpt_spec_default = {
  targetName: "Chaoyang Clocktower Campus",
  targetId: "chaoyang-clocktower-campus",
  schemaVersion: "2.1",
  terminologyProfile: {
    domain: "real-time procedural Three.js asset",
    geometryTerms: [
      "silhouette",
      "topology",
      "primitive",
      "bevel",
      "chamfer",
      "taper",
      "bend",
      "boolean cut",
      "edge loop",
      "surface normal",
      "displacement"
    ],
    materialTerms: [
      "albedo",
      "baseColor",
      "roughness",
      "metalness",
      "normal map",
      "bump map",
      "ambient occlusion",
      "cavity dirt",
      "edge wear",
      "clearcoat"
    ],
    lightingTerms: [
      "key light",
      "fill light",
      "rim light",
      "HDRI/environment reflection",
      "contact shadow"
    ],
    descriptionRule: "Use measurable 3D graphics terms. Avoid vague words unless they are paired with concrete geometry/material/shader parameters."
  },
  sourceImage: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
  referenceCamera: {
    solved: false,
    fovDegrees: 40,
    aspect: 1.7768331562167907,
    orientation: {
      yaw: 28,
      pitch: 26,
      roll: 0
    },
    positionHint: [
      19,
      23,
      42
    ],
    note: "Approximate from visible fa\xE7ade slopes; not a calibrated survey camera",
    projection: "orthographic",
    target: [
      0,
      4.4,
      0
    ],
    verticalSpan: 21.5
  },
  suitability: "conditional",
  scores: {
    object_isolation: 3,
    silhouette_readability: 3,
    depth_inference: 2,
    primitive_decomposition: 3,
    material_procedurality: 3,
    occlusion_risk: 1,
    interaction_fit: 3
  },
  preSpecAssessment: {
    objectClass: {
      primaryType: "tabletop architectural campus diorama",
      primaryDomain: "object",
      formLanguage: [
        "architectural",
        "botanical-like"
      ],
      structureKind: [
        "compound object",
        "repeated modules"
      ],
      motionPotential: [
        "whole-object transform",
        "detachable"
      ],
      materialFamilies: [
        "stone",
        "ceramic",
        "glass-like",
        "leaf",
        "bark"
      ],
      notes: "Tiny decorative people are scenery; not a character likeness reconstruction."
    },
    complexity: {
      tier: "ultra-complex",
      scores: {
        silhouetteComplexity: 3,
        componentCount: 3,
        hierarchyDepth: 3,
        repetitionDensity: 3,
        materialLayerCount: 3,
        localDetailDensity: 3,
        occlusionRisk: 3,
        actionReadinessNeed: 1
      },
      estimatedCounts: {
        macroComponents: 23,
        mesoComponents: 25,
        microFeatureGroups: 12,
        materialLayers: 11,
        repetitionSystems: 5
      },
      reasoning: [
        "Multiple nested architectural volumes, repeated windows/roof tiles/arches, organic foliage and small streetscape details."
      ]
    },
    specDepthDecision: {
      requiredDepth: "ultra-complex",
      minimumComponentLevels: [
        "macro",
        "meso",
        "micro"
      ],
      needsRepetitionSystems: true,
      needsMaterialLocalOverrides: true,
      needsMultipleReviewViews: true,
      needsActionReadyHierarchy: true,
      rationale: "Dense architectural diorama with macro massing, meso fa\xE7ade systems and micro tile/window/vegetation systems."
    },
    unknownsToResolveBeforeImplementation: [],
    detailInventory: {
      scanMethod: "grid-3x3",
      targetMinDetails: 16,
      details: [
        {
          id: "west-arcade-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u5074\u7FFC\u78DA\u62F1\u7A97",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "west-arcade",
            via: "localFeatures.west-arcade-shape"
          }
        },
        {
          id: "west-windows-detail",
          kind: "linework",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u4E09\u5C64\u85CD\u7070\u7A97\u683C",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "west-windows",
            via: "localFeatures.west-windows-shape"
          }
        },
        {
          id: "west-piers-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u77F3\u67F1\u8207\u8170\u7DDA",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "west-piers",
            via: "localFeatures.west-piers-shape"
          }
        },
        {
          id: "west-dormers-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u96D9\u8001\u864E\u7A97",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "west-dormers",
            via: "localFeatures.west-dormers-shape"
          }
        },
        {
          id: "west-parapets-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u5C4B\u9802\u5973\u5152\u7246",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "west-parapets",
            via: "localFeatures.west-parapets-shape"
          }
        },
        {
          id: "west-side-windows-detail",
          kind: "linework",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u5074\u7ACB\u9762\u7A97\u683C",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "west-side-windows",
            via: "localFeatures.west-side-windows-shape"
          }
        },
        {
          id: "east-arcade-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u5074\u7FFC\u78DA\u62F1\u7A97",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "east-arcade",
            via: "localFeatures.east-arcade-shape"
          }
        },
        {
          id: "east-windows-detail",
          kind: "linework",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u4E09\u5C64\u85CD\u7070\u7A97\u683C",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "east-windows",
            via: "localFeatures.east-windows-shape"
          }
        },
        {
          id: "east-piers-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u77F3\u67F1\u8207\u8170\u7DDA",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "east-piers",
            via: "localFeatures.east-piers-shape"
          }
        },
        {
          id: "east-dormers-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u96D9\u8001\u864E\u7A97",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "east-dormers",
            via: "localFeatures.east-dormers-shape"
          }
        },
        {
          id: "east-parapets-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u5C4B\u9802\u5973\u5152\u7246",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "east-parapets",
            via: "localFeatures.east-parapets-shape"
          }
        },
        {
          id: "east-side-windows-detail",
          kind: "linework",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u5074\u7ACB\u9762\u7A97\u683C",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "east-side-windows",
            via: "localFeatures.east-side-windows-shape"
          }
        },
        {
          id: "central-windows-detail",
          kind: "linework",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u4E2D\u592E\u7ACB\u9762\u7A97\u683C",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "central-windows",
            via: "localFeatures.central-windows-shape"
          }
        },
        {
          id: "tower-clock-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u5713\u5F62\u6642\u9418",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "tower-clock",
            via: "localFeatures.tower-clock-shape"
          }
        },
        {
          id: "tower-window-detail",
          kind: "linework",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u9418\u6A13\u9577\u62F1\u7A97",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "tower-window",
            via: "localFeatures.tower-window-shape"
          }
        },
        {
          id: "tower-lower-window-detail",
          kind: "linework",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u9418\u6A13\u5E95\u5C64\u7A97",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "tower-lower-window",
            via: "localFeatures.tower-lower-window-shape"
          }
        },
        {
          id: "balcony-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u96D9\u62F1\u967D\u53F0",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "balcony",
            via: "localFeatures.balcony-shape"
          }
        },
        {
          id: "stairs-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u4E2D\u592E\u968E\u68AF",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "stairs",
            via: "localFeatures.stairs-shape"
          }
        },
        {
          id: "pavement-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u524D\u65B9\u4EBA\u884C\u9053",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "pavement",
            via: "localFeatures.pavement-shape"
          }
        },
        {
          id: "road-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u6821\u9580\u524D\u9053\u8DEF",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "road",
            via: "localFeatures.road-shape"
          }
        },
        {
          id: "roof-dormers-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u5165\u53E3\u56DB\u8001\u864E\u7A97",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "roof-dormers",
            via: "localFeatures.roof-dormers-shape"
          }
        },
        {
          id: "central-parapet-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u4E2D\u592E\u5C4B\u9802\u570D\u7246",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "central-parapet",
            via: "localFeatures.central-parapet-shape"
          }
        },
        {
          id: "front-plaque-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u671D\u967D\u79D1\u6280\u5927\u5B78\u9298\u724C",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "front-plaque",
            via: "localFeatures.front-plaque-shape"
          }
        },
        {
          id: "west-hedges-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u66F2\u7DDA\u4FEE\u526A\u7DA0\u7C6C",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "west-hedges",
            via: "localFeatures.west-hedges-shape"
          }
        },
        {
          id: "west-shrubs-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u5EAD\u5712\u704C\u6728\u82B1\u53E2",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "west-shrubs",
            via: "localFeatures.west-shrubs-shape"
          }
        },
        {
          id: "east-hedges-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u66F2\u7DDA\u4FEE\u526A\u7DA0\u7C6C",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "east-hedges",
            via: "localFeatures.east-hedges-shape"
          }
        },
        {
          id: "east-shrubs-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u5EAD\u5712\u704C\u6728\u82B1\u53E2",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "east-shrubs",
            via: "localFeatures.east-shrubs-shape"
          }
        },
        {
          id: "lamp-system-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u56DB\u5EA7\u8DEF\u71C8",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "lamp-system",
            via: "localFeatures.lamp-system-shape"
          }
        },
        {
          id: "pedestrians-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u6821\u5712\u884C\u4EBA",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "pedestrians",
            via: "localFeatures.pedestrians-shape"
          }
        },
        {
          id: "road-markings-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u884C\u7A7F\u7DDA\u8207\u9053\u8DEF\u6A19\u7DDA",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "road-markings",
            via: "localFeatures.road-markings-shape"
          }
        },
        {
          id: "campus-sign-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u5EAD\u5712\u76F4\u7ACB\u6821\u724C",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "campus-sign",
            via: "localFeatures.campus-sign-shape"
          }
        },
        {
          id: "roof-tiles-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u8868\u9762\u7D30\u7BC0 roof-tiles",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "roof-tiles",
            via: "localFeatures.roof-tiles-shape"
          }
        },
        {
          id: "brick-joints-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u8868\u9762\u7D30\u7BC0 brick-joints",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "brick-joints",
            via: "localFeatures.brick-joints-shape"
          }
        },
        {
          id: "stone-joints-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u8868\u9762\u7D30\u7BC0 stone-joints",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "stone-joints",
            via: "localFeatures.stone-joints-shape"
          }
        },
        {
          id: "clock-marks-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u8868\u9762\u7D30\u7BC0 clock-marks",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "clock-marks",
            via: "localFeatures.clock-marks-shape"
          }
        },
        {
          id: "balustrade-detail",
          kind: "ridge",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u8868\u9762\u7D30\u7BC0 balustrade",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "balustrade",
            via: "localFeatures.balustrade-shape"
          }
        },
        {
          id: "window-mullions-detail",
          kind: "linework",
          region: {
            x: 0.25,
            y: 0.15,
            width: 0.58,
            height: 0.65
          },
          description: "\u8868\u9762\u7D30\u7BC0 window-mullions",
          affects: [
            "geometry",
            "material"
          ],
          scale: "relative",
          evidenceRef: "full-object",
          confidence: 0.84,
          mapsTo: {
            ref: "window-mullions",
            via: "localFeatures.window-mullions-shape"
          }
        }
      ]
    },
    anatomy: {
      applies: false,
      styleHeads: 0,
      proportions: {
        headUnit: 0,
        torso: 0,
        legs: 0,
        shoulderWidth: 0,
        hipWidth: 0
      },
      pose: {
        type: "unassessed",
        jointAngles: {}
      },
      faceLandmarks: {
        eyeLine: 0,
        eyeSpacing: 0,
        noseBase: 0,
        mouthLine: 0,
        hairline: 0
      },
      features: [],
      confidence: 0,
      note: "Only meaningful when objectClass.primaryDomain is character or hybrid. Set applies=true and fill from forge/stage1_intake/extract_landmarks.py. See grimoire/character/reconstruction.md and grimoire/character/likeness_maximization.md."
    },
    sourceImage: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
    documentedLimitations: [
      "Rear elevation inferred by symmetry; no interior rooms claimed.",
      "Tiny plaque logo and pedestrian faces approximated."
    ]
  },
  qualityContract: {
    qualityBar: "ultra-complex",
    definitionOfDone: [
      "A recognizable, interactive stylized reconstruction of the supplied clocktower campus diorama with matching relative massing, true central arches, red hip roofs and pale stone facade.",
      "Preserve blue window grids, stepped entrance, rounded display plinth, road crossings and clustered green vegetation.",
      "Rear/occluded architecture is explicitly inferred. No exact architectural survey or exact logo claim."
    ],
    minimumSpecDepth: {
      macroComponents: 5,
      mesoComponents: 16,
      microFeatureGroups: 8,
      materialLayers: 4,
      repetitionSystems: 2,
      reviewViewpoints: 5
    },
    featureGroups: [
      {
        id: "overall-silhouette",
        name: "Overall silhouette and proportions",
        required: true,
        qualityCriteria: [
          "Bounding shape, dominant curves, negative spaces, and scale relationships are explicitly described."
        ],
        evidenceRefs: [
          "full-object"
        ],
        failureModes: [
          "model reads as a generic placeholder instead of the reference object",
          "major proportions are guessed without evidence"
        ]
      },
      {
        id: "primary-structure",
        name: "Primary structure and hierarchy",
        required: true,
        qualityCriteria: [
          "Major parts, joints, seams, contact points, and parent-child relationships are named before code generation."
        ],
        evidenceRefs: [
          "full-object"
        ],
        failureModes: [
          "large visible parts are merged into one mesh",
          "component hierarchy is too shallow for the observed complexity"
        ]
      },
      {
        id: "attachment-joint-correctness",
        name: "Attachment and joint correctness",
        required: true,
        qualityCriteria: [
          "Every visible child appendage, branch, limb, handle, connector, tube, cable, horn, wing, leg, or hinged part has an attachment contract with parent socket, localStart/localEnd, contact type, embed/overlap, and gap tolerance."
        ],
        evidenceRefs: [
          "full-object"
        ],
        failureModes: [
          "child part root floats away from the parent",
          "branch/limb/tube is centered in space instead of pivoting from its root",
          "parent-child transform mixes world and local coordinates"
        ]
      },
      {
        id: "surface-material-response",
        name: "Surface material response",
        required: true,
        qualityCriteria: [
          "Albedo zones, roughness, normal/bump/displacement intent, cavity dirt, edge wear, and local overrides are specified where visible.",
          "Important materials define independent albedo, roughness, height/normal, and AO responses instead of reusing one texture for unrelated PBR channels.",
          "Surface response is decomposed into macro, meso, and micro frequency bands with scale and amplitude tied to object scale."
        ],
        evidenceRefs: [
          "full-object"
        ],
        failureModes: [
          "surface looks like flat plastic",
          "local material variation is missing or not tied to image evidence"
        ]
      },
      {
        id: "reference-lookdev",
        name: "Reference color, material, and lighting response",
        required: true,
        qualityCriteria: [
          "Material-pass names the reference-derived albedo palette, roughness variation, tactile normal/bump/displacement response, and local masks.",
          "When a source image is available, run reference PBR extraction and require confidence >= 0.7 before treating maps as implementation-ready.",
          "Lighting-pass names key/fill/rim or environment light, exposure, tone mapping, background, and contact shadow behavior.",
          "Neutral, grazing-angle, and reference-matched renders prove that surface relief survives relighting and is not painted into albedo."
        ],
        evidenceRefs: [
          "full-object"
        ],
        failureModes: [
          "model has acceptable shape but reads as flat shaded or plastic",
          "colors are a generic average instead of reference-observed local color zones",
          "lighting is evenly ambient and cannot reproduce the source value range"
        ]
      }
    ],
    visualDeltaChecks: [
      "silhouette and negative-space delta",
      "component hierarchy depth delta",
      "repetition density and distribution delta",
      "material albedo/roughness/normal response delta",
      "local feature placement and scale delta"
    ],
    antiShallowSpecRules: [
      "Do not proceed to code if qualityContract.qualityBar is unassessed.",
      "Do not proceed to code if the spec only contains a root component for a moderate or complex object.",
      "Do not proceed to code if required featureGroups are not represented by componentTree, materials, or repetitionSystems.",
      "Do not proceed to code if visible local features are described only in prose and not attached to components/materials/evidenceRefs.",
      "Do not proceed past structural-pass if attached child parts lack attachment.parentSocket, localStart, localEnd, embedDepth/overlap, and gapTolerance.",
      "Do not pass material look-dev when albedo is reused as roughness, height, normal, or AO.",
      "Do not pass material look-dev without macro, meso, and micro surface frequency bands for close-up materials.",
      "Do not pass reference-fidelity material look-dev from a source image without usable referencePbr maps or an explicit documented limitation.",
      "Do not patch a spec with extracted PBR maps when extraction confidence is below the target threshold unless the user explicitly accepts lower fidelity.",
      "Do not place adjacent separate-geometry parts below 0.02 world-unit seam overlap (source: grimoire/build/geometry_patterns.md).",
      "Do not satisfy raised or recessed relief, fasteners, or grip structure with a map alone when the feature affects form; use geometry or displacement (source: grimoire/build/geometry_patterns.md).",
      "Adjacent components must overlap by at least 0.02 world units at shared seams (source: grimoire/build/geometry_patterns.md).",
      "Raised or recessed relief and fasteners must be geometry, instanced micro-parts, or displacement; a map alone is an approximation (source: grimoire/build/geometry_patterns.md)."
    ],
    mustNotDo: [
      "Do not proceed to code if qualityContract.qualityBar is unassessed.",
      "Do not proceed to code if the spec only contains a root component for a moderate or complex object.",
      "Do not proceed to code if required featureGroups are not represented by componentTree, materials, or repetitionSystems.",
      "Do not proceed to code if visible local features are described only in prose and not attached to components/materials/evidenceRefs.",
      "Do not proceed past structural-pass if attached child parts lack attachment.parentSocket, localStart, localEnd, embedDepth/overlap, and gapTolerance.",
      "Do not pass material look-dev when albedo is reused as roughness, height, normal, or AO.",
      "Do not pass material look-dev without macro, meso, and micro surface frequency bands for close-up materials.",
      "Do not pass reference-fidelity material look-dev from a source image without usable referencePbr maps or an explicit documented limitation.",
      "Do not patch a spec with extracted PBR maps when extraction confidence is below the target threshold unless the user explicitly accepts lower fidelity.",
      "Do not place adjacent separate-geometry parts below 0.02 world-unit seam overlap (source: grimoire/build/geometry_patterns.md).",
      "Do not satisfy raised or recessed relief, fasteners, or grip structure with a map alone when the feature affects form; use geometry or displacement (source: grimoire/build/geometry_patterns.md).",
      "Adjacent components must overlap by at least 0.02 world units at shared seams (source: grimoire/build/geometry_patterns.md).",
      "Raised or recessed relief and fasteners must be geometry, instanced micro-parts, or displacement; a map alone is an approximation (source: grimoire/build/geometry_patterns.md)."
    ]
  },
  qualityTargets: {
    targetFidelity: 0.7,
    mustMatch: [
      "macro silhouette and proportions",
      "primary material albedo/roughness response",
      "reference-derived PBR material response at or above 0.7 confidence when source pixels are usable",
      "most recognizable local features"
    ],
    niceToHave: [
      "micro scratches, stains, chips, and dirt masks",
      "secondary lighting match"
    ],
    fpsTarget: 60,
    reviewViewpoints: [
      "front",
      "three-quarter",
      "side",
      "thickness-axis",
      "long-axis"
    ]
  },
  selfCorrectLoop: {
    enabled: true,
    visualAcceptance: {
      reviewer: "ai-vision",
      threshold: 0.7,
      comparisonArtifactRequired: true,
      layerScoresRequired: true,
      codePixelDiffIsAcceptanceAuthority: false,
      scoringRule: "AI vision must inspect a side-by-side reference/render sheet and score the current pass from 0 to 1. Pixel-diff code may assist diagnostics but cannot approve a pass.",
      requiredLayerScores: [
        "silhouetteProportion",
        "componentStructure",
        "formDetail",
        "materialSurface",
        "lightingCamera"
      ],
      featureReviewPolicy: {
        enabled: true,
        reviewUnit: "semantic-subsystem",
        maxCriticalFeaturesPerPass: 5,
        maxImportantFeaturesPerPass: 3,
        criticalDefaultThreshold: 0.8,
        importantAverageThreshold: 0.65,
        adaptiveEscalation: true,
        singleImagePairOnly: true,
        selectionRule: "Choose only the most visually salient, identity-defining, user-prioritized, or high-risk semantic systems. Group repeated parts instead of reviewing every mesh. AI vision scores every selected feature from the same full reference/render pair."
      }
    },
    reviewAfterPasses: [
      "blockout",
      "structural-pass",
      "form-refinement",
      "material-pass",
      "surface-pass",
      "lighting-pass",
      "interaction-pass",
      "optimization-pass"
    ],
    allowedActions: [
      "continue",
      "refine-spec",
      "refine-code",
      "request-input",
      "stop"
    ],
    specRefineTriggers: [
      "missing component",
      "wrong primitive family",
      "wrong proportions",
      "material layer under-specified",
      "local feature not traceable to viewEvidence",
      "reference ambiguity discovered during implementation"
    ],
    codeRefineTriggers: [
      "spec is adequate but generated geometry/material does not match",
      "browser render differs from reference",
      "performance budget exceeded",
      "lighting hides geometry or material response"
    ],
    stopCriteria: [
      "target fidelity reached or user accepts current approximation",
      "remaining gaps require new reference images or manual art"
    ],
    screenshotPolicy: {
      requiredForPasses: [
        "blockout",
        "structural-pass",
        "form-refinement",
        "material-pass",
        "surface-pass",
        "lighting-pass",
        "interaction-pass"
      ],
      preferredCapture: "in-app-browser-screenshot",
      fallbackCapture: "user-supplied-screenshot-path",
      minimumEvidence: "Each visual pass needs a reference image, rendered screenshot, side-by-side comparison sheet, AI vision score, layer scores, and critique before choosing continue.",
      reviewPairRule: "Compare the same camera/viewpoint whenever possible; do not judge a front reference against a random render angle.",
      acceptanceAuthority: "AI vision review of the comparison sheet. Code-generated pixel similarity is not sufficient evidence."
    }
  },
  featureReviewTargets: [
    {
      id: "clocktower-massing",
      name: "Tall central clocktower and bilateral wing proportions",
      tier: "critical",
      minimumScore: 0.8,
      passIds: [
        "blockout",
        "structural-pass",
        "form-refinement",
        "material-pass",
        "surface-pass",
        "lighting-pass",
        "interaction-pass",
        "optimization-pass"
      ],
      componentRefs: [
        "tower",
        "east-wing",
        "west-wing"
      ],
      evidenceRefs: [
        "full-object"
      ],
      mustPass: true
    },
    {
      id: "hip-roof-system",
      name: "Red truncated hip roofs and tower pyramid",
      tier: "critical",
      minimumScore: 0.8,
      passIds: [
        "blockout",
        "structural-pass",
        "form-refinement",
        "material-pass",
        "surface-pass",
        "lighting-pass",
        "interaction-pass",
        "optimization-pass"
      ],
      componentRefs: [
        "east-roof",
        "west-roof",
        "tower-roof"
      ],
      evidenceRefs: [
        "full-object"
      ],
      mustPass: true
    },
    {
      id: "entrance-and-ground",
      name: "Three-arch entry, plinth and raised garden",
      tier: "critical",
      minimumScore: 0.8,
      passIds: [
        "blockout",
        "structural-pass",
        "form-refinement",
        "material-pass",
        "surface-pass",
        "lighting-pass",
        "interaction-pass",
        "optimization-pass"
      ],
      componentRefs: [
        "arcade",
        "plinth",
        "landscape"
      ],
      evidenceRefs: [
        "full-object"
      ],
      mustPass: true
    },
    {
      id: "facade-window-system",
      name: "Repeated blue window bays and dormers",
      tier: "critical",
      minimumScore: 0.8,
      passIds: [
        "structural-pass",
        "form-refinement",
        "material-pass",
        "surface-pass",
        "lighting-pass",
        "interaction-pass",
        "optimization-pass"
      ],
      componentRefs: [
        "east-windows",
        "west-windows",
        "tower-window"
      ],
      evidenceRefs: [
        "full-object"
      ],
      mustPass: true
    },
    {
      id: "landscape-canopy",
      name: "Tiered broadleaf canopy and garden rhythm",
      tier: "critical",
      minimumScore: 0.8,
      passIds: [
        "structural-pass",
        "form-refinement",
        "material-pass",
        "surface-pass",
        "lighting-pass",
        "interaction-pass",
        "optimization-pass"
      ],
      componentRefs: [
        "east-tree-0",
        "west-tree-0",
        "east-hedges"
      ],
      evidenceRefs: [
        "full-object"
      ],
      mustPass: true
    }
  ],
  sculptPipeline: {
    passGateMode: "locked-sequential",
    passOrder: [
      "blockout",
      "structural-pass",
      "form-refinement",
      "material-pass",
      "surface-pass",
      "lighting-pass",
      "interaction-pass",
      "optimization-pass"
    ],
    currentPass: "material-pass",
    completedPasses: [
      "blockout",
      "structural-pass",
      "form-refinement"
    ],
    lastCompletedPass: "form-refinement",
    blockedReason: "",
    nextRequiredEvidence: [
      "Reference-derived albedo palette records dominant, secondary, and accent colors per visible material.",
      "Each important material defines roughness variation and at least one normal/bump/displacement response.",
      "Local material overrides, dirt/wear/stains/moss/chips/scratches or equivalent masks are tied to evidenceRefs.",
      "Thin, transparent, reflective, wet, or fibrous materials document alpha/transmission/clearcoat/metalness/fiber response when relevant.",
      "Generated preview uses procedural albedo/roughness/bump texture or vertex color variation instead of one flat color.",
      "Generated preview uses independent PBR maps at 1024px or higher for the quality-first tier.",
      "If source pixels are available, referencePbr extraction passed at confidence >= 0.7 or the pass is stopped/requesting better references.",
      "Macro, meso, and micro surface frequency bands are visible at the intended review distance without obvious tiling.",
      "AI vision comparison score meets selfCorrectLoop.visualAcceptance.threshold.",
      "reference-derived albedo palette with dominant, secondary, and accent colors",
      "independent albedo, roughness, height/normal, and AO maps",
      "macro, meso, and micro surface-frequency response at 1024px or higher",
      "local material masks: AO, dirt, wear, stains, moss, chips, scratches, wetness, or equivalent",
      "neutral, grazing-light close-up, and reference-matched browser screenshots",
      "browser render screenshot from your agent's browser/screenshot tool",
      "single side-by-side full reference/render comparison sheet",
      "all critical semantic feature scores at or above their thresholds",
      "self-correction review appended with action=continue before the next pass"
    ]
  },
  lookDevTargets: {
    qualityPriority: "reference-fidelity",
    materialPass: {
      albedoPaletteRequired: true,
      roughnessVariationRequired: true,
      normalOrBumpRequired: true,
      localOverridesRequired: true,
      minimumTextureResolution: 1024,
      preferredTextureResolution: 2048,
      independentMapChannels: [
        "albedo",
        "roughness",
        "height",
        "normal",
        "ambient-occlusion"
      ],
      requiredSurfaceFrequencyBands: [
        "macro",
        "meso",
        "micro"
      ],
      geometryReliefRequiredWhenSilhouetteAffected: true,
      referencePbrExtraction: {
        requiredWhenSourceImagePresent: true,
        targetThreshold: 0.7,
        stopOnLowConfidence: true,
        script: "forge/stage1_intake/extract_pbr_evidence.py",
        acceptedLimitation: "single-image extraction is reference-derived inference, not exact photogrammetry"
      },
      mustAvoid: [
        "single flat albedo per material",
        "uniform roughness",
        "albedo texture reused as roughness/height/normal/AO",
        "single-frequency random noise",
        "plastic-looking smooth bark, stone, cloth, foliage, or aged material",
        "local color/detail described only in prose without material masks",
        "claiming exact PBR recovery when confidence is below the target threshold"
      ]
    },
    lightingPass: {
      requiredTerms: [
        "key light",
        "fill light",
        "rim or environment light",
        "exposure",
        "tone mapping",
        "background",
        "contact shadow"
      ],
      mustAvoid: [
        "ambient-only lighting",
        "flat value range",
        "missing contact shadow",
        "reference lighting copied without separating material readability"
      ]
    },
    screenshotReview: [
      "Compare albedo palette and local color zones.",
      "Compare roughness/normal/bump response under light.",
      "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.",
      "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.",
      "Capture a neutral-light render to verify material readability without reference lighting.",
      "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.",
      "Capture a reference-matched render from the same camera framing as the source."
    ]
  },
  actionReadiness: {
    contract: "Every macro/meso component should be generated as a stable named Object3D pivot node with a mesh child, action metadata, optional sockets, collider proxy, and destruction metadata.",
    defaultRigType: "action-ready-static-rig",
    rootMotionNode: "root",
    requiredComponentFields: [
      "id",
      "parent",
      "transform",
      "attachment for child appendages, connectors, limbs, tubes, handles, legs, horns, wings, branches, or cables",
      "actionProfile.animationRole",
      "actionProfile.pivot",
      "actionProfile.collider",
      "actionProfile.destruction"
    ],
    transformChannels: [
      "translate",
      "rotate",
      "scale",
      "bend",
      "twist",
      "detach",
      "visibility",
      "material-state"
    ],
    authoringRules: [
      "Do not collapse independently movable parts into one mesh.",
      "Put transforms on component pivot groups, not only on raw meshes.",
      "For attached child parts, put the pivot at the semantic root/socket and build visible geometry from localStart to localEnd.",
      "Represent hinge, socket, detachable, and breakable intent even when no animation is implemented yet.",
      "Use simplified collider proxies for runtime physics instead of visual mesh colliders by default."
    ],
    destructionPolicy: {
      defaultBreakable: false,
      fractureGroupNaming: "Use stable semantic names such as body-shell, left-hinge, glass-panel, branch-segment.",
      debrisStrategy: "Prefer detachable component groups and a small number of procedural fragments over random mesh explosion."
    }
  },
  assumptions: [
    "Source is a stylized tabletop diorama; back and interiors unobserved.",
    "Poster title/callouts are not geometry."
  ],
  coordinateFrame: {
    front: "+Z",
    up: "+Y",
    scaleReference: "28-unit plinth width; relative units, not metres"
  },
  silhouette: {
    boundingShape: "Rounded rectangular plinth with bilateral stone wings and central tall tower",
    aspectRatios: [
      "plinth width:depth=28:17.5",
      "building width:tower height=19.4:14.74"
    ],
    symmetry: "bilateral architecture; asymmetric vegetation",
    dominantCurves: [
      "round arches",
      "ellipsoidal foliage",
      "plinth corners"
    ],
    negativeSpaces: [
      "three entrance arches",
      "two balcony arches"
    ],
    landmarks: [
      "clock centre y12.21",
      "roof apex y14.74",
      "wing eaves y8.27"
    ]
  },
  viewEvidence: [
    {
      id: "full-object",
      view: "primary",
      imageRegion: {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        units: "normalized"
      },
      observations: [
        "See ANALYSIS.md for pixel anchors, assembly observations and single-view limits."
      ],
      confidence: 0.9
    }
  ],
  componentTree: [
    {
      id: "root",
      name: "\u6821\u5712\u5FAE\u7E2E\u666F\u89C0",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "container",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: null,
      attachment: null,
      dimensions: {
        width: 28,
        height: 14,
        depth: 17.5
      },
      transform: {
        position: [
          0,
          0,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "root",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            28,
            14,
            17.5
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "root",
          seamRefs: [],
          detachableFragments: [
            "root"
          ],
          breakImpulse: 0,
          debrisMaterial: "stone"
        }
      },
      material: "stone",
      materialLayers: [
        "stone"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "root-shape",
          type: "raised ridge",
          placement: [
            0,
            0,
            0
          ],
          size: [
            28,
            14,
            17.5
          ],
          geometryEffect: "container",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u6821\u5712\u5FAE\u7E2E\u666F\u89C0"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "container",
        stage: 0
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(226, 204, 177, 1)",
        secondaryAlbedo: "rgba(226, 204, 177, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "root"
      }
    },
    {
      id: "plinth",
      name: "\u5713\u89D2\u5C55\u793A\u5E95\u5EA7",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "plinth",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 28,
        height: 1.2,
        depth: 17.5
      },
      transform: {
        position: [
          0,
          -0.6,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            28,
            1.2,
            17.5
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "plinth",
          seamRefs: [],
          detachableFragments: [
            "plinth"
          ],
          breakImpulse: 0,
          debrisMaterial: "base"
        }
      },
      material: "base",
      materialLayers: [
        "base"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "plinth-shape",
          type: "raised ridge",
          placement: [
            0,
            -0.6,
            0
          ],
          size: [
            28,
            1.2,
            17.5
          ],
          geometryEffect: "plinth",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5713\u89D2\u5C55\u793A\u5E95\u5EA7"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "plinth",
        stage: 0
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(205, 170, 130, 1)",
        secondaryAlbedo: "rgba(205, 170, 130, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "plinth"
      }
    },
    {
      id: "landscape",
      name: "\u62AC\u9AD8\u5EAD\u5712",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "garden-base",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 26.8,
        height: 0.32,
        depth: 12.9
      },
      transform: {
        position: [
          0,
          0.15,
          -1.4
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            26.8,
            0.32,
            12.9
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "landscape",
          seamRefs: [],
          detachableFragments: [
            "landscape"
          ],
          breakImpulse: 0,
          debrisMaterial: "grass"
        }
      },
      material: "grass",
      materialLayers: [
        "grass"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "landscape-shape",
          type: "raised ridge",
          placement: [
            0,
            0.15,
            -1.4
          ],
          size: [
            26.8,
            0.32,
            12.9
          ],
          geometryEffect: "garden-base",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u62AC\u9AD8\u5EAD\u5712"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "garden-base",
        stage: 0
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(176, 173, 60, 1)",
        secondaryAlbedo: "rgba(176, 173, 60, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "landscape"
      }
    },
    {
      id: "west-wing",
      name: "\u897F\u5074\u6821\u820D",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "wing",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6.6,
        height: 6.7,
        depth: 5.2
      },
      transform: {
        position: [
          -5.4,
          3.75,
          -1.3
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6.6,
            7.7,
            5.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-wing",
          seamRefs: [],
          detachableFragments: [
            "west-wing"
          ],
          breakImpulse: 0,
          debrisMaterial: "stone"
        }
      },
      material: "stone",
      materialLayers: [
        "stone"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-wing-shape",
          type: "raised ridge",
          placement: [
            -6.4,
            4.4,
            -1.3
          ],
          size: [
            6.6,
            7.7,
            5.2
          ],
          geometryEffect: "wing",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u897F\u5074\u6821\u820D"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "wing",
        stage: 0
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(226, 204, 177, 1)",
        secondaryAlbedo: "rgba(226, 204, 177, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-wing"
      }
    },
    {
      id: "east-wing",
      name: "\u6771\u5074\u6821\u820D",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "wing",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6.6,
        height: 6.7,
        depth: 5.2
      },
      transform: {
        position: [
          7.4,
          3.75,
          -1.3
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6.6,
            7.7,
            5.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-wing",
          seamRefs: [],
          detachableFragments: [
            "east-wing"
          ],
          breakImpulse: 0,
          debrisMaterial: "stone"
        }
      },
      material: "stone",
      materialLayers: [
        "stone"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-wing-shape",
          type: "raised ridge",
          placement: [
            6.4,
            4.4,
            -1.3
          ],
          size: [
            6.6,
            7.7,
            5.2
          ],
          geometryEffect: "wing",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u6771\u5074\u6821\u820D"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "wing",
        stage: 0
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(226, 204, 177, 1)",
        secondaryAlbedo: "rgba(226, 204, 177, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-wing"
      }
    },
    {
      id: "central-block",
      name: "\u4E2D\u592E\u6821\u820D",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "wing",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6.4,
        height: 8.3,
        depth: 5.2
      },
      transform: {
        position: [
          1,
          4.55,
          -1.7
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6.4,
            8.3,
            5.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "central-block",
          seamRefs: [],
          detachableFragments: [
            "central-block"
          ],
          breakImpulse: 0,
          debrisMaterial: "stone"
        }
      },
      material: "stone",
      materialLayers: [
        "stone"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "central-block-shape",
          type: "raised ridge",
          placement: [
            0,
            4.7,
            -1.7
          ],
          size: [
            6.4,
            8.3,
            5.2
          ],
          geometryEffect: "wing",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u4E2D\u592E\u6821\u820D"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "wing",
        stage: 0
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(226, 204, 177, 1)",
        secondaryAlbedo: "rgba(226, 204, 177, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "central-block"
      }
    },
    {
      id: "tower",
      name: "\u9418\u6A13\u5854\u8EAB",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "tower",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 2.6,
        height: 7.6,
        depth: 2.75
      },
      transform: {
        position: [
          1,
          9.35,
          -0.35
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            2.6,
            7.6,
            2.75
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "tower",
          seamRefs: [],
          detachableFragments: [
            "tower"
          ],
          breakImpulse: 0,
          debrisMaterial: "stone"
        }
      },
      material: "stone",
      materialLayers: [
        "stone"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "tower-shape",
          type: "raised ridge",
          placement: [
            0,
            9.5,
            -0.35
          ],
          size: [
            2.6,
            7.6,
            2.75
          ],
          geometryEffect: "tower",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u9418\u6A13\u5854\u8EAB"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "tower",
        stage: 0
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(226, 204, 177, 1)",
        secondaryAlbedo: "rgba(226, 204, 177, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "tower"
      }
    },
    {
      id: "tower-roof",
      name: "\u9418\u6A13\u5C16\u9802",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "hip",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 3.3,
        height: 1.42,
        depth: 3.4
      },
      transform: {
        position: [
          1,
          13.17,
          -0.35
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            3.3,
            1.42,
            3.4
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "tower-roof",
          seamRefs: [],
          detachableFragments: [
            "tower-roof"
          ],
          breakImpulse: 0,
          debrisMaterial: "roof"
        }
      },
      material: "roof",
      materialLayers: [
        "roof"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "tower-roof-shape",
          type: "raised ridge",
          placement: [
            0,
            13.32,
            -0.35
          ],
          size: [
            3.3,
            1.42,
            3.4
          ],
          geometryEffect: "hip",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u9418\u6A13\u5C16\u9802"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "hip",
        stage: 0,
        topRatio: 0.015
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(184, 124, 99, 1)",
        secondaryAlbedo: "rgba(184, 124, 99, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "tower-roof"
      }
    },
    {
      id: "west-roof",
      name: "\u5074\u7FFC\u7D05\u74E6\u5C4B\u9802",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "hip",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 7.1,
        height: 1.65,
        depth: 5.7
      },
      transform: {
        position: [
          -5.4,
          7.119999999999999,
          -1.3
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            7.1,
            1.65,
            5.7
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-roof",
          seamRefs: [],
          detachableFragments: [
            "west-roof"
          ],
          breakImpulse: 0,
          debrisMaterial: "roof"
        }
      },
      material: "roof",
      materialLayers: [
        "roof"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-roof-shape",
          type: "raised ridge",
          placement: [
            -6.4,
            8.27,
            -1.3
          ],
          size: [
            7.1,
            1.65,
            5.7
          ],
          geometryEffect: "hip",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5074\u7FFC\u7D05\u74E6\u5C4B\u9802"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "hip",
        stage: 0,
        topRatio: 0.65
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(184, 124, 99, 1)",
        secondaryAlbedo: "rgba(184, 124, 99, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-roof"
      }
    },
    {
      id: "east-roof",
      name: "\u5074\u7FFC\u7D05\u74E6\u5C4B\u9802",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "hip",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 7.1,
        height: 1.65,
        depth: 5.7
      },
      transform: {
        position: [
          7.4,
          7.119999999999999,
          -1.3
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            7.1,
            1.65,
            5.7
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-roof",
          seamRefs: [],
          detachableFragments: [
            "east-roof"
          ],
          breakImpulse: 0,
          debrisMaterial: "roof"
        }
      },
      material: "roof",
      materialLayers: [
        "roof"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-roof-shape",
          type: "raised ridge",
          placement: [
            6.4,
            8.27,
            -1.3
          ],
          size: [
            7.1,
            1.65,
            5.7
          ],
          geometryEffect: "hip",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5074\u7FFC\u7D05\u74E6\u5C4B\u9802"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "hip",
        stage: 0,
        topRatio: 0.65
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(184, 124, 99, 1)",
        secondaryAlbedo: "rgba(184, 124, 99, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-roof"
      }
    },
    {
      id: "central-roof",
      name: "\u4E2D\u592E\u7D05\u74E6\u5C4B\u9802",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "hip",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 7,
        height: 1.7,
        depth: 5.7
      },
      transform: {
        position: [
          1,
          8.73,
          -1.7
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            7,
            1.7,
            5.7
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "central-roof",
          seamRefs: [],
          detachableFragments: [
            "central-roof"
          ],
          breakImpulse: 0,
          debrisMaterial: "roof"
        }
      },
      material: "roof",
      materialLayers: [
        "roof"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "central-roof-shape",
          type: "raised ridge",
          placement: [
            0,
            8.88,
            -1.7
          ],
          size: [
            7,
            1.7,
            5.7
          ],
          geometryEffect: "hip",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u4E2D\u592E\u7D05\u74E6\u5C4B\u9802"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "hip",
        stage: 0,
        topRatio: 0.6
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(184, 124, 99, 1)",
        secondaryAlbedo: "rgba(184, 124, 99, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "central-roof"
      }
    },
    {
      id: "arcade",
      name: "\u5165\u53E3\u4E09\u62F1\u5ECA",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "arcade",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 8.4,
        height: 2.8,
        depth: 2.6
      },
      transform: {
        position: [
          1,
          1.1,
          3.1
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            8.4,
            2.8,
            2.6
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "arcade",
          seamRefs: [],
          detachableFragments: [
            "arcade"
          ],
          breakImpulse: 0,
          debrisMaterial: "brick"
        }
      },
      material: "brick",
      materialLayers: [
        "brick"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "arcade-shape",
          type: "raised ridge",
          placement: [
            0,
            0.55,
            3.1
          ],
          size: [
            8.4,
            2.8,
            2.6
          ],
          geometryEffect: "arcade",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5165\u53E3\u4E09\u62F1\u5ECA"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "arcade",
        stage: 0,
        count: 3
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(197, 107, 65, 1)",
        secondaryAlbedo: "rgba(197, 107, 65, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "arcade"
      }
    },
    {
      id: "arcade-roof",
      name: "\u5165\u53E3\u4F4E\u7D05\u74E6\u5C4B\u9802",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "hip",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 9,
        height: 1.25,
        depth: 3.35
      },
      transform: {
        position: [
          1,
          3.8899999999999997,
          3
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            9,
            1.25,
            3.35
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "arcade-roof",
          seamRefs: [],
          detachableFragments: [
            "arcade-roof"
          ],
          breakImpulse: 0,
          debrisMaterial: "roof"
        }
      },
      material: "roof",
      materialLayers: [
        "roof"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "arcade-roof-shape",
          type: "raised ridge",
          placement: [
            0,
            3.34,
            3
          ],
          size: [
            9,
            1.25,
            3.35
          ],
          geometryEffect: "hip",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5165\u53E3\u4F4E\u7D05\u74E6\u5C4B\u9802"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "hip",
        stage: 0,
        topRatio: 0.69
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(184, 124, 99, 1)",
        secondaryAlbedo: "rgba(184, 124, 99, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "arcade-roof"
      }
    },
    {
      id: "west-turret",
      name: "\u524D\u65B9\u77F3\u780C\u89D2\u5854",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "turret",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 1.8,
        height: 5.6,
        depth: 1.75
      },
      transform: {
        position: [
          -2.15,
          5.949999999999999,
          1.1
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            1.8,
            5,
            1.75
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-turret",
          seamRefs: [],
          detachableFragments: [
            "west-turret"
          ],
          breakImpulse: 0,
          debrisMaterial: "stone"
        }
      },
      material: "stone",
      materialLayers: [
        "stone"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-turret-shape",
          type: "raised ridge",
          placement: [
            -3.15,
            5.8,
            1.1
          ],
          size: [
            1.8,
            5,
            1.75
          ],
          geometryEffect: "turret",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        },
        {
          id: "turret-slit-window",
          type: "hole",
          geometryEffect: "three vertically repeated inset slit windows",
          confidence: 0.83,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u524D\u65B9\u77F3\u780C\u89D2\u5854"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "turret",
        stage: 0
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(226, 204, 177, 1)",
        secondaryAlbedo: "rgba(226, 204, 177, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-turret"
      }
    },
    {
      id: "west-turret-roof",
      name: "\u89D2\u5854\u56DB\u5761\u5C4B\u9802",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "hip",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 2.15,
        height: 1.5,
        depth: 2.15
      },
      transform: {
        position: [
          -2.15,
          8.78,
          1.1
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            2.15,
            1.5,
            2.15
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-turret-roof",
          seamRefs: [],
          detachableFragments: [
            "west-turret-roof"
          ],
          breakImpulse: 0,
          debrisMaterial: "roof"
        }
      },
      material: "roof",
      materialLayers: [
        "roof"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-turret-roof-shape",
          type: "raised ridge",
          placement: [
            -3.15,
            8.33,
            1.1
          ],
          size: [
            2.15,
            1.5,
            2.15
          ],
          geometryEffect: "hip",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u89D2\u5854\u56DB\u5761\u5C4B\u9802"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "hip",
        stage: 0,
        topRatio: 0.43
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(184, 124, 99, 1)",
        secondaryAlbedo: "rgba(184, 124, 99, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-turret-roof"
      }
    },
    {
      id: "east-turret",
      name: "\u524D\u65B9\u77F3\u780C\u89D2\u5854",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "turret",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 1.8,
        height: 5.6,
        depth: 1.75
      },
      transform: {
        position: [
          4.15,
          5.949999999999999,
          1.1
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            1.8,
            5,
            1.75
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-turret",
          seamRefs: [],
          detachableFragments: [
            "east-turret"
          ],
          breakImpulse: 0,
          debrisMaterial: "stone"
        }
      },
      material: "stone",
      materialLayers: [
        "stone"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-turret-shape",
          type: "raised ridge",
          placement: [
            3.15,
            5.8,
            1.1
          ],
          size: [
            1.8,
            5,
            1.75
          ],
          geometryEffect: "turret",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        },
        {
          id: "turret-slit-window",
          type: "hole",
          geometryEffect: "three vertically repeated inset slit windows",
          confidence: 0.83,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u524D\u65B9\u77F3\u780C\u89D2\u5854"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "turret",
        stage: 0
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(226, 204, 177, 1)",
        secondaryAlbedo: "rgba(226, 204, 177, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-turret"
      }
    },
    {
      id: "east-turret-roof",
      name: "\u89D2\u5854\u56DB\u5761\u5C4B\u9802",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "hip",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 2.15,
        height: 1.5,
        depth: 2.15
      },
      transform: {
        position: [
          4.15,
          8.78,
          1.1
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            2.15,
            1.5,
            2.15
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-turret-roof",
          seamRefs: [],
          detachableFragments: [
            "east-turret-roof"
          ],
          breakImpulse: 0,
          debrisMaterial: "roof"
        }
      },
      material: "roof",
      materialLayers: [
        "roof"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-turret-roof-shape",
          type: "raised ridge",
          placement: [
            3.15,
            8.33,
            1.1
          ],
          size: [
            2.15,
            1.5,
            2.15
          ],
          geometryEffect: "hip",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u89D2\u5854\u56DB\u5761\u5C4B\u9802"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "hip",
        stage: 0,
        topRatio: 0.43
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(184, 124, 99, 1)",
        secondaryAlbedo: "rgba(184, 124, 99, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-turret-roof"
      }
    },
    {
      id: "west-arcade",
      name: "\u5074\u7FFC\u78DA\u62F1\u7A97",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "arcade",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6.6,
        height: 2.35,
        depth: 0.45
      },
      transform: {
        position: [
          -5.4,
          0.4,
          1.46
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6.6,
            2.35,
            0.45
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-arcade",
          seamRefs: [],
          detachableFragments: [
            "west-arcade"
          ],
          breakImpulse: 0,
          debrisMaterial: "brick"
        }
      },
      material: "brick",
      materialLayers: [
        "brick"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-arcade-shape",
          type: "raised ridge",
          placement: [
            -6.4,
            0.55,
            1.46
          ],
          size: [
            6.6,
            2.35,
            0.45
          ],
          geometryEffect: "arcade",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5074\u7FFC\u78DA\u62F1\u7A97"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "arcade",
        stage: 1,
        count: 4,
        glazed: true
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(197, 107, 65, 1)",
        secondaryAlbedo: "rgba(197, 107, 65, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-arcade"
      }
    },
    {
      id: "west-windows",
      name: "\u4E09\u5C64\u85CD\u7070\u7A97\u683C",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "windows",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6.6,
        height: 4.15,
        depth: 0.2
      },
      transform: {
        position: [
          -5.4,
          2.88,
          1.36
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6.6,
            4.8,
            0.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-windows",
          seamRefs: [],
          detachableFragments: [
            "west-windows"
          ],
          breakImpulse: 0,
          debrisMaterial: "glass"
        }
      },
      material: "glass",
      materialLayers: [
        "glass"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-windows-shape",
          type: "raised ridge",
          placement: [
            -6.4,
            3.25,
            1.36
          ],
          size: [
            6.6,
            4.8,
            0.2
          ],
          geometryEffect: "windows",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u4E09\u5C64\u85CD\u7070\u7A97\u683C"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "windows",
        stage: 1,
        columns: 5,
        rows: 3
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(152, 175, 179, 1)",
        secondaryAlbedo: "rgba(152, 175, 179, 1)",
        materialClass: "glass",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-windows"
      }
    },
    {
      id: "west-piers",
      name: "\u77F3\u67F1\u8207\u8170\u7DDA",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "piers",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6.6,
        height: 4.25,
        depth: 0.25
      },
      transform: {
        position: [
          -5.4,
          2.85,
          1.42
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6.6,
            5.25,
            0.25
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-piers",
          seamRefs: [],
          detachableFragments: [
            "west-piers"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-piers-shape",
          type: "raised ridge",
          placement: [
            -6.4,
            3,
            1.42
          ],
          size: [
            6.6,
            5.25,
            0.25
          ],
          geometryEffect: "piers",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u77F3\u67F1\u8207\u8170\u7DDA"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "piers",
        stage: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-piers"
      }
    },
    {
      id: "west-dormers",
      name: "\u96D9\u8001\u864E\u7A97",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "dormers",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6.6,
        height: 1.15,
        depth: 1
      },
      transform: {
        position: [
          -5.4,
          7.569999999999999,
          0.94
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6.6,
            1.15,
            1
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-dormers",
          seamRefs: [],
          detachableFragments: [
            "west-dormers"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-dormers-shape",
          type: "raised ridge",
          placement: [
            -6.4,
            8.72,
            0.94
          ],
          size: [
            6.6,
            1.15,
            1
          ],
          geometryEffect: "dormers",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u96D9\u8001\u864E\u7A97"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "dormers",
        stage: 1,
        count: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-dormers"
      }
    },
    {
      id: "west-parapets",
      name: "\u5C4B\u9802\u5973\u5152\u7246",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "parapet",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 4.6,
        height: 0.38,
        depth: 3.7
      },
      transform: {
        position: [
          -5.4,
          8.709999999999999,
          -1.3
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            4.6,
            0.38,
            3.7
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-parapets",
          seamRefs: [],
          detachableFragments: [
            "west-parapets"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-parapets-shape",
          type: "raised ridge",
          placement: [
            -6.4,
            9.86,
            -1.3
          ],
          size: [
            4.6,
            0.38,
            3.7
          ],
          geometryEffect: "parapet",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5C4B\u9802\u5973\u5152\u7246"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "parapet",
        stage: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-parapets"
      }
    },
    {
      id: "west-side-windows",
      name: "\u5074\u7ACB\u9762\u7A97\u683C",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "side-windows",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 5.2,
        height: 4.15,
        depth: 0.2
      },
      transform: {
        position: [
          -8.72,
          2.88,
          -1.3
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            5.2,
            4.8,
            0.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-side-windows",
          seamRefs: [],
          detachableFragments: [
            "west-side-windows"
          ],
          breakImpulse: 0,
          debrisMaterial: "glass"
        }
      },
      material: "glass",
      materialLayers: [
        "glass"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-side-windows-shape",
          type: "raised ridge",
          placement: [
            -9.72,
            3.25,
            -1.3
          ],
          size: [
            5.2,
            4.8,
            0.2
          ],
          geometryEffect: "side-windows",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5074\u7ACB\u9762\u7A97\u683C"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "side-windows",
        stage: 1,
        columns: 3,
        rows: 3,
        side: "west"
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(152, 175, 179, 1)",
        secondaryAlbedo: "rgba(152, 175, 179, 1)",
        materialClass: "glass",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-side-windows"
      }
    },
    {
      id: "east-arcade",
      name: "\u5074\u7FFC\u78DA\u62F1\u7A97",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "arcade",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6.6,
        height: 2.35,
        depth: 0.45
      },
      transform: {
        position: [
          7.4,
          0.4,
          1.46
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6.6,
            2.35,
            0.45
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-arcade",
          seamRefs: [],
          detachableFragments: [
            "east-arcade"
          ],
          breakImpulse: 0,
          debrisMaterial: "brick"
        }
      },
      material: "brick",
      materialLayers: [
        "brick"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-arcade-shape",
          type: "raised ridge",
          placement: [
            6.4,
            0.55,
            1.46
          ],
          size: [
            6.6,
            2.35,
            0.45
          ],
          geometryEffect: "arcade",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5074\u7FFC\u78DA\u62F1\u7A97"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "arcade",
        stage: 1,
        count: 4,
        glazed: true
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(197, 107, 65, 1)",
        secondaryAlbedo: "rgba(197, 107, 65, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-arcade"
      }
    },
    {
      id: "east-windows",
      name: "\u4E09\u5C64\u85CD\u7070\u7A97\u683C",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "windows",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6.6,
        height: 4.15,
        depth: 0.2
      },
      transform: {
        position: [
          7.4,
          2.88,
          1.36
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6.6,
            4.8,
            0.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-windows",
          seamRefs: [],
          detachableFragments: [
            "east-windows"
          ],
          breakImpulse: 0,
          debrisMaterial: "glass"
        }
      },
      material: "glass",
      materialLayers: [
        "glass"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-windows-shape",
          type: "raised ridge",
          placement: [
            6.4,
            3.25,
            1.36
          ],
          size: [
            6.6,
            4.8,
            0.2
          ],
          geometryEffect: "windows",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u4E09\u5C64\u85CD\u7070\u7A97\u683C"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "windows",
        stage: 1,
        columns: 5,
        rows: 3
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(152, 175, 179, 1)",
        secondaryAlbedo: "rgba(152, 175, 179, 1)",
        materialClass: "glass",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-windows"
      }
    },
    {
      id: "east-piers",
      name: "\u77F3\u67F1\u8207\u8170\u7DDA",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "piers",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6.6,
        height: 4.25,
        depth: 0.25
      },
      transform: {
        position: [
          7.4,
          2.85,
          1.42
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6.6,
            5.25,
            0.25
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-piers",
          seamRefs: [],
          detachableFragments: [
            "east-piers"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-piers-shape",
          type: "raised ridge",
          placement: [
            6.4,
            3,
            1.42
          ],
          size: [
            6.6,
            5.25,
            0.25
          ],
          geometryEffect: "piers",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u77F3\u67F1\u8207\u8170\u7DDA"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "piers",
        stage: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-piers"
      }
    },
    {
      id: "east-dormers",
      name: "\u96D9\u8001\u864E\u7A97",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "dormers",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6.6,
        height: 1.15,
        depth: 1
      },
      transform: {
        position: [
          7.4,
          7.569999999999999,
          0.94
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6.6,
            1.15,
            1
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-dormers",
          seamRefs: [],
          detachableFragments: [
            "east-dormers"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-dormers-shape",
          type: "raised ridge",
          placement: [
            6.4,
            8.72,
            0.94
          ],
          size: [
            6.6,
            1.15,
            1
          ],
          geometryEffect: "dormers",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u96D9\u8001\u864E\u7A97"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "dormers",
        stage: 1,
        count: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-dormers"
      }
    },
    {
      id: "east-parapets",
      name: "\u5C4B\u9802\u5973\u5152\u7246",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "parapet",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 4.6,
        height: 0.38,
        depth: 3.7
      },
      transform: {
        position: [
          7.4,
          8.709999999999999,
          -1.3
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            4.6,
            0.38,
            3.7
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-parapets",
          seamRefs: [],
          detachableFragments: [
            "east-parapets"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-parapets-shape",
          type: "raised ridge",
          placement: [
            6.4,
            9.86,
            -1.3
          ],
          size: [
            4.6,
            0.38,
            3.7
          ],
          geometryEffect: "parapet",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5C4B\u9802\u5973\u5152\u7246"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "parapet",
        stage: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-parapets"
      }
    },
    {
      id: "east-side-windows",
      name: "\u5074\u7ACB\u9762\u7A97\u683C",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "side-windows",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 5.2,
        height: 4.15,
        depth: 0.2
      },
      transform: {
        position: [
          10.72,
          2.88,
          -1.3
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            5.2,
            4.8,
            0.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-side-windows",
          seamRefs: [],
          detachableFragments: [
            "east-side-windows"
          ],
          breakImpulse: 0,
          debrisMaterial: "glass"
        }
      },
      material: "glass",
      materialLayers: [
        "glass"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-side-windows-shape",
          type: "raised ridge",
          placement: [
            9.72,
            3.25,
            -1.3
          ],
          size: [
            5.2,
            4.8,
            0.2
          ],
          geometryEffect: "side-windows",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5074\u7ACB\u9762\u7A97\u683C"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "side-windows",
        stage: 1,
        columns: 3,
        rows: 3,
        side: "east"
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(152, 175, 179, 1)",
        secondaryAlbedo: "rgba(152, 175, 179, 1)",
        materialClass: "glass",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-side-windows"
      }
    },
    {
      id: "central-windows",
      name: "\u4E2D\u592E\u7ACB\u9762\u7A97\u683C",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "windows",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 6,
        height: 4.8,
        depth: 0.2
      },
      transform: {
        position: [
          1,
          3.0500000000000003,
          0.95
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            6,
            4.8,
            0.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "central-windows",
          seamRefs: [],
          detachableFragments: [
            "central-windows"
          ],
          breakImpulse: 0,
          debrisMaterial: "glass"
        }
      },
      material: "glass",
      materialLayers: [
        "glass"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "central-windows-shape",
          type: "raised ridge",
          placement: [
            0,
            3.2,
            0.95
          ],
          size: [
            6,
            4.8,
            0.2
          ],
          geometryEffect: "windows",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u4E2D\u592E\u7ACB\u9762\u7A97\u683C"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "windows",
        stage: 1,
        columns: 4,
        rows: 3
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(152, 175, 179, 1)",
        secondaryAlbedo: "rgba(152, 175, 179, 1)",
        materialClass: "glass",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "central-windows"
      }
    },
    {
      id: "tower-clock",
      name: "\u5713\u5F62\u6642\u9418",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "clock",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 1.38,
        height: 1.38,
        depth: 0.2
      },
      transform: {
        position: [
          1,
          12.65,
          1.075
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            1.38,
            1.38,
            0.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "tower-clock",
          seamRefs: [],
          detachableFragments: [
            "tower-clock"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "tower-clock-shape",
          type: "raised ridge",
          placement: [
            0,
            12.21,
            1.075
          ],
          size: [
            1.38,
            1.38,
            0.2
          ],
          geometryEffect: "clock",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5713\u5F62\u6642\u9418"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "clock",
        stage: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "tower-clock"
      }
    },
    {
      id: "tower-window",
      name: "\u9418\u6A13\u9577\u62F1\u7A97",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "arched-window",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 1,
        height: 2.3,
        depth: 0.18
      },
      transform: {
        position: [
          1,
          10.05,
          1.045
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            1,
            2.7,
            0.18
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "tower-window",
          seamRefs: [],
          detachableFragments: [
            "tower-window"
          ],
          breakImpulse: 0,
          debrisMaterial: "glass"
        }
      },
      material: "glass",
      materialLayers: [
        "glass"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "tower-window-shape",
          type: "raised ridge",
          placement: [
            0,
            8.95,
            1.045
          ],
          size: [
            1,
            2.7,
            0.18
          ],
          geometryEffect: "arched-window",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u9418\u6A13\u9577\u62F1\u7A97"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "arched-window",
        stage: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(152, 175, 179, 1)",
        secondaryAlbedo: "rgba(152, 175, 179, 1)",
        materialClass: "glass",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "tower-window"
      }
    },
    {
      id: "tower-lower-window",
      name: "\u9418\u6A13\u5E95\u5C64\u7A97",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "windows",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 1.2,
        height: 1.15,
        depth: 0.2
      },
      transform: {
        position: [
          1,
          7.65,
          1.055
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            1.2,
            1.15,
            0.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "tower-lower-window",
          seamRefs: [],
          detachableFragments: [
            "tower-lower-window"
          ],
          breakImpulse: 0,
          debrisMaterial: "glass"
        }
      },
      material: "glass",
      materialLayers: [
        "glass"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "tower-lower-window-shape",
          type: "raised ridge",
          placement: [
            0,
            6.3,
            1.055
          ],
          size: [
            1.2,
            1.15,
            0.2
          ],
          geometryEffect: "windows",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u9418\u6A13\u5E95\u5C64\u7A97"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "windows",
        stage: 1,
        columns: 1,
        rows: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(152, 175, 179, 1)",
        secondaryAlbedo: "rgba(152, 175, 179, 1)",
        materialClass: "glass",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "tower-lower-window"
      }
    },
    {
      id: "balcony",
      name: "\u96D9\u62F1\u967D\u53F0",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "balcony",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 3.65,
        height: 1.95,
        depth: 1.65
      },
      transform: {
        position: [
          1,
          5.3,
          1.98
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            3.65,
            1.95,
            1.65
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "balcony",
          seamRefs: [],
          detachableFragments: [
            "balcony"
          ],
          breakImpulse: 0,
          debrisMaterial: "stone"
        }
      },
      material: "stone",
      materialLayers: [
        "stone"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "balcony-shape",
          type: "raised ridge",
          placement: [
            0,
            4.5,
            1.98
          ],
          size: [
            3.65,
            1.95,
            1.65
          ],
          geometryEffect: "balcony",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u96D9\u62F1\u967D\u53F0"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "balcony",
        stage: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(226, 204, 177, 1)",
        secondaryAlbedo: "rgba(226, 204, 177, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "balcony"
      }
    },
    {
      id: "stairs",
      name: "\u4E2D\u592E\u968E\u68AF",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "stairs",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 4.2,
        height: 1.16,
        depth: 2.6
      },
      transform: {
        position: [
          1,
          0.05,
          5.35
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            4.2,
            0.82,
            2.6
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "stairs",
          seamRefs: [],
          detachableFragments: [
            "stairs"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "stairs-shape",
          type: "raised ridge",
          placement: [
            0,
            0.05,
            5.35
          ],
          size: [
            4.2,
            0.82,
            2.6
          ],
          geometryEffect: "stairs",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u4E2D\u592E\u968E\u68AF"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "stairs",
        stage: 1,
        count: 9
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "stairs"
      }
    },
    {
      id: "pavement",
      name: "\u524D\u65B9\u4EBA\u884C\u9053",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "pavement",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 27,
        height: 0.13,
        depth: 1.7
      },
      transform: {
        position: [
          0,
          0.065,
          6.46
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            27,
            0.13,
            1.7
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "pavement",
          seamRefs: [],
          detachableFragments: [
            "pavement"
          ],
          breakImpulse: 0,
          debrisMaterial: "paving"
        }
      },
      material: "paving",
      materialLayers: [
        "paving"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "pavement-shape",
          type: "raised ridge",
          placement: [
            0,
            0.065,
            6.46
          ],
          size: [
            27,
            0.13,
            1.7
          ],
          geometryEffect: "pavement",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u524D\u65B9\u4EBA\u884C\u9053"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "pavement",
        stage: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(250, 236, 219, 1)",
        secondaryAlbedo: "rgba(250, 236, 219, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "pavement"
      }
    },
    {
      id: "road",
      name: "\u6821\u9580\u524D\u9053\u8DEF",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "road",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 26.8,
        height: 0.06,
        depth: 1.8
      },
      transform: {
        position: [
          0,
          0.12,
          7.65
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            26.8,
            0.06,
            2.7
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "road",
          seamRefs: [],
          detachableFragments: [
            "road"
          ],
          breakImpulse: 0,
          debrisMaterial: "road"
        }
      },
      material: "road",
      materialLayers: [
        "road"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "road-shape",
          type: "raised ridge",
          placement: [
            0,
            0.025,
            7.9
          ],
          size: [
            26.8,
            0.06,
            2.7
          ],
          geometryEffect: "road",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u6821\u9580\u524D\u9053\u8DEF"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "road",
        stage: 0
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(209, 191, 175, 1)",
        secondaryAlbedo: "rgba(209, 191, 175, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "road"
      }
    },
    {
      id: "roof-dormers",
      name: "\u5165\u53E3\u56DB\u8001\u864E\u7A97",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "dormers",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 8.4,
        height: 0.88,
        depth: 0.74
      },
      transform: {
        position: [
          1,
          4.35,
          4.08
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            8.4,
            0.88,
            0.74
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "roof-dormers",
          seamRefs: [],
          detachableFragments: [
            "roof-dormers"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "roof-dormers-shape",
          type: "raised ridge",
          placement: [
            0,
            3.8,
            4.08
          ],
          size: [
            8.4,
            0.88,
            0.74
          ],
          geometryEffect: "dormers",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5165\u53E3\u56DB\u8001\u864E\u7A97"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "dormers",
        stage: 1,
        count: 4
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "roof-dormers"
      }
    },
    {
      id: "central-parapet",
      name: "\u4E2D\u592E\u5C4B\u9802\u570D\u7246",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "parapet",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 4.4,
        height: 0.33,
        depth: 3.6
      },
      transform: {
        position: [
          1,
          10.34,
          -1.7
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            4.4,
            0.33,
            3.6
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "central-parapet",
          seamRefs: [],
          detachableFragments: [
            "central-parapet"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "central-parapet-shape",
          type: "raised ridge",
          placement: [
            0,
            10.49,
            -1.7
          ],
          size: [
            4.4,
            0.33,
            3.6
          ],
          geometryEffect: "parapet",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u4E2D\u592E\u5C4B\u9802\u570D\u7246"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "parapet",
        stage: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "central-parapet"
      }
    },
    {
      id: "front-plaque",
      name: "\u671D\u967D\u79D1\u6280\u5927\u5B78\u9298\u724C",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "plaque",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 5.7,
        height: 0.83,
        depth: 0.2
      },
      transform: {
        position: [
          0,
          -0.5,
          8.83
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            5.7,
            0.83,
            0.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "front-plaque",
          seamRefs: [],
          detachableFragments: [
            "front-plaque"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "front-plaque-shape",
          type: "raised ridge",
          placement: [
            0,
            -0.5,
            8.83
          ],
          size: [
            5.7,
            0.83,
            0.2
          ],
          geometryEffect: "plaque",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u671D\u967D\u79D1\u6280\u5927\u5B78\u9298\u724C"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "plaque",
        stage: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "front-plaque"
      }
    },
    {
      id: "west-hedges",
      name: "\u66F2\u7DDA\u4FEE\u526A\u7DA0\u7C6C",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "hedges",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 7,
        height: 0.7,
        depth: 2.35
      },
      transform: {
        position: [
          -6.3,
          0.36,
          4.6
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            7,
            0.7,
            2.35
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-hedges",
          seamRefs: [],
          detachableFragments: [
            "west-hedges"
          ],
          breakImpulse: 0,
          debrisMaterial: "grass"
        }
      },
      material: "grass",
      materialLayers: [
        "grass"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-hedges-shape",
          type: "raised ridge",
          placement: [
            -6.3,
            0.36,
            4.6
          ],
          size: [
            7,
            0.7,
            2.35
          ],
          geometryEffect: "hedges",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u66F2\u7DDA\u4FEE\u526A\u7DA0\u7C6C"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "hedges",
        stage: 1,
        side: -1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(176, 173, 60, 1)",
        secondaryAlbedo: "rgba(176, 173, 60, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-hedges"
      }
    },
    {
      id: "west-tree-0",
      name: "\u5206\u5C64\u95CA\u8449\u6A39",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "ellipsoid",
      topologyClass: "continuous-sculpt",
      topologyRationale: "Overlapping rounded botanical volumes",
      geometryDescriptor: {
        topologyIntent: "tree",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 3.4,
        height: 6.8,
        depth: 3.4
      },
      transform: {
        position: [
          -10.5,
          0.3,
          -4.4
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            3.4,
            6.8,
            3.4
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-tree-0",
          seamRefs: [],
          detachableFragments: [
            "west-tree-0"
          ],
          breakImpulse: 0,
          debrisMaterial: "foliage"
        }
      },
      material: "foliage",
      materialLayers: [
        "foliage"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-tree-0-shape",
          type: "raised ridge",
          placement: [
            -10.5,
            0.3,
            -4.4
          ],
          size: [
            3.4,
            6.8,
            3.4
          ],
          geometryEffect: "tree",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5206\u5C64\u95CA\u8449\u6A39"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "tree",
        stage: 0,
        seed: 20,
        canopyRecipe: {
          tierCount: 6,
          verticalRadius: 0.48,
          subclustersPerTier: 3,
          branchAttachment: "trunk to tier centre"
        }
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(166, 171, 71, 1)",
        secondaryAlbedo: "rgba(166, 171, 71, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-tree-0"
      }
    },
    {
      id: "west-tree-1",
      name: "\u5206\u5C64\u95CA\u8449\u6A39",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "ellipsoid",
      topologyClass: "continuous-sculpt",
      topologyRationale: "Overlapping rounded botanical volumes",
      geometryDescriptor: {
        topologyIntent: "tree",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 3.4,
        height: 6.4,
        depth: 3.4
      },
      transform: {
        position: [
          -10.799999999999999,
          0.3,
          -1.45
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            3.4,
            6.4,
            3.4
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-tree-1",
          seamRefs: [],
          detachableFragments: [
            "west-tree-1"
          ],
          breakImpulse: 0,
          debrisMaterial: "foliage"
        }
      },
      material: "foliage",
      materialLayers: [
        "foliage"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-tree-1-shape",
          type: "raised ridge",
          placement: [
            -10.799999999999999,
            0.3,
            -1.45
          ],
          size: [
            3.4,
            6.4,
            3.4
          ],
          geometryEffect: "tree",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5206\u5C64\u95CA\u8449\u6A39"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "tree",
        stage: 0,
        seed: 21,
        canopyRecipe: {
          tierCount: 6,
          verticalRadius: 0.48,
          subclustersPerTier: 3,
          branchAttachment: "trunk to tier centre"
        }
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(166, 171, 71, 1)",
        secondaryAlbedo: "rgba(166, 171, 71, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-tree-1"
      }
    },
    {
      id: "west-tree-2",
      name: "\u5206\u5C64\u95CA\u8449\u6A39",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "ellipsoid",
      topologyClass: "continuous-sculpt",
      topologyRationale: "Overlapping rounded botanical volumes",
      geometryDescriptor: {
        topologyIntent: "tree",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 3.4,
        height: 5.1,
        depth: 3.4
      },
      transform: {
        position: [
          -10.5,
          0.3,
          1.45
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            3.4,
            5.1,
            3.4
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-tree-2",
          seamRefs: [],
          detachableFragments: [
            "west-tree-2"
          ],
          breakImpulse: 0,
          debrisMaterial: "foliage"
        }
      },
      material: "foliage",
      materialLayers: [
        "foliage"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-tree-2-shape",
          type: "raised ridge",
          placement: [
            -10.5,
            0.3,
            1.45
          ],
          size: [
            3.4,
            5.1,
            3.4
          ],
          geometryEffect: "tree",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5206\u5C64\u95CA\u8449\u6A39"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "tree",
        stage: 0,
        seed: 22,
        canopyRecipe: {
          tierCount: 6,
          verticalRadius: 0.48,
          subclustersPerTier: 3,
          branchAttachment: "trunk to tier centre"
        }
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(166, 171, 71, 1)",
        secondaryAlbedo: "rgba(166, 171, 71, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-tree-2"
      }
    },
    {
      id: "west-shrubs",
      name: "\u5EAD\u5712\u704C\u6728\u82B1\u53E2",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "shrubs",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 7,
        height: 0.6,
        depth: 2.8
      },
      transform: {
        position: [
          -7,
          0.43,
          3.85
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            7,
            0.6,
            2.8
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-shrubs",
          seamRefs: [],
          detachableFragments: [
            "west-shrubs"
          ],
          breakImpulse: 0,
          debrisMaterial: "foliage"
        }
      },
      material: "foliage",
      materialLayers: [
        "foliage"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-shrubs-shape",
          type: "raised ridge",
          placement: [
            -7,
            0.43,
            3.85
          ],
          size: [
            7,
            0.6,
            2.8
          ],
          geometryEffect: "shrubs",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5EAD\u5712\u704C\u6728\u82B1\u53E2"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "shrubs",
        stage: 2,
        side: -1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(166, 171, 71, 1)",
        secondaryAlbedo: "rgba(166, 171, 71, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-shrubs"
      }
    },
    {
      id: "east-hedges",
      name: "\u66F2\u7DDA\u4FEE\u526A\u7DA0\u7C6C",
      level: "meso",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "hedges",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 7,
        height: 0.7,
        depth: 2.35
      },
      transform: {
        position: [
          6.3,
          0.36,
          4.6
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            7,
            0.7,
            2.35
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-hedges",
          seamRefs: [],
          detachableFragments: [
            "east-hedges"
          ],
          breakImpulse: 0,
          debrisMaterial: "grass"
        }
      },
      material: "grass",
      materialLayers: [
        "grass"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-hedges-shape",
          type: "raised ridge",
          placement: [
            6.3,
            0.36,
            4.6
          ],
          size: [
            7,
            0.7,
            2.35
          ],
          geometryEffect: "hedges",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u66F2\u7DDA\u4FEE\u526A\u7DA0\u7C6C"
      ],
      fidelityTier: "structural-pass",
      campus: {
        kind: "hedges",
        stage: 1,
        side: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(176, 173, 60, 1)",
        secondaryAlbedo: "rgba(176, 173, 60, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-hedges"
      }
    },
    {
      id: "east-tree-0",
      name: "\u5206\u5C64\u95CA\u8449\u6A39",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "ellipsoid",
      topologyClass: "continuous-sculpt",
      topologyRationale: "Overlapping rounded botanical volumes",
      geometryDescriptor: {
        topologyIntent: "tree",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 3.4,
        height: 7.8,
        depth: 3.4
      },
      transform: {
        position: [
          10.5,
          0.3,
          -4.4
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            3.4,
            6.8,
            3.4
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-tree-0",
          seamRefs: [],
          detachableFragments: [
            "east-tree-0"
          ],
          breakImpulse: 0,
          debrisMaterial: "foliage"
        }
      },
      material: "foliage",
      materialLayers: [
        "foliage"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-tree-0-shape",
          type: "raised ridge",
          placement: [
            10.5,
            0.3,
            -4.4
          ],
          size: [
            3.4,
            6.8,
            3.4
          ],
          geometryEffect: "tree",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5206\u5C64\u95CA\u8449\u6A39"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "tree",
        stage: 0,
        seed: 24,
        canopyRecipe: {
          tierCount: 6,
          verticalRadius: 0.48,
          subclustersPerTier: 3,
          branchAttachment: "trunk to tier centre"
        }
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(166, 171, 71, 1)",
        secondaryAlbedo: "rgba(166, 171, 71, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-tree-0"
      }
    },
    {
      id: "east-tree-1",
      name: "\u5206\u5C64\u95CA\u8449\u6A39",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "ellipsoid",
      topologyClass: "continuous-sculpt",
      topologyRationale: "Overlapping rounded botanical volumes",
      geometryDescriptor: {
        topologyIntent: "tree",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 3.4,
        height: 6.4,
        depth: 3.4
      },
      transform: {
        position: [
          10.799999999999999,
          0.3,
          -1.45
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            3.4,
            6.4,
            3.4
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-tree-1",
          seamRefs: [],
          detachableFragments: [
            "east-tree-1"
          ],
          breakImpulse: 0,
          debrisMaterial: "foliage"
        }
      },
      material: "foliage",
      materialLayers: [
        "foliage"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-tree-1-shape",
          type: "raised ridge",
          placement: [
            10.799999999999999,
            0.3,
            -1.45
          ],
          size: [
            3.4,
            6.4,
            3.4
          ],
          geometryEffect: "tree",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5206\u5C64\u95CA\u8449\u6A39"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "tree",
        stage: 0,
        seed: 25,
        canopyRecipe: {
          tierCount: 6,
          verticalRadius: 0.48,
          subclustersPerTier: 3,
          branchAttachment: "trunk to tier centre"
        }
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(166, 171, 71, 1)",
        secondaryAlbedo: "rgba(166, 171, 71, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-tree-1"
      }
    },
    {
      id: "east-tree-2",
      name: "\u5206\u5C64\u95CA\u8449\u6A39",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "ellipsoid",
      topologyClass: "continuous-sculpt",
      topologyRationale: "Overlapping rounded botanical volumes",
      geometryDescriptor: {
        topologyIntent: "tree",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 3.4,
        height: 5.1,
        depth: 3.4
      },
      transform: {
        position: [
          10.5,
          0.3,
          1.45
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            3.4,
            5.1,
            3.4
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-tree-2",
          seamRefs: [],
          detachableFragments: [
            "east-tree-2"
          ],
          breakImpulse: 0,
          debrisMaterial: "foliage"
        }
      },
      material: "foliage",
      materialLayers: [
        "foliage"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-tree-2-shape",
          type: "raised ridge",
          placement: [
            10.5,
            0.3,
            1.45
          ],
          size: [
            3.4,
            5.1,
            3.4
          ],
          geometryEffect: "tree",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5206\u5C64\u95CA\u8449\u6A39"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "tree",
        stage: 0,
        seed: 26,
        canopyRecipe: {
          tierCount: 6,
          verticalRadius: 0.48,
          subclustersPerTier: 3,
          branchAttachment: "trunk to tier centre"
        }
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(166, 171, 71, 1)",
        secondaryAlbedo: "rgba(166, 171, 71, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-tree-2"
      }
    },
    {
      id: "east-shrubs",
      name: "\u5EAD\u5712\u704C\u6728\u82B1\u53E2",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "shrubs",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 7,
        height: 0.6,
        depth: 2.8
      },
      transform: {
        position: [
          7,
          0.43,
          3.85
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            7,
            0.6,
            2.8
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-shrubs",
          seamRefs: [],
          detachableFragments: [
            "east-shrubs"
          ],
          breakImpulse: 0,
          debrisMaterial: "foliage"
        }
      },
      material: "foliage",
      materialLayers: [
        "foliage"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-shrubs-shape",
          type: "raised ridge",
          placement: [
            7,
            0.43,
            3.85
          ],
          size: [
            7,
            0.6,
            2.8
          ],
          geometryEffect: "shrubs",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5EAD\u5712\u704C\u6728\u82B1\u53E2"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "shrubs",
        stage: 2,
        side: 1
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(166, 171, 71, 1)",
        secondaryAlbedo: "rgba(166, 171, 71, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-shrubs"
      }
    },
    {
      id: "lamp-system",
      name: "\u56DB\u5EA7\u8DEF\u71C8",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "lamps",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 23,
        height: 1.7,
        depth: 0.2
      },
      transform: {
        position: [
          0,
          0.18,
          6.45
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            23,
            1.7,
            0.2
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "lamp-system",
          seamRefs: [],
          detachableFragments: [
            "lamp-system"
          ],
          breakImpulse: 0,
          debrisMaterial: "metal"
        }
      },
      material: "metal",
      materialLayers: [
        "metal"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "lamp-system-shape",
          type: "raised ridge",
          placement: [
            0,
            0.18,
            6.45
          ],
          size: [
            23,
            1.7,
            0.2
          ],
          geometryEffect: "lamps",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u56DB\u5EA7\u8DEF\u71C8"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "lamps",
        stage: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(102, 92, 78, 1)",
        secondaryAlbedo: "rgba(102, 92, 78, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "lamp-system"
      }
    },
    {
      id: "pedestrians",
      name: "\u6821\u5712\u884C\u4EBA",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "people",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 22,
        height: 0.62,
        depth: 0.5
      },
      transform: {
        position: [
          0,
          0.19,
          6.46
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            22,
            0.62,
            0.5
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "pedestrians",
          seamRefs: [],
          detachableFragments: [
            "pedestrians"
          ],
          breakImpulse: 0,
          debrisMaterial: "paving"
        }
      },
      material: "paving",
      materialLayers: [
        "paving"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "pedestrians-shape",
          type: "raised ridge",
          placement: [
            0,
            0.19,
            6.46
          ],
          size: [
            22,
            0.62,
            0.5
          ],
          geometryEffect: "people",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u6821\u5712\u884C\u4EBA"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "people",
        stage: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(250, 236, 219, 1)",
        secondaryAlbedo: "rgba(250, 236, 219, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "pedestrians"
      }
    },
    {
      id: "road-markings",
      name: "\u884C\u7A7F\u7DDA\u8207\u9053\u8DEF\u6A19\u7DDA",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "markings",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 26,
        height: 0.02,
        depth: 2.65
      },
      transform: {
        position: [
          0,
          0.063,
          7.9
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            26,
            0.02,
            2.65
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "road-markings",
          seamRefs: [],
          detachableFragments: [
            "road-markings"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "road-markings-shape",
          type: "raised ridge",
          placement: [
            0,
            0.063,
            7.9
          ],
          size: [
            26,
            0.02,
            2.65
          ],
          geometryEffect: "markings",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u884C\u7A7F\u7DDA\u8207\u9053\u8DEF\u6A19\u7DDA"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "markings",
        stage: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "road-markings"
      }
    },
    {
      id: "campus-sign",
      name: "\u5EAD\u5712\u76F4\u7ACB\u6821\u724C",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "sign",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 1.1,
        height: 1.6,
        depth: 0.24
      },
      transform: {
        position: [
          -11.4,
          0.2,
          4.6
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            1.1,
            1.6,
            0.24
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "campus-sign",
          seamRefs: [],
          detachableFragments: [
            "campus-sign"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "campus-sign-shape",
          type: "raised ridge",
          placement: [
            -11.4,
            0.2,
            4.6
          ],
          size: [
            1.1,
            1.6,
            0.24
          ],
          geometryEffect: "sign",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5EAD\u5712\u76F4\u7ACB\u6821\u724C"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "sign",
        stage: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "campus-sign"
      }
    },
    {
      id: "roof-tiles",
      name: "\u8868\u9762\u7D30\u7BC0 roof-tiles",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "relief",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "east-roof",
      attachment: null,
      dimensions: {
        width: 0.1,
        height: 0.1,
        depth: 0.1
      },
      transform: {
        position: [
          0,
          0,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            0.1,
            0.1,
            0.1
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "roof-tiles",
          seamRefs: [],
          detachableFragments: [
            "roof-tiles"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "roof-tiles-shape",
          type: "raised ridge",
          placement: [
            0,
            0,
            0
          ],
          size: [
            0.1,
            0.1,
            0.1
          ],
          geometryEffect: "relief",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u8868\u9762\u7D30\u7BC0 roof-tiles"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "relief",
        stage: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "roof-tiles"
      }
    },
    {
      id: "brick-joints",
      name: "\u8868\u9762\u7D30\u7BC0 brick-joints",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "relief",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "arcade",
      attachment: null,
      dimensions: {
        width: 0.1,
        height: 0.1,
        depth: 0.1
      },
      transform: {
        position: [
          0,
          0,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            0.1,
            0.1,
            0.1
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "brick-joints",
          seamRefs: [],
          detachableFragments: [
            "brick-joints"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "brick-joints-shape",
          type: "raised ridge",
          placement: [
            0,
            0,
            0
          ],
          size: [
            0.1,
            0.1,
            0.1
          ],
          geometryEffect: "relief",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u8868\u9762\u7D30\u7BC0 brick-joints"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "relief",
        stage: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "brick-joints"
      }
    },
    {
      id: "stone-joints",
      name: "\u8868\u9762\u7D30\u7BC0 stone-joints",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "relief",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "tower",
      attachment: null,
      dimensions: {
        width: 0.1,
        height: 0.1,
        depth: 0.1
      },
      transform: {
        position: [
          0,
          0,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            0.1,
            0.1,
            0.1
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "stone-joints",
          seamRefs: [],
          detachableFragments: [
            "stone-joints"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "stone-joints-shape",
          type: "raised ridge",
          placement: [
            0,
            0,
            0
          ],
          size: [
            0.1,
            0.1,
            0.1
          ],
          geometryEffect: "relief",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u8868\u9762\u7D30\u7BC0 stone-joints"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "relief",
        stage: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "stone-joints"
      }
    },
    {
      id: "clock-marks",
      name: "\u8868\u9762\u7D30\u7BC0 clock-marks",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "relief",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "tower-clock",
      attachment: null,
      dimensions: {
        width: 0.1,
        height: 0.1,
        depth: 0.1
      },
      transform: {
        position: [
          0,
          0,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            0.1,
            0.1,
            0.1
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "clock-marks",
          seamRefs: [],
          detachableFragments: [
            "clock-marks"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "clock-marks-shape",
          type: "raised ridge",
          placement: [
            0,
            0,
            0
          ],
          size: [
            0.1,
            0.1,
            0.1
          ],
          geometryEffect: "relief",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u8868\u9762\u7D30\u7BC0 clock-marks"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "relief",
        stage: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "clock-marks"
      }
    },
    {
      id: "balustrade",
      name: "\u8868\u9762\u7D30\u7BC0 balustrade",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "relief",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "balcony",
      attachment: null,
      dimensions: {
        width: 0.1,
        height: 0.1,
        depth: 0.1
      },
      transform: {
        position: [
          0,
          0,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            0.1,
            0.1,
            0.1
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "balustrade",
          seamRefs: [],
          detachableFragments: [
            "balustrade"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "balustrade-shape",
          type: "raised ridge",
          placement: [
            0,
            0,
            0
          ],
          size: [
            0.1,
            0.1,
            0.1
          ],
          geometryEffect: "relief",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u8868\u9762\u7D30\u7BC0 balustrade"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "relief",
        stage: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "balustrade"
      }
    },
    {
      id: "window-mullions",
      name: "\u8868\u9762\u7D30\u7BC0 window-mullions",
      level: "micro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "box",
      topologyClass: "assembled-solid",
      topologyRationale: "Discrete architectural solid with specified planar and curved boundaries",
      geometryDescriptor: {
        topologyIntent: "relief",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "east-windows",
      attachment: null,
      dimensions: {
        width: 0.1,
        height: 0.1,
        depth: 0.1
      },
      transform: {
        position: [
          0,
          0,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            0.1,
            0.1,
            0.1
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "window-mullions",
          seamRefs: [],
          detachableFragments: [
            "window-mullions"
          ],
          breakImpulse: 0,
          debrisMaterial: "trim"
        }
      },
      material: "trim",
      materialLayers: [
        "trim"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "window-mullions-shape",
          type: "raised ridge",
          placement: [
            0,
            0,
            0
          ],
          size: [
            0.1,
            0.1,
            0.1
          ],
          geometryEffect: "relief",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u8868\u9762\u7D30\u7BC0 window-mullions"
      ],
      fidelityTier: "form-refinement",
      campus: {
        kind: "relief",
        stage: 2
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(239, 215, 188, 1)",
        secondaryAlbedo: "rgba(239, 215, 188, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "window-mullions"
      }
    },
    {
      id: "west-rear-tree",
      name: "\u5F8C\u65B9\u95CA\u8449\u6A39",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "ellipsoid",
      topologyClass: "continuous-sculpt",
      topologyRationale: "Overlapping rounded botanical volumes",
      geometryDescriptor: {
        topologyIntent: "tree",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 3.4,
        height: 6.7,
        depth: 3.4
      },
      transform: {
        position: [
          -8.7,
          0.3,
          -5.1
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            3.4,
            6.8,
            3.4
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "west-tree-0",
          seamRefs: [],
          detachableFragments: [
            "west-tree-0"
          ],
          breakImpulse: 0,
          debrisMaterial: "foliage"
        }
      },
      material: "foliage",
      materialLayers: [
        "foliage"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "west-tree-0-shape",
          type: "raised ridge",
          placement: [
            -10.5,
            0.3,
            -4.4
          ],
          size: [
            3.4,
            6.8,
            3.4
          ],
          geometryEffect: "tree",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5206\u5C64\u95CA\u8449\u6A39"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "tree",
        stage: 0,
        seed: 39,
        canopyRecipe: {
          tierCount: 6,
          verticalRadius: 0.48,
          subclustersPerTier: 3,
          branchAttachment: "trunk to tier centre"
        }
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(166, 171, 71, 1)",
        secondaryAlbedo: "rgba(166, 171, 71, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "west-rear-tree"
      }
    },
    {
      id: "east-rear-tree",
      name: "\u5F8C\u65B9\u95CA\u8449\u6A39",
      level: "macro",
      role: "architectural-assembly",
      importance: 0.9,
      confidence: 0.86,
      primitive: "ellipsoid",
      topologyClass: "continuous-sculpt",
      topologyRationale: "Overlapping rounded botanical volumes",
      geometryDescriptor: {
        topologyIntent: "tree",
        edgeTreatment: {
          type: "bevel",
          bevelRadius: 0.04,
          segments: 3
        },
        deformationStack: [],
        uvStrategy: "generated procedural coordinates",
        normalStrategy: "vertex normals from generated geometry"
      },
      parent: "root",
      attachment: null,
      dimensions: {
        width: 3.4,
        height: 8.3,
        depth: 3.4
      },
      transform: {
        position: [
          8.7,
          0.3,
          -5.1
        ],
        rotation: [
          0,
          0,
          0
        ],
        scale: [
          1,
          1,
          1
        ]
      },
      actionProfile: {
        animationRole: "static-part",
        pivot: {
          mode: "center",
          localPosition: [
            0,
            0,
            0
          ],
          axis: [
            0,
            1,
            0
          ],
          confidence: 0.86
        },
        transformChannels: {
          translate: true,
          rotate: true,
          scale: true,
          bend: false,
          twist: false,
          detach: false,
          visibility: true,
          materialState: true
        },
        sockets: [
          {
            id: "assembly-origin",
            position: [
              0,
              0,
              0
            ]
          }
        ],
        collider: {
          type: "box",
          offset: [
            0,
            0,
            0
          ],
          scale: [
            3.4,
            6.8,
            3.4
          ],
          isTrigger: false,
          notes: "Relative-size bounding proxy, not structural engineering dimensions"
        },
        constraints: [],
        destruction: {
          breakable: false,
          fractureGroup: "east-tree-0",
          seamRefs: [],
          detachableFragments: [
            "east-tree-0"
          ],
          breakImpulse: 0,
          debrisMaterial: "foliage"
        }
      },
      material: "foliage",
      materialLayers: [
        "foliage"
      ],
      deformations: [],
      joints: [],
      seams: [],
      localFeatures: [
        {
          id: "east-tree-0-shape",
          type: "raised ridge",
          placement: [
            10.5,
            0.3,
            -4.4
          ],
          size: [
            3.4,
            6.8,
            3.4
          ],
          geometryEffect: "tree",
          materialEffect: "subtle relief shadow",
          confidence: 0.86,
          evidenceRefs: [
            "full-object"
          ]
        }
      ],
      surfaceDetail: {
        macroRoughness: 0,
        microRoughness: 0,
        bumpAmplitude: 0,
        normalPattern: "",
        displacementPattern: "",
        occlusionPattern: "",
        edgeWearPattern: "",
        notes: ""
      },
      evidenceRefs: [
        "full-object"
      ],
      details: [
        "\u5206\u5C64\u95CA\u8449\u6A39"
      ],
      fidelityTier: "blockout",
      campus: {
        kind: "tree",
        stage: 0,
        seed: 41,
        canopyRecipe: {
          tierCount: 6,
          verticalRadius: 0.48,
          subclustersPerTier: 3,
          branchAttachment: "trunk to tier centre"
        }
      },
      colorMaterialRecipe: {
        dominantAlbedo: "rgba(166, 171, 71, 1)",
        secondaryAlbedo: "rgba(166, 171, 71, 1)",
        materialClass: "stone",
        materialClassConfidence: 0.75,
        evidenceRefs: [
          "full-object"
        ],
        componentId: "east-rear-tree"
      }
    }
  ],
  materials: [
    {
      id: "stone",
      name: "stone",
      type: "standard",
      shaderModel: "MeshStandardMaterial / PBR approximation",
      baseColor: "#e2ccb1",
      color: "#e2ccb1",
      albedo: {
        dominant: "#e2ccb1",
        secondary: [
          "#e2ccb1"
        ],
        samplingNotes: "Observed pixel crop 652,345,24,66; de-lighting required before map use"
      },
      colorVariation: {
        palette: [
          "#e2ccb1"
        ],
        pattern: "mottled",
        amplitude: 0.045,
        heightCorrelation: 0.3
      },
      textureResolution: 1024,
      textureProjection: {
        mode: "dominant-face-object-space",
        repeat: [
          1,
          1
        ],
        anisotropy: 8,
        texelDensityIntent: "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."
      },
      surfaceFrequencyBands: [
        {
          id: "macro",
          frequency: 2,
          amplitude: 0.42,
          role: "broad color and height breakup"
        },
        {
          id: "meso",
          frequency: 12,
          amplitude: 0.22,
          role: "ridges, pores, grain, dents, or equivalent visible relief"
        },
        {
          id: "micro",
          frequency: 56,
          amplitude: 0.08,
          role: "highlight breakup visible under grazing light"
        }
      ],
      roughness: {
        base: 0.83,
        variation: 0.15,
        map: "independent-procedural-field",
        localResponse: "higher roughness in cavities, lower roughness on worn edges"
      },
      metalness: {
        base: 0,
        variation: 0
      },
      normal: {
        pattern: "derived-from-independent-height-field",
        strength: 0.12,
        scale: 24,
        space: "tangent"
      },
      bump: {
        pattern: "fine grain",
        amplitude: 0.012,
        scale: 20
      },
      displacement: {
        pattern: "none",
        amplitude: 0,
        scale: 1,
        silhouetteAffects: false
      },
      ambientOcclusion: {
        cavityStrength: 0.25,
        contactShadowBias: 0.35,
        notes: "Darken creases, seams, intersections, and recessed local features."
      },
      wear: {
        edgeWear: 0,
        scratches: [],
        chips: []
      },
      dirt: {
        amount: 0,
        cavityBias: 0,
        color: "#2F2A22"
      },
      localOverrides: [
        {
          id: "stone-variation",
          region: "component surfaces",
          color: "#e2ccb1",
          roughness: 0.77,
          evidenceRefs: [
            "full-object"
          ],
          description: "Subtle instance variation and contact-shaded relief"
        }
      ],
      shaderNotes: [
        "Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.",
        "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.",
        "Use normal/bump/displacement only when they map to observed surface relief.",
        "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."
      ],
      notes: "Sampled reference median; source lighting is not physical albedo",
      referencePbr: {
        version: "1.0",
        sourceImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\stone.png",
        extractor: "stage1_intake/extract_pbr_evidence.py",
        usable: true,
        confidence: 0.751,
        targetThreshold: 0.7,
        verdict: "pass",
        maps: {
          albedo: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\stone\\stone_albedo.png",
            url: "/pbr/stone/stone_albedo.png",
            channel: "albedo",
            source: "reference-pixel-extraction"
          },
          roughness: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\stone\\stone_roughness.png",
            url: "/pbr/stone/stone_roughness.png",
            channel: "roughness",
            source: "reference-pixel-extraction"
          },
          height: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\stone\\stone_height.png",
            url: "/pbr/stone/stone_height.png",
            channel: "height",
            source: "reference-pixel-extraction"
          },
          normal: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\stone\\stone_normal.png",
            url: "/pbr/stone/stone_normal.png",
            channel: "normal",
            source: "reference-pixel-extraction"
          },
          ao: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\stone\\stone_ao.png",
            url: "/pbr/stone/stone_ao.png",
            channel: "ao",
            source: "reference-pixel-extraction"
          }
        }
      },
      renderColor: "#baa281",
      renderNotes: "Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo."
    },
    {
      id: "brick",
      name: "brick",
      type: "standard",
      shaderModel: "MeshStandardMaterial / PBR approximation",
      baseColor: "#c56b41",
      color: "#c56b41",
      albedo: {
        dominant: "#c56b41",
        secondary: [
          "#c56b41"
        ],
        samplingNotes: "Observed pixel crop 627,529,40,30; de-lighting required before map use"
      },
      colorVariation: {
        palette: [
          "#c56b41"
        ],
        pattern: "mottled",
        amplitude: 0.045,
        heightCorrelation: 0.3
      },
      textureResolution: 1024,
      textureProjection: {
        mode: "dominant-face-object-space",
        repeat: [
          1,
          1
        ],
        anisotropy: 8,
        texelDensityIntent: "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."
      },
      surfaceFrequencyBands: [
        {
          id: "macro",
          frequency: 2,
          amplitude: 0.42,
          role: "broad color and height breakup"
        },
        {
          id: "meso",
          frequency: 12,
          amplitude: 0.22,
          role: "ridges, pores, grain, dents, or equivalent visible relief"
        },
        {
          id: "micro",
          frequency: 56,
          amplitude: 0.08,
          role: "highlight breakup visible under grazing light"
        }
      ],
      roughness: {
        base: 0.83,
        variation: 0.15,
        map: "independent-procedural-field",
        localResponse: "higher roughness in cavities, lower roughness on worn edges"
      },
      metalness: {
        base: 0,
        variation: 0
      },
      normal: {
        pattern: "derived-from-independent-height-field",
        strength: 0.12,
        scale: 24,
        space: "tangent"
      },
      bump: {
        pattern: "fine grain",
        amplitude: 0.012,
        scale: 20
      },
      displacement: {
        pattern: "none",
        amplitude: 0,
        scale: 1,
        silhouetteAffects: false
      },
      ambientOcclusion: {
        cavityStrength: 0.25,
        contactShadowBias: 0.35,
        notes: "Darken creases, seams, intersections, and recessed local features."
      },
      wear: {
        edgeWear: 0,
        scratches: [],
        chips: []
      },
      dirt: {
        amount: 0,
        cavityBias: 0,
        color: "#2F2A22"
      },
      localOverrides: [
        {
          id: "brick-variation",
          region: "component surfaces",
          color: "#c56b41",
          roughness: 0.77,
          evidenceRefs: [
            "full-object"
          ],
          description: "Subtle instance variation and contact-shaded relief"
        }
      ],
      shaderNotes: [
        "Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.",
        "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.",
        "Use normal/bump/displacement only when they map to observed surface relief.",
        "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."
      ],
      notes: "Sampled reference median; source lighting is not physical albedo",
      referencePbr: {
        version: "1.0",
        sourceImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\brick.png",
        extractor: "stage1_intake/extract_pbr_evidence.py",
        usable: true,
        confidence: 0.8,
        targetThreshold: 0.7,
        verdict: "pass",
        maps: {
          albedo: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\brick\\brick_albedo.png",
            url: "/pbr/brick/brick_albedo.png",
            channel: "albedo",
            source: "reference-pixel-extraction"
          },
          roughness: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\brick\\brick_roughness.png",
            url: "/pbr/brick/brick_roughness.png",
            channel: "roughness",
            source: "reference-pixel-extraction"
          },
          height: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\brick\\brick_height.png",
            url: "/pbr/brick/brick_height.png",
            channel: "height",
            source: "reference-pixel-extraction"
          },
          normal: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\brick\\brick_normal.png",
            url: "/pbr/brick/brick_normal.png",
            channel: "normal",
            source: "reference-pixel-extraction"
          },
          ao: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\brick\\brick_ao.png",
            url: "/pbr/brick/brick_ao.png",
            channel: "ao",
            source: "reference-pixel-extraction"
          }
        }
      },
      renderColor: "#bd5a2f",
      renderNotes: "Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo."
    },
    {
      id: "roof",
      name: "roof",
      type: "standard",
      shaderModel: "MeshStandardMaterial / PBR approximation",
      baseColor: "#b87c63",
      color: "#b87c63",
      albedo: {
        dominant: "#b87c63",
        secondary: [
          "#b87c63"
        ],
        samplingNotes: "Observed pixel crop 1170,396,63,25; de-lighting required before map use"
      },
      colorVariation: {
        palette: [
          "#b87c63"
        ],
        pattern: "mottled",
        amplitude: 0.045,
        heightCorrelation: 0.3
      },
      textureResolution: 1024,
      textureProjection: {
        mode: "dominant-face-object-space",
        repeat: [
          1,
          1
        ],
        anisotropy: 8,
        texelDensityIntent: "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."
      },
      surfaceFrequencyBands: [
        {
          id: "macro",
          frequency: 2,
          amplitude: 0.42,
          role: "broad color and height breakup"
        },
        {
          id: "meso",
          frequency: 12,
          amplitude: 0.22,
          role: "ridges, pores, grain, dents, or equivalent visible relief"
        },
        {
          id: "micro",
          frequency: 56,
          amplitude: 0.08,
          role: "highlight breakup visible under grazing light"
        }
      ],
      roughness: {
        base: 0.83,
        variation: 0.15,
        map: "independent-procedural-field",
        localResponse: "higher roughness in cavities, lower roughness on worn edges"
      },
      metalness: {
        base: 0,
        variation: 0
      },
      normal: {
        pattern: "derived-from-independent-height-field",
        strength: 0.12,
        scale: 24,
        space: "tangent"
      },
      bump: {
        pattern: "fine grain",
        amplitude: 0.012,
        scale: 20
      },
      displacement: {
        pattern: "none",
        amplitude: 0,
        scale: 1,
        silhouetteAffects: false
      },
      ambientOcclusion: {
        cavityStrength: 0.25,
        contactShadowBias: 0.35,
        notes: "Darken creases, seams, intersections, and recessed local features."
      },
      wear: {
        edgeWear: 0,
        scratches: [],
        chips: []
      },
      dirt: {
        amount: 0,
        cavityBias: 0,
        color: "#2F2A22"
      },
      localOverrides: [
        {
          id: "roof-variation",
          region: "component surfaces",
          color: "#b87c63",
          roughness: 0.77,
          evidenceRefs: [
            "full-object"
          ],
          description: "Subtle instance variation and contact-shaded relief"
        }
      ],
      shaderNotes: [
        "Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.",
        "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.",
        "Use normal/bump/displacement only when they map to observed surface relief.",
        "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."
      ],
      notes: "Sampled reference median; source lighting is not physical albedo",
      referencePbr: {
        version: "1.0",
        sourceImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\roof.png",
        extractor: "stage1_intake/extract_pbr_evidence.py",
        usable: true,
        confidence: 0.769,
        targetThreshold: 0.7,
        verdict: "pass",
        maps: {
          albedo: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\roof\\roof_albedo.png",
            url: "/pbr/roof/roof_albedo.png",
            channel: "albedo",
            source: "reference-pixel-extraction"
          },
          roughness: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\roof\\roof_roughness.png",
            url: "/pbr/roof/roof_roughness.png",
            channel: "roughness",
            source: "reference-pixel-extraction"
          },
          height: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\roof\\roof_height.png",
            url: "/pbr/roof/roof_height.png",
            channel: "height",
            source: "reference-pixel-extraction"
          },
          normal: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\roof\\roof_normal.png",
            url: "/pbr/roof/roof_normal.png",
            channel: "normal",
            source: "reference-pixel-extraction"
          },
          ao: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\roof\\roof_ao.png",
            url: "/pbr/roof/roof_ao.png",
            channel: "ao",
            source: "reference-pixel-extraction"
          }
        }
      },
      renderColor: "#a1654a",
      renderNotes: "Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo."
    },
    {
      id: "foliage",
      name: "foliage",
      type: "standard",
      shaderModel: "MeshStandardMaterial / PBR approximation",
      baseColor: "#a6ab47",
      color: "#a6ab47",
      albedo: {
        dominant: "#a6ab47",
        secondary: [
          "#a6ab47"
        ],
        samplingNotes: "Observed pixel crop 1273,483,53,31; de-lighting required before map use"
      },
      colorVariation: {
        palette: [
          "#a6ab47"
        ],
        pattern: "mottled",
        amplitude: 0.045,
        heightCorrelation: 0.3
      },
      textureResolution: 1024,
      textureProjection: {
        mode: "dominant-face-object-space",
        repeat: [
          1,
          1
        ],
        anisotropy: 8,
        texelDensityIntent: "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."
      },
      surfaceFrequencyBands: [
        {
          id: "macro",
          frequency: 2,
          amplitude: 0.42,
          role: "broad color and height breakup"
        },
        {
          id: "meso",
          frequency: 12,
          amplitude: 0.22,
          role: "ridges, pores, grain, dents, or equivalent visible relief"
        },
        {
          id: "micro",
          frequency: 56,
          amplitude: 0.08,
          role: "highlight breakup visible under grazing light"
        }
      ],
      roughness: {
        base: 0.83,
        variation: 0.15,
        map: "independent-procedural-field",
        localResponse: "higher roughness in cavities, lower roughness on worn edges"
      },
      metalness: {
        base: 0,
        variation: 0
      },
      normal: {
        pattern: "derived-from-independent-height-field",
        strength: 0.12,
        scale: 24,
        space: "tangent"
      },
      bump: {
        pattern: "fine grain",
        amplitude: 0.012,
        scale: 20
      },
      displacement: {
        pattern: "none",
        amplitude: 0,
        scale: 1,
        silhouetteAffects: false
      },
      ambientOcclusion: {
        cavityStrength: 0.25,
        contactShadowBias: 0.35,
        notes: "Darken creases, seams, intersections, and recessed local features."
      },
      wear: {
        edgeWear: 0,
        scratches: [],
        chips: []
      },
      dirt: {
        amount: 0,
        cavityBias: 0,
        color: "#2F2A22"
      },
      localOverrides: [
        {
          id: "foliage-variation",
          region: "component surfaces",
          color: "#a6ab47",
          roughness: 0.77,
          evidenceRefs: [
            "full-object"
          ],
          description: "Subtle instance variation and contact-shaded relief"
        }
      ],
      shaderNotes: [
        "Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.",
        "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.",
        "Use normal/bump/displacement only when they map to observed surface relief.",
        "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."
      ],
      notes: "Sampled reference median; source lighting is not physical albedo",
      referencePbr: {
        version: "1.0",
        sourceImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\foliage.png",
        extractor: "stage1_intake/extract_pbr_evidence.py",
        usable: true,
        confidence: 0.793,
        targetThreshold: 0.7,
        verdict: "pass",
        maps: {
          albedo: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\foliage\\foliage_albedo.png",
            url: "/pbr/foliage/foliage_albedo.png",
            channel: "albedo",
            source: "reference-pixel-extraction"
          },
          roughness: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\foliage\\foliage_roughness.png",
            url: "/pbr/foliage/foliage_roughness.png",
            channel: "roughness",
            source: "reference-pixel-extraction"
          },
          height: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\foliage\\foliage_height.png",
            url: "/pbr/foliage/foliage_height.png",
            channel: "height",
            source: "reference-pixel-extraction"
          },
          normal: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\foliage\\foliage_normal.png",
            url: "/pbr/foliage/foliage_normal.png",
            channel: "normal",
            source: "reference-pixel-extraction"
          },
          ao: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\foliage\\foliage_ao.png",
            url: "/pbr/foliage/foliage_ao.png",
            channel: "ao",
            source: "reference-pixel-extraction"
          }
        }
      },
      renderColor: "#8d9d30",
      renderNotes: "Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo."
    },
    {
      id: "base",
      name: "base",
      type: "standard",
      shaderModel: "MeshStandardMaterial / PBR approximation",
      baseColor: "#cdaa82",
      color: "#cdaa82",
      albedo: {
        dominant: "#cdaa82",
        secondary: [
          "#cdaa82"
        ],
        samplingNotes: "Observed pixel crop 125,688,110,26; de-lighting required before map use"
      },
      colorVariation: {
        palette: [
          "#cdaa82"
        ],
        pattern: "mottled",
        amplitude: 0.045,
        heightCorrelation: 0.3
      },
      textureResolution: 1024,
      textureProjection: {
        mode: "dominant-face-object-space",
        repeat: [
          1,
          1
        ],
        anisotropy: 8,
        texelDensityIntent: "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."
      },
      surfaceFrequencyBands: [
        {
          id: "macro",
          frequency: 2,
          amplitude: 0.42,
          role: "broad color and height breakup"
        },
        {
          id: "meso",
          frequency: 12,
          amplitude: 0.22,
          role: "ridges, pores, grain, dents, or equivalent visible relief"
        },
        {
          id: "micro",
          frequency: 56,
          amplitude: 0.08,
          role: "highlight breakup visible under grazing light"
        }
      ],
      roughness: {
        base: 0.83,
        variation: 0.15,
        map: "independent-procedural-field",
        localResponse: "higher roughness in cavities, lower roughness on worn edges"
      },
      metalness: {
        base: 0,
        variation: 0
      },
      normal: {
        pattern: "derived-from-independent-height-field",
        strength: 0.12,
        scale: 24,
        space: "tangent"
      },
      bump: {
        pattern: "fine grain",
        amplitude: 0.012,
        scale: 20
      },
      displacement: {
        pattern: "none",
        amplitude: 0,
        scale: 1,
        silhouetteAffects: false
      },
      ambientOcclusion: {
        cavityStrength: 0.25,
        contactShadowBias: 0.35,
        notes: "Darken creases, seams, intersections, and recessed local features."
      },
      wear: {
        edgeWear: 0,
        scratches: [],
        chips: []
      },
      dirt: {
        amount: 0,
        cavityBias: 0,
        color: "#2F2A22"
      },
      localOverrides: [
        {
          id: "base-variation",
          region: "component surfaces",
          color: "#cdaa82",
          roughness: 0.77,
          evidenceRefs: [
            "full-object"
          ],
          description: "Subtle instance variation and contact-shaded relief"
        }
      ],
      shaderNotes: [
        "Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.",
        "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.",
        "Use normal/bump/displacement only when they map to observed surface relief.",
        "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."
      ],
      notes: "Sampled reference median; source lighting is not physical albedo",
      referencePbr: {
        version: "1.0",
        sourceImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\base.png",
        extractor: "stage1_intake/extract_pbr_evidence.py",
        usable: true,
        confidence: 0.758,
        targetThreshold: 0.7,
        verdict: "pass",
        maps: {
          albedo: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\base\\base_albedo.png",
            url: "/pbr/base/base_albedo.png",
            channel: "albedo",
            source: "reference-pixel-extraction"
          },
          roughness: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\base\\base_roughness.png",
            url: "/pbr/base/base_roughness.png",
            channel: "roughness",
            source: "reference-pixel-extraction"
          },
          height: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\base\\base_height.png",
            url: "/pbr/base/base_height.png",
            channel: "height",
            source: "reference-pixel-extraction"
          },
          normal: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\base\\base_normal.png",
            url: "/pbr/base/base_normal.png",
            channel: "normal",
            source: "reference-pixel-extraction"
          },
          ao: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\base\\base_ao.png",
            url: "/pbr/base/base_ao.png",
            channel: "ao",
            source: "reference-pixel-extraction"
          }
        }
      },
      renderColor: "#b8966f",
      renderNotes: "Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo."
    },
    {
      id: "paving",
      name: "paving",
      type: "standard",
      shaderModel: "MeshStandardMaterial / PBR approximation",
      baseColor: "#faecdb",
      color: "#faecdb",
      albedo: {
        dominant: "#faecdb",
        secondary: [
          "#faecdb"
        ],
        samplingNotes: "Observed pixel crop 260,630,25,16; de-lighting required before map use"
      },
      colorVariation: {
        palette: [
          "#faecdb"
        ],
        pattern: "mottled",
        amplitude: 0.045,
        heightCorrelation: 0.3
      },
      textureResolution: 1024,
      textureProjection: {
        mode: "dominant-face-object-space",
        repeat: [
          1,
          1
        ],
        anisotropy: 8,
        texelDensityIntent: "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."
      },
      surfaceFrequencyBands: [
        {
          id: "macro",
          frequency: 2,
          amplitude: 0.42,
          role: "broad color and height breakup"
        },
        {
          id: "meso",
          frequency: 12,
          amplitude: 0.22,
          role: "ridges, pores, grain, dents, or equivalent visible relief"
        },
        {
          id: "micro",
          frequency: 56,
          amplitude: 0.08,
          role: "highlight breakup visible under grazing light"
        }
      ],
      roughness: {
        base: 0.83,
        variation: 0.15,
        map: "independent-procedural-field",
        localResponse: "higher roughness in cavities, lower roughness on worn edges"
      },
      metalness: {
        base: 0,
        variation: 0
      },
      normal: {
        pattern: "derived-from-independent-height-field",
        strength: 0.12,
        scale: 24,
        space: "tangent"
      },
      bump: {
        pattern: "fine grain",
        amplitude: 0.012,
        scale: 20
      },
      displacement: {
        pattern: "none",
        amplitude: 0,
        scale: 1,
        silhouetteAffects: false
      },
      ambientOcclusion: {
        cavityStrength: 0.25,
        contactShadowBias: 0.35,
        notes: "Darken creases, seams, intersections, and recessed local features."
      },
      wear: {
        edgeWear: 0,
        scratches: [],
        chips: []
      },
      dirt: {
        amount: 0,
        cavityBias: 0,
        color: "#2F2A22"
      },
      localOverrides: [
        {
          id: "paving-variation",
          region: "component surfaces",
          color: "#faecdb",
          roughness: 0.77,
          evidenceRefs: [
            "full-object"
          ],
          description: "Subtle instance variation and contact-shaded relief"
        }
      ],
      shaderNotes: [
        "Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.",
        "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.",
        "Use normal/bump/displacement only when they map to observed surface relief.",
        "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."
      ],
      notes: "Sampled reference median; source lighting is not physical albedo",
      referencePbr: {
        version: "1.0",
        sourceImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\paving.png",
        extractor: "stage1_intake/extract_pbr_evidence.py",
        usable: true,
        confidence: 0.777,
        targetThreshold: 0.7,
        verdict: "pass",
        maps: {
          albedo: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\paving\\paving_albedo.png",
            url: "/pbr/paving/paving_albedo.png",
            channel: "albedo",
            source: "reference-pixel-extraction"
          },
          roughness: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\paving\\paving_roughness.png",
            url: "/pbr/paving/paving_roughness.png",
            channel: "roughness",
            source: "reference-pixel-extraction"
          },
          height: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\paving\\paving_height.png",
            url: "/pbr/paving/paving_height.png",
            channel: "height",
            source: "reference-pixel-extraction"
          },
          normal: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\paving\\paving_normal.png",
            url: "/pbr/paving/paving_normal.png",
            channel: "normal",
            source: "reference-pixel-extraction"
          },
          ao: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\paving\\paving_ao.png",
            url: "/pbr/paving/paving_ao.png",
            channel: "ao",
            source: "reference-pixel-extraction"
          }
        }
      },
      renderColor: "#ead3b8",
      renderNotes: "Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo."
    },
    {
      id: "glass",
      name: "glass",
      type: "standard",
      shaderModel: "MeshStandardMaterial / PBR approximation",
      baseColor: "#98afb3",
      color: "#98afb3",
      albedo: {
        dominant: "#98afb3",
        secondary: [
          "#98afb3"
        ],
        samplingNotes: "Observed pixel crop 824,237,15,31; de-lighting required before map use"
      },
      colorVariation: {
        palette: [
          "#98afb3"
        ],
        pattern: "mottled",
        amplitude: 0.045,
        heightCorrelation: 0.3
      },
      textureResolution: 1024,
      textureProjection: {
        mode: "dominant-face-object-space",
        repeat: [
          1,
          1
        ],
        anisotropy: 8,
        texelDensityIntent: "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."
      },
      surfaceFrequencyBands: [
        {
          id: "macro",
          frequency: 2,
          amplitude: 0.42,
          role: "broad color and height breakup"
        },
        {
          id: "meso",
          frequency: 12,
          amplitude: 0.22,
          role: "ridges, pores, grain, dents, or equivalent visible relief"
        },
        {
          id: "micro",
          frequency: 56,
          amplitude: 0.08,
          role: "highlight breakup visible under grazing light"
        }
      ],
      roughness: {
        base: 0.29,
        variation: 0.15,
        map: "independent-procedural-field",
        localResponse: "higher roughness in cavities, lower roughness on worn edges"
      },
      metalness: {
        base: 0,
        variation: 0
      },
      normal: {
        pattern: "derived-from-independent-height-field",
        strength: 0.12,
        scale: 24,
        space: "tangent"
      },
      bump: {
        pattern: "fine grain",
        amplitude: 0.012,
        scale: 20
      },
      displacement: {
        pattern: "none",
        amplitude: 0,
        scale: 1,
        silhouetteAffects: false
      },
      ambientOcclusion: {
        cavityStrength: 0.25,
        contactShadowBias: 0.35,
        notes: "Darken creases, seams, intersections, and recessed local features."
      },
      wear: {
        edgeWear: 0,
        scratches: [],
        chips: []
      },
      dirt: {
        amount: 0,
        cavityBias: 0,
        color: "#2F2A22"
      },
      localOverrides: [
        {
          id: "glass-variation",
          region: "component surfaces",
          color: "#98afb3",
          roughness: 0.77,
          evidenceRefs: [
            "full-object"
          ],
          description: "Subtle instance variation and contact-shaded relief"
        }
      ],
      shaderNotes: [
        "Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.",
        "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.",
        "Use normal/bump/displacement only when they map to observed surface relief.",
        "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."
      ],
      notes: "Sampled reference median; source lighting is not physical albedo",
      clearcoat: 0.15,
      referencePbr: {
        version: "1.0",
        sourceImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\glass.png",
        extractor: "stage1_intake/extract_pbr_evidence.py",
        usable: true,
        confidence: 0.833,
        targetThreshold: 0.7,
        verdict: "pass",
        maps: {
          albedo: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\glass\\glass_albedo.png",
            url: "/pbr/glass/glass_albedo.png",
            channel: "albedo",
            source: "reference-pixel-extraction"
          },
          roughness: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\glass\\glass_roughness.png",
            url: "/pbr/glass/glass_roughness.png",
            channel: "roughness",
            source: "reference-pixel-extraction"
          },
          height: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\glass\\glass_height.png",
            url: "/pbr/glass/glass_height.png",
            channel: "height",
            source: "reference-pixel-extraction"
          },
          normal: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\glass\\glass_normal.png",
            url: "/pbr/glass/glass_normal.png",
            channel: "normal",
            source: "reference-pixel-extraction"
          },
          ao: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\glass\\glass_ao.png",
            url: "/pbr/glass/glass_ao.png",
            channel: "ao",
            source: "reference-pixel-extraction"
          }
        }
      },
      renderColor: "#738e96",
      renderNotes: "Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo."
    },
    {
      id: "grass",
      name: "grass",
      type: "standard",
      shaderModel: "MeshStandardMaterial / PBR approximation",
      baseColor: "#b0ad3c",
      color: "#b0ad3c",
      albedo: {
        dominant: "#b0ad3c",
        secondary: [
          "#b0ad3c"
        ],
        samplingNotes: "Observed pixel crop 573,654,38,14; de-lighting required before map use"
      },
      colorVariation: {
        palette: [
          "#b0ad3c"
        ],
        pattern: "mottled",
        amplitude: 0.045,
        heightCorrelation: 0.3
      },
      textureResolution: 1024,
      textureProjection: {
        mode: "dominant-face-object-space",
        repeat: [
          1,
          1
        ],
        anisotropy: 8,
        texelDensityIntent: "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."
      },
      surfaceFrequencyBands: [
        {
          id: "macro",
          frequency: 2,
          amplitude: 0.42,
          role: "broad color and height breakup"
        },
        {
          id: "meso",
          frequency: 12,
          amplitude: 0.22,
          role: "ridges, pores, grain, dents, or equivalent visible relief"
        },
        {
          id: "micro",
          frequency: 56,
          amplitude: 0.08,
          role: "highlight breakup visible under grazing light"
        }
      ],
      roughness: {
        base: 0.83,
        variation: 0.15,
        map: "independent-procedural-field",
        localResponse: "higher roughness in cavities, lower roughness on worn edges"
      },
      metalness: {
        base: 0,
        variation: 0
      },
      normal: {
        pattern: "derived-from-independent-height-field",
        strength: 0.12,
        scale: 24,
        space: "tangent"
      },
      bump: {
        pattern: "fine grain",
        amplitude: 0.012,
        scale: 20
      },
      displacement: {
        pattern: "none",
        amplitude: 0,
        scale: 1,
        silhouetteAffects: false
      },
      ambientOcclusion: {
        cavityStrength: 0.25,
        contactShadowBias: 0.35,
        notes: "Darken creases, seams, intersections, and recessed local features."
      },
      wear: {
        edgeWear: 0,
        scratches: [],
        chips: []
      },
      dirt: {
        amount: 0,
        cavityBias: 0,
        color: "#2F2A22"
      },
      localOverrides: [
        {
          id: "grass-variation",
          region: "component surfaces",
          color: "#b0ad3c",
          roughness: 0.77,
          evidenceRefs: [
            "full-object"
          ],
          description: "Subtle instance variation and contact-shaded relief"
        }
      ],
      shaderNotes: [
        "Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.",
        "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.",
        "Use normal/bump/displacement only when they map to observed surface relief.",
        "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."
      ],
      notes: "Sampled reference median; source lighting is not physical albedo",
      referencePbr: {
        version: "1.0",
        sourceImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\grass.png",
        extractor: "stage1_intake/extract_pbr_evidence.py",
        usable: true,
        confidence: 0.776,
        targetThreshold: 0.7,
        verdict: "pass",
        maps: {
          albedo: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\grass\\grass_albedo.png",
            url: "/pbr/grass/grass_albedo.png",
            channel: "albedo",
            source: "reference-pixel-extraction"
          },
          roughness: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\grass\\grass_roughness.png",
            url: "/pbr/grass/grass_roughness.png",
            channel: "roughness",
            source: "reference-pixel-extraction"
          },
          height: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\grass\\grass_height.png",
            url: "/pbr/grass/grass_height.png",
            channel: "height",
            source: "reference-pixel-extraction"
          },
          normal: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\grass\\grass_normal.png",
            url: "/pbr/grass/grass_normal.png",
            channel: "normal",
            source: "reference-pixel-extraction"
          },
          ao: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\grass\\grass_ao.png",
            url: "/pbr/grass/grass_ao.png",
            channel: "ao",
            source: "reference-pixel-extraction"
          }
        }
      },
      renderColor: "#8d971e",
      renderNotes: "Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo."
    },
    {
      id: "trim",
      name: "trim",
      type: "standard",
      shaderModel: "MeshStandardMaterial / PBR approximation",
      baseColor: "#efd7bc",
      color: "#efd7bc",
      albedo: {
        dominant: "#efd7bc",
        secondary: [
          "#efd7bc"
        ],
        samplingNotes: "Observed pixel crop 810,356,53,14; de-lighting required before map use"
      },
      colorVariation: {
        palette: [
          "#efd7bc"
        ],
        pattern: "mottled",
        amplitude: 0.045,
        heightCorrelation: 0.3
      },
      textureResolution: 1024,
      textureProjection: {
        mode: "dominant-face-object-space",
        repeat: [
          1,
          1
        ],
        anisotropy: 8,
        texelDensityIntent: "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."
      },
      surfaceFrequencyBands: [
        {
          id: "macro",
          frequency: 2,
          amplitude: 0.42,
          role: "broad color and height breakup"
        },
        {
          id: "meso",
          frequency: 12,
          amplitude: 0.22,
          role: "ridges, pores, grain, dents, or equivalent visible relief"
        },
        {
          id: "micro",
          frequency: 56,
          amplitude: 0.08,
          role: "highlight breakup visible under grazing light"
        }
      ],
      roughness: {
        base: 0.83,
        variation: 0.15,
        map: "independent-procedural-field",
        localResponse: "higher roughness in cavities, lower roughness on worn edges"
      },
      metalness: {
        base: 0,
        variation: 0
      },
      normal: {
        pattern: "derived-from-independent-height-field",
        strength: 0.12,
        scale: 24,
        space: "tangent"
      },
      bump: {
        pattern: "fine grain",
        amplitude: 0.012,
        scale: 20
      },
      displacement: {
        pattern: "none",
        amplitude: 0,
        scale: 1,
        silhouetteAffects: false
      },
      ambientOcclusion: {
        cavityStrength: 0.25,
        contactShadowBias: 0.35,
        notes: "Darken creases, seams, intersections, and recessed local features."
      },
      wear: {
        edgeWear: 0,
        scratches: [],
        chips: []
      },
      dirt: {
        amount: 0,
        cavityBias: 0,
        color: "#2F2A22"
      },
      localOverrides: [
        {
          id: "trim-variation",
          region: "component surfaces",
          color: "#efd7bc",
          roughness: 0.77,
          evidenceRefs: [
            "full-object"
          ],
          description: "Subtle instance variation and contact-shaded relief"
        }
      ],
      shaderNotes: [
        "Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.",
        "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.",
        "Use normal/bump/displacement only when they map to observed surface relief.",
        "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."
      ],
      notes: "Sampled reference median; source lighting is not physical albedo",
      referencePbr: {
        version: "1.0",
        sourceImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\trim.png",
        extractor: "stage1_intake/extract_pbr_evidence.py",
        usable: true,
        confidence: 0.775,
        targetThreshold: 0.7,
        verdict: "pass",
        maps: {
          albedo: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\trim\\trim_albedo.png",
            url: "/pbr/trim/trim_albedo.png",
            channel: "albedo",
            source: "reference-pixel-extraction"
          },
          roughness: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\trim\\trim_roughness.png",
            url: "/pbr/trim/trim_roughness.png",
            channel: "roughness",
            source: "reference-pixel-extraction"
          },
          height: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\trim\\trim_height.png",
            url: "/pbr/trim/trim_height.png",
            channel: "height",
            source: "reference-pixel-extraction"
          },
          normal: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\trim\\trim_normal.png",
            url: "/pbr/trim/trim_normal.png",
            channel: "normal",
            source: "reference-pixel-extraction"
          },
          ao: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\trim\\trim_ao.png",
            url: "/pbr/trim/trim_ao.png",
            channel: "ao",
            source: "reference-pixel-extraction"
          }
        }
      },
      renderColor: "#d4b797",
      renderNotes: "Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo."
    },
    {
      id: "road",
      name: "road",
      type: "standard",
      shaderModel: "MeshStandardMaterial / PBR approximation",
      baseColor: "#d1bfaf",
      color: "#d1bfaf",
      albedo: {
        dominant: "#d1bfaf",
        secondary: [
          "#d1bfaf"
        ],
        samplingNotes: "Observed pixel crop 652,764,76,16; de-lighting required before map use"
      },
      colorVariation: {
        palette: [
          "#d1bfaf"
        ],
        pattern: "mottled",
        amplitude: 0.045,
        heightCorrelation: 0.3
      },
      textureResolution: 1024,
      textureProjection: {
        mode: "dominant-face-object-space",
        repeat: [
          1,
          1
        ],
        anisotropy: 8,
        texelDensityIntent: "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."
      },
      surfaceFrequencyBands: [
        {
          id: "macro",
          frequency: 2,
          amplitude: 0.42,
          role: "broad color and height breakup"
        },
        {
          id: "meso",
          frequency: 12,
          amplitude: 0.22,
          role: "ridges, pores, grain, dents, or equivalent visible relief"
        },
        {
          id: "micro",
          frequency: 56,
          amplitude: 0.08,
          role: "highlight breakup visible under grazing light"
        }
      ],
      roughness: {
        base: 0.83,
        variation: 0.15,
        map: "independent-procedural-field",
        localResponse: "higher roughness in cavities, lower roughness on worn edges"
      },
      metalness: {
        base: 0,
        variation: 0
      },
      normal: {
        pattern: "derived-from-independent-height-field",
        strength: 0.12,
        scale: 24,
        space: "tangent"
      },
      bump: {
        pattern: "fine grain",
        amplitude: 0.012,
        scale: 20
      },
      displacement: {
        pattern: "none",
        amplitude: 0,
        scale: 1,
        silhouetteAffects: false
      },
      ambientOcclusion: {
        cavityStrength: 0.25,
        contactShadowBias: 0.35,
        notes: "Darken creases, seams, intersections, and recessed local features."
      },
      wear: {
        edgeWear: 0,
        scratches: [],
        chips: []
      },
      dirt: {
        amount: 0,
        cavityBias: 0,
        color: "#2F2A22"
      },
      localOverrides: [
        {
          id: "road-variation",
          region: "component surfaces",
          color: "#d1bfaf",
          roughness: 0.77,
          evidenceRefs: [
            "full-object"
          ],
          description: "Subtle instance variation and contact-shaded relief"
        }
      ],
      shaderNotes: [
        "Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.",
        "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.",
        "Use normal/bump/displacement only when they map to observed surface relief.",
        "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."
      ],
      notes: "Sampled reference median; source lighting is not physical albedo",
      referencePbr: {
        version: "1.0",
        sourceImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\road.png",
        extractor: "stage1_intake/extract_pbr_evidence.py",
        usable: true,
        confidence: 0.827,
        targetThreshold: 0.7,
        verdict: "pass",
        maps: {
          albedo: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\road\\road_albedo.png",
            url: "/pbr/road/road_albedo.png",
            channel: "albedo",
            source: "reference-pixel-extraction"
          },
          roughness: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\road\\road_roughness.png",
            url: "/pbr/road/road_roughness.png",
            channel: "roughness",
            source: "reference-pixel-extraction"
          },
          height: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\road\\road_height.png",
            url: "/pbr/road/road_height.png",
            channel: "height",
            source: "reference-pixel-extraction"
          },
          normal: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\road\\road_normal.png",
            url: "/pbr/road/road_normal.png",
            channel: "normal",
            source: "reference-pixel-extraction"
          },
          ao: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\road\\road_ao.png",
            url: "/pbr/road/road_ao.png",
            channel: "ao",
            source: "reference-pixel-extraction"
          }
        }
      },
      renderColor: "#ae9c8b",
      renderNotes: "Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo."
    },
    {
      id: "metal",
      name: "metal",
      type: "standard",
      shaderModel: "MeshStandardMaterial / PBR approximation",
      baseColor: "#665c4e",
      color: "#665c4e",
      albedo: {
        dominant: "#665c4e",
        secondary: [
          "#665c4e"
        ],
        samplingNotes: "Observed pixel crop 248,612,4,32; de-lighting required before map use"
      },
      colorVariation: {
        palette: [
          "#665c4e"
        ],
        pattern: "mottled",
        amplitude: 0.045,
        heightCorrelation: 0.3
      },
      textureResolution: 1024,
      textureProjection: {
        mode: "dominant-face-object-space",
        repeat: [
          1,
          1
        ],
        anisotropy: 8,
        texelDensityIntent: "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."
      },
      surfaceFrequencyBands: [
        {
          id: "macro",
          frequency: 2,
          amplitude: 0.42,
          role: "broad color and height breakup"
        },
        {
          id: "meso",
          frequency: 12,
          amplitude: 0.22,
          role: "ridges, pores, grain, dents, or equivalent visible relief"
        },
        {
          id: "micro",
          frequency: 56,
          amplitude: 0.08,
          role: "highlight breakup visible under grazing light"
        }
      ],
      roughness: {
        base: 0.83,
        variation: 0.15,
        map: "independent-procedural-field",
        localResponse: "higher roughness in cavities, lower roughness on worn edges"
      },
      metalness: {
        base: 0,
        variation: 0
      },
      normal: {
        pattern: "derived-from-independent-height-field",
        strength: 0.12,
        scale: 24,
        space: "tangent"
      },
      bump: {
        pattern: "fine grain",
        amplitude: 0.012,
        scale: 20
      },
      displacement: {
        pattern: "none",
        amplitude: 0,
        scale: 1,
        silhouetteAffects: false
      },
      ambientOcclusion: {
        cavityStrength: 0.25,
        contactShadowBias: 0.35,
        notes: "Darken creases, seams, intersections, and recessed local features."
      },
      wear: {
        edgeWear: 0,
        scratches: [],
        chips: []
      },
      dirt: {
        amount: 0,
        cavityBias: 0,
        color: "#2F2A22"
      },
      localOverrides: [
        {
          id: "metal-variation",
          region: "component surfaces",
          color: "#665c4e",
          roughness: 0.77,
          evidenceRefs: [
            "full-object"
          ],
          description: "Subtle instance variation and contact-shaded relief"
        }
      ],
      shaderNotes: [
        "Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.",
        "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.",
        "Use normal/bump/displacement only when they map to observed surface relief.",
        "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."
      ],
      notes: "Sampled reference median; source lighting is not physical albedo",
      referencePbr: {
        version: "1.0",
        sourceImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\metal.png",
        extractor: "stage1_intake/extract_pbr_evidence.py",
        usable: true,
        confidence: 0.77,
        targetThreshold: 0.7,
        verdict: "pass",
        maps: {
          albedo: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\metal\\metal_albedo.png",
            url: "/pbr/metal/metal_albedo.png",
            channel: "albedo",
            source: "reference-pixel-extraction"
          },
          roughness: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\metal\\metal_roughness.png",
            url: "/pbr/metal/metal_roughness.png",
            channel: "roughness",
            source: "reference-pixel-extraction"
          },
          height: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\metal\\metal_height.png",
            url: "/pbr/metal/metal_height.png",
            channel: "height",
            source: "reference-pixel-extraction"
          },
          normal: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\metal\\metal_normal.png",
            url: "/pbr/metal/metal_normal.png",
            channel: "normal",
            source: "reference-pixel-extraction"
          },
          ao: {
            path: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\metal\\metal_ao.png",
            url: "/pbr/metal/metal_ao.png",
            channel: "ao",
            source: "reference-pixel-extraction"
          }
        }
      },
      renderColor: "#554a3c",
      renderNotes: "Solid albedo calibrated under ACES and reference lights; independently extracted roughness, normal and AO maps. Source median includes baked lighting, not physical albedo."
    }
  ],
  repetitionSystems: [
    {
      id: "window-grid",
      distribution: "5 columns by 3 storeys",
      count: 30,
      componentRefs: [
        "east-windows",
        "west-windows"
      ],
      buildsGeometry: true,
      realization: "instanced-geometry",
      evidenceRefs: [
        "full-object"
      ]
    },
    {
      id: "tile-grid",
      distribution: "roof UV row seams and staggered ribs",
      count: 900,
      componentRefs: [
        "roof-tiles"
      ],
      buildsGeometry: true,
      realization: "instanced-geometry",
      evidenceRefs: [
        "full-object"
      ]
    },
    {
      id: "foliage-clusters",
      distribution: "seeded branch tiers",
      count: 300,
      componentRefs: [
        "east-tree-0",
        "west-tree-0"
      ],
      buildsGeometry: true,
      realization: "instanced-geometry",
      evidenceRefs: [
        "full-object"
      ]
    },
    {
      id: "paving-grid",
      distribution: "staggered walkway pavers",
      count: 200,
      componentRefs: [
        "pavement"
      ],
      buildsGeometry: true,
      realization: "instanced-geometry",
      evidenceRefs: [
        "full-object"
      ]
    },
    {
      id: "arcade-rhythm",
      distribution: "three central and four wing bays",
      count: 11,
      componentRefs: [
        "arcade",
        "east-arcade",
        "west-arcade"
      ],
      buildsGeometry: true,
      realization: "instanced-geometry",
      evidenceRefs: [
        "full-object"
      ]
    }
  ],
  buildPasses: [
    {
      id: "blockout",
      goal: "Match macro silhouette and proportions.",
      componentRefs: [
        "root",
        "plinth",
        "landscape",
        "west-wing",
        "east-wing",
        "central-block",
        "tower",
        "tower-roof",
        "west-roof",
        "east-roof",
        "central-roof",
        "arcade",
        "arcade-roof",
        "west-turret",
        "west-turret-roof",
        "east-turret",
        "east-turret-roof",
        "road",
        "west-tree-0",
        "west-tree-1",
        "west-tree-2",
        "east-tree-0",
        "east-tree-1",
        "east-tree-2",
        "west-rear-tree",
        "east-rear-tree"
      ],
      acceptance: [
        "Silhouette reads correctly without materials.",
        "Quality contract has named all required macro feature groups before code generation.",
        "AI vision comparison score meets selfCorrectLoop.visualAcceptance.threshold."
      ]
    },
    {
      id: "structural-pass",
      goal: "Build the component hierarchy implied by the pre-spec complexity assessment.",
      componentRefs: [
        "root",
        "plinth",
        "landscape",
        "west-wing",
        "east-wing",
        "central-block",
        "tower",
        "tower-roof",
        "west-roof",
        "east-roof",
        "central-roof",
        "arcade",
        "arcade-roof",
        "west-turret",
        "west-turret-roof",
        "east-turret",
        "east-turret-roof",
        "west-arcade",
        "west-windows",
        "west-piers",
        "west-dormers",
        "west-parapets",
        "west-side-windows",
        "east-arcade",
        "east-windows",
        "east-piers",
        "east-dormers",
        "east-parapets",
        "east-side-windows",
        "central-windows",
        "tower-clock",
        "tower-window",
        "tower-lower-window",
        "balcony",
        "stairs",
        "pavement",
        "road",
        "roof-dormers",
        "central-parapet",
        "west-hedges",
        "west-tree-0",
        "west-tree-1",
        "west-tree-2",
        "east-hedges",
        "east-tree-0",
        "east-tree-1",
        "east-tree-2",
        "west-rear-tree",
        "east-rear-tree"
      ],
      acceptance: [
        "Macro, meso, and repeated structures meet qualityContract.minimumSpecDepth.",
        "Parent-child relations, joints, seams, sockets, and contact points are explicit.",
        "Every attached child appendage/connector has parentSocket, localStart/localEnd, contactType, embedDepth or overlap, and gapTolerance.",
        "AI vision comparison score meets selfCorrectLoop.visualAcceptance.threshold."
      ]
    },
    {
      id: "form-refinement",
      goal: "Refine shape, deformation, bevels, tapers, curves, asymmetry, and visible local geometry.",
      componentRefs: [
        "root",
        "plinth",
        "landscape",
        "west-wing",
        "east-wing",
        "central-block",
        "tower",
        "tower-roof",
        "west-roof",
        "east-roof",
        "central-roof",
        "arcade",
        "arcade-roof",
        "west-turret",
        "west-turret-roof",
        "east-turret",
        "east-turret-roof",
        "west-arcade",
        "west-windows",
        "west-piers",
        "west-dormers",
        "west-parapets",
        "west-side-windows",
        "east-arcade",
        "east-windows",
        "east-piers",
        "east-dormers",
        "east-parapets",
        "east-side-windows",
        "central-windows",
        "tower-clock",
        "tower-window",
        "tower-lower-window",
        "balcony",
        "stairs",
        "pavement",
        "road",
        "roof-dormers",
        "central-parapet",
        "front-plaque",
        "west-hedges",
        "west-tree-0",
        "west-tree-1",
        "west-tree-2",
        "west-shrubs",
        "east-hedges",
        "east-tree-0",
        "east-tree-1",
        "east-tree-2",
        "east-shrubs",
        "lamp-system",
        "pedestrians",
        "road-markings",
        "campus-sign",
        "roof-tiles",
        "brick-joints",
        "stone-joints",
        "clock-marks",
        "balustrade",
        "window-mullions",
        "west-rear-tree",
        "east-rear-tree"
      ],
      acceptance: [
        "Important visible forms are represented in component geometryDescriptor, deformations, localFeatures, or repetitionSystems.",
        "Endpoint-based child parts are rooted at their attachment sockets and do not visibly float away from parents.",
        "AI vision comparison score meets selfCorrectLoop.visualAcceptance.threshold."
      ]
    },
    {
      id: "material-pass",
      goal: "Match material color, roughness, bump, and local variation.",
      componentRefs: [
        "root",
        "plinth",
        "landscape",
        "west-wing",
        "east-wing",
        "central-block",
        "tower",
        "tower-roof",
        "west-roof",
        "east-roof",
        "central-roof",
        "arcade",
        "arcade-roof",
        "west-turret",
        "west-turret-roof",
        "east-turret",
        "east-turret-roof",
        "west-arcade",
        "west-windows",
        "west-piers",
        "west-dormers",
        "west-parapets",
        "west-side-windows",
        "east-arcade",
        "east-windows",
        "east-piers",
        "east-dormers",
        "east-parapets",
        "east-side-windows",
        "central-windows",
        "tower-clock",
        "tower-window",
        "tower-lower-window",
        "balcony",
        "stairs",
        "pavement",
        "road",
        "roof-dormers",
        "central-parapet",
        "front-plaque",
        "west-hedges",
        "west-tree-0",
        "west-tree-1",
        "west-tree-2",
        "west-shrubs",
        "east-hedges",
        "east-tree-0",
        "east-tree-1",
        "east-tree-2",
        "east-shrubs",
        "lamp-system",
        "pedestrians",
        "road-markings",
        "campus-sign",
        "roof-tiles",
        "brick-joints",
        "stone-joints",
        "clock-marks",
        "balustrade",
        "window-mullions",
        "west-rear-tree",
        "east-rear-tree"
      ],
      acceptance: [
        "Reference-derived albedo palette records dominant, secondary, and accent colors per visible material.",
        "Each important material defines roughness variation and at least one normal/bump/displacement response.",
        "Local material overrides, dirt/wear/stains/moss/chips/scratches or equivalent masks are tied to evidenceRefs.",
        "Thin, transparent, reflective, wet, or fibrous materials document alpha/transmission/clearcoat/metalness/fiber response when relevant.",
        "Generated preview uses procedural albedo/roughness/bump texture or vertex color variation instead of one flat color.",
        "Generated preview uses independent PBR maps at 1024px or higher for the quality-first tier.",
        "If source pixels are available, referencePbr extraction passed at confidence >= 0.7 or the pass is stopped/requesting better references.",
        "Macro, meso, and micro surface frequency bands are visible at the intended review distance without obvious tiling.",
        "AI vision comparison score meets selfCorrectLoop.visualAcceptance.threshold."
      ]
    },
    {
      id: "surface-pass",
      goal: "Add procedural surface locality such as normal/bump/displacement, AO, dirt, stains, chips, grain, moss, scratches, and wear.",
      componentRefs: [
        "root",
        "plinth",
        "landscape",
        "west-wing",
        "east-wing",
        "central-block",
        "tower",
        "tower-roof",
        "west-roof",
        "east-roof",
        "central-roof",
        "arcade",
        "arcade-roof",
        "west-turret",
        "west-turret-roof",
        "east-turret",
        "east-turret-roof",
        "west-arcade",
        "west-windows",
        "west-piers",
        "west-dormers",
        "west-parapets",
        "west-side-windows",
        "east-arcade",
        "east-windows",
        "east-piers",
        "east-dormers",
        "east-parapets",
        "east-side-windows",
        "central-windows",
        "tower-clock",
        "tower-window",
        "tower-lower-window",
        "balcony",
        "stairs",
        "pavement",
        "road",
        "roof-dormers",
        "central-parapet",
        "front-plaque",
        "west-hedges",
        "west-tree-0",
        "west-tree-1",
        "west-tree-2",
        "west-shrubs",
        "east-hedges",
        "east-tree-0",
        "east-tree-1",
        "east-tree-2",
        "east-shrubs",
        "lamp-system",
        "pedestrians",
        "road-markings",
        "campus-sign",
        "roof-tiles",
        "brick-joints",
        "stone-joints",
        "clock-marks",
        "balustrade",
        "window-mullions",
        "west-rear-tree",
        "east-rear-tree"
      ],
      acceptance: [
        "Every required material feature group has local overrides or surfaceDetail tied to evidenceRefs.",
        "A grazing-angle close-up proves that normal/height detail breaks highlights naturally and does not read as smooth plastic.",
        "AI vision comparison score meets selfCorrectLoop.visualAcceptance.threshold."
      ]
    },
    {
      id: "lighting-pass",
      goal: "Make material and form readable under neutral turntable lighting plus optional reference lighting.",
      componentRefs: [
        "root",
        "plinth",
        "landscape",
        "west-wing",
        "east-wing",
        "central-block",
        "tower",
        "tower-roof",
        "west-roof",
        "east-roof",
        "central-roof",
        "arcade",
        "arcade-roof",
        "west-turret",
        "west-turret-roof",
        "east-turret",
        "east-turret-roof",
        "west-arcade",
        "west-windows",
        "west-piers",
        "west-dormers",
        "west-parapets",
        "west-side-windows",
        "east-arcade",
        "east-windows",
        "east-piers",
        "east-dormers",
        "east-parapets",
        "east-side-windows",
        "central-windows",
        "tower-clock",
        "tower-window",
        "tower-lower-window",
        "balcony",
        "stairs",
        "pavement",
        "road",
        "roof-dormers",
        "central-parapet",
        "front-plaque",
        "west-hedges",
        "west-tree-0",
        "west-tree-1",
        "west-tree-2",
        "west-shrubs",
        "east-hedges",
        "east-tree-0",
        "east-tree-1",
        "east-tree-2",
        "east-shrubs",
        "lamp-system",
        "pedestrians",
        "road-markings",
        "campus-sign",
        "roof-tiles",
        "brick-joints",
        "stone-joints",
        "clock-marks",
        "balustrade",
        "window-mullions",
        "west-rear-tree",
        "east-rear-tree"
      ],
      acceptance: [
        "lightingFromPhoto identifies key light direction/color/intensity, fill light, rim or environment light, and ambient color.",
        "Exposure, tone mapping, background color/gradient, shadow softness, and contact shadow behavior are specified.",
        "Lighting does not hide geometry/material gaps and screenshots can be compared fairly to the reference.",
        "Neutral, grazing, and reference-matched lighting checks distinguish material errors from lighting errors.",
        "AI vision comparison score meets selfCorrectLoop.visualAcceptance.threshold."
      ]
    },
    {
      id: "interaction-pass",
      goal: "Make the model ready for future animation, transformation, physics, or destruction.",
      componentRefs: [
        "root",
        "plinth",
        "landscape",
        "west-wing",
        "east-wing",
        "central-block",
        "tower",
        "tower-roof",
        "west-roof",
        "east-roof",
        "central-roof",
        "arcade",
        "arcade-roof",
        "west-turret",
        "west-turret-roof",
        "east-turret",
        "east-turret-roof",
        "west-arcade",
        "west-windows",
        "west-piers",
        "west-dormers",
        "west-parapets",
        "west-side-windows",
        "east-arcade",
        "east-windows",
        "east-piers",
        "east-dormers",
        "east-parapets",
        "east-side-windows",
        "central-windows",
        "tower-clock",
        "tower-window",
        "tower-lower-window",
        "balcony",
        "stairs",
        "pavement",
        "road",
        "roof-dormers",
        "central-parapet",
        "front-plaque",
        "west-hedges",
        "west-tree-0",
        "west-tree-1",
        "west-tree-2",
        "west-shrubs",
        "east-hedges",
        "east-tree-0",
        "east-tree-1",
        "east-tree-2",
        "east-shrubs",
        "lamp-system",
        "pedestrians",
        "road-markings",
        "campus-sign",
        "roof-tiles",
        "brick-joints",
        "stone-joints",
        "clock-marks",
        "balustrade",
        "window-mullions",
        "west-rear-tree",
        "east-rear-tree"
      ],
      acceptance: [
        "Macro and movable meso components have stable pivot nodes.",
        "Sockets, collider proxies, and destruction metadata are present for future runtime actions.",
        "AI vision comparison score meets selfCorrectLoop.visualAcceptance.threshold."
      ]
    },
    {
      id: "optimization-pass",
      goal: "Protect runtime performance after visual fidelity is accepted.",
      componentRefs: [
        "root",
        "plinth",
        "landscape",
        "west-wing",
        "east-wing",
        "central-block",
        "tower",
        "tower-roof",
        "west-roof",
        "east-roof",
        "central-roof",
        "arcade",
        "arcade-roof",
        "west-turret",
        "west-turret-roof",
        "east-turret",
        "east-turret-roof",
        "west-arcade",
        "west-windows",
        "west-piers",
        "west-dormers",
        "west-parapets",
        "west-side-windows",
        "east-arcade",
        "east-windows",
        "east-piers",
        "east-dormers",
        "east-parapets",
        "east-side-windows",
        "central-windows",
        "tower-clock",
        "tower-window",
        "tower-lower-window",
        "balcony",
        "stairs",
        "pavement",
        "road",
        "roof-dormers",
        "central-parapet",
        "front-plaque",
        "west-hedges",
        "west-tree-0",
        "west-tree-1",
        "west-tree-2",
        "west-shrubs",
        "east-hedges",
        "east-tree-0",
        "east-tree-1",
        "east-tree-2",
        "east-shrubs",
        "lamp-system",
        "pedestrians",
        "road-markings",
        "campus-sign",
        "roof-tiles",
        "brick-joints",
        "stone-joints",
        "clock-marks",
        "balustrade",
        "window-mullions",
        "west-rear-tree",
        "east-rear-tree"
      ],
      acceptance: [
        "Triangle count, draw calls, instancing, LOD strategy, and FPS target are documented or verified.",
        "Repeated detail is instanced or simplified where possible without breaking silhouette/material believability."
      ]
    }
  ],
  visualEvidence: [
    {
      timestamp: "2026-08-30T19:42:04.767981+00:00",
      passId: "blockout",
      estimatedFidelity: 0.6,
      aiVisionScore: null,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
      renderScreenshot: "campus/evidence/blockout/match.png",
      comparisonImage: "",
      cameraView: "",
      notes: "",
      aiVisionNotes: ""
    },
    {
      timestamp: "2026-08-30T19:44:06.771576+00:00",
      passId: "blockout",
      estimatedFidelity: 0.65,
      aiVisionScore: null,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
      renderScreenshot: "campus/evidence/blockout/match.png",
      comparisonImage: "",
      cameraView: "",
      notes: "",
      aiVisionNotes: ""
    },
    {
      timestamp: "2026-08-30T19:52:13.161905+00:00",
      passId: "blockout",
      estimatedFidelity: 0.76,
      aiVisionScore: 0.76,
      visualAcceptanceThreshold: 0.7,
      layerScores: {
        silhouetteProportion: 0.81,
        componentStructure: 0.8,
        formDetail: 0.4,
        materialSurface: 0.48,
        lightingCamera: 0.73
      },
      featureReviews: [
        {
          id: "clocktower-massing",
          score: 0.81,
          visible: true,
          notes: "Raised slender central tower with bilateral wings; footprint and height hierarchy match approximately."
        },
        {
          id: "hip-roof-system",
          score: 0.8,
          visible: true,
          notes: "Truncated outer hip roofs, front turret pair and separate tower pyramid are present; tile/parapet detail belongs to later passes."
        },
        {
          id: "entrance-and-ground",
          score: 0.81,
          visible: true,
          notes: "Three real openings above a solid display base; stair and ground detail not yet unlocked."
        }
      ],
      referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
      renderScreenshot: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\blockout\\match.png",
      comparisonImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\blockout\\comparison.png",
      cameraView: "",
      notes: "",
      aiVisionNotes: ""
    },
    {
      timestamp: "2026-08-30T20:03:54.902200+00:00",
      passId: "structural-pass",
      estimatedFidelity: 0.66,
      aiVisionScore: null,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
      renderScreenshot: "campus/evidence/structural-pass/match.png",
      comparisonImage: "campus/evidence/structural-pass/comparison.png",
      cameraView: "",
      notes: "",
      aiVisionNotes: ""
    },
    {
      timestamp: "2026-08-30T20:07:23.835448+00:00",
      passId: "structural-pass",
      estimatedFidelity: 0.77,
      aiVisionScore: 0.77,
      visualAcceptanceThreshold: 0.7,
      layerScores: {
        silhouetteProportion: 0.81,
        componentStructure: 0.81,
        formDetail: 0.58,
        materialSurface: 0.56,
        lightingCamera: 0.73
      },
      featureReviews: [
        {
          id: "clocktower-massing",
          score: 0.81,
          visible: true,
          notes: "Slender high clock tower; long window no longer intersects roof trim. Pediment requires form refinement."
        },
        {
          id: "hip-roof-system",
          score: 0.81,
          visible: true,
          notes: "Stepped hip roof hierarchy and dormer/parapet assemblies are present; no tile relief yet."
        },
        {
          id: "entrance-and-ground",
          score: 0.81,
          visible: true,
          notes: "Three open entry bays, two balcony bays and staircase share a coherent entrance axis."
        },
        {
          id: "facade-window-system",
          score: 0.81,
          visible: true,
          notes: "Five-bay, three-storey wing grids with side elevations and turret slots; relative trim still simplified."
        },
        {
          id: "landscape-canopy",
          score: 0.8,
          visible: true,
          notes: "Rooted branching tier structure and curved hedges present; finer cloud-shaped foliage belongs to form pass."
        }
      ],
      referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
      renderScreenshot: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\structural-pass\\match.png",
      comparisonImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\structural-pass\\comparison.png",
      cameraView: "",
      notes: "",
      aiVisionNotes: ""
    },
    {
      timestamp: "2026-08-30T20:15:57.298167+00:00",
      passId: "form-refinement",
      estimatedFidelity: 0.73,
      aiVisionScore: 0.73,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
      renderScreenshot: "campus/evidence/form-refinement/match.png",
      comparisonImage: "campus/evidence/form-refinement/comparison.png",
      cameraView: "",
      notes: "",
      aiVisionNotes: ""
    },
    {
      timestamp: "2026-08-30T20:19:42.888351+00:00",
      passId: "form-refinement",
      estimatedFidelity: 0.77,
      aiVisionScore: 0.77,
      visualAcceptanceThreshold: 0.7,
      layerScores: {
        silhouetteProportion: 0.81,
        componentStructure: 0.81,
        formDetail: 0.76,
        materialSurface: 0.57,
        lightingCamera: 0.72
      },
      featureReviews: [
        {
          id: "clocktower-massing",
          score: 0.81,
          visible: true,
          notes: "Clock, pediment, slender shaft and long arched blue window present."
        },
        {
          id: "hip-roof-system",
          score: 0.81,
          visible: true,
          notes: "Stepped red hip roofs with dormers, parapets and actual geometric courses."
        },
        {
          id: "entrance-and-ground",
          score: 0.8,
          visible: true,
          notes: "Open three-bay arcade and aligned stair, road, crosswalks, people and plaque. Base notches remain simplified."
        },
        {
          id: "facade-window-system",
          score: 0.8,
          visible: true,
          notes: "Repeated window bays and paired upper arches hold across side views; frames are stylized."
        },
        {
          id: "landscape-canopy",
          score: 0.8,
          visible: true,
          notes: "Plate-like tiers replaced by smaller connected cloud lobes; broad placement matches, exact branch/leaf topology is approximate."
        }
      ],
      referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
      renderScreenshot: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\form-refinement\\match.png",
      comparisonImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\form-refinement\\comparison.png",
      cameraView: "",
      notes: "",
      aiVisionNotes: ""
    },
    {
      timestamp: "2026-08-30T20:23:51.054793+00:00",
      passId: "material-pass",
      estimatedFidelity: 0.74,
      aiVisionScore: null,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
      renderScreenshot: "campus/evidence/material-pass/match.png",
      comparisonImage: "",
      cameraView: "",
      notes: "",
      aiVisionNotes: ""
    },
    {
      timestamp: "2026-08-30T20:26:37.019797+00:00",
      passId: "material-pass",
      estimatedFidelity: 0,
      aiVisionScore: null,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
      renderScreenshot: "campus/evidence/material-pass/isolated.png",
      comparisonImage: "",
      cameraView: "",
      notes: "",
      aiVisionNotes: ""
    }
  ],
  reviewHistory: [
    {
      timestamp: "2026-08-30T19:42:04.767981+00:00",
      passId: "blockout",
      estimatedFidelity: 0.6,
      aiVisionScore: null,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      action: "refine-spec",
      summary: "Initial Tier1 failed: wing roofs too high, rear canopy mass absent, road missing from macro frontage, and framing clipped plinth. Refine explicit massing and camera; no visual continue claimed.",
      matched: [],
      mismatches: [],
      specFixes: [],
      codeFixes: [],
      evidence: [],
      visualEvidence: {
        referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
        renderScreenshot: "campus/evidence/blockout/match.png",
        comparisonImage: "",
        cameraView: "",
        notes: "",
        aiVisionNotes: ""
      }
    },
    {
      timestamp: "2026-08-30T19:44:06.771576+00:00",
      passId: "blockout",
      estimatedFidelity: 0.65,
      aiVisionScore: null,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      action: "refine-spec",
      summary: "Tier1 silhouette IoU improved to 0.778 but below 0.85. Align architecture 1 unit right relative to plinth, lower exposed west rear canopy, and keep road inside plinth; lighten background shadow.",
      matched: [],
      mismatches: [],
      specFixes: [],
      codeFixes: [],
      evidence: [],
      visualEvidence: {
        referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
        renderScreenshot: "campus/evidence/blockout/match.png",
        comparisonImage: "",
        cameraView: "",
        notes: "",
        aiVisionNotes: ""
      }
    },
    {
      timestamp: "2026-08-30T19:52:13.161905+00:00",
      passId: "blockout",
      estimatedFidelity: 0.76,
      aiVisionScore: 0.76,
      visualAcceptanceThreshold: 0.7,
      layerScores: {
        silhouetteProportion: 0.81,
        componentStructure: 0.8,
        formDetail: 0.4,
        materialSurface: 0.48,
        lightingCamera: 0.73
      },
      featureReviews: [
        {
          id: "clocktower-massing",
          score: 0.81,
          visible: true,
          notes: "Raised slender central tower with bilateral wings; footprint and height hierarchy match approximately."
        },
        {
          id: "hip-roof-system",
          score: 0.8,
          visible: true,
          notes: "Truncated outer hip roofs, front turret pair and separate tower pyramid are present; tile/parapet detail belongs to later passes."
        },
        {
          id: "entrance-and-ground",
          score: 0.81,
          visible: true,
          notes: "Three real openings above a solid display base; stair and ground detail not yet unlocked."
        }
      ],
      action: "continue",
      summary: "Blockout goal accepted: tower/wing height hierarchy, roof tiers, three entrance openings and grounded display base read correctly. Tier1 on the independently annotated reference exterior versus actual geometry silhouette passes IoU 0.867. Original-colour segmentation remains 0.801 and is retained as a limitation, not rewritten. Full-colour comparison shows absent meso architecture and simplified foliage, deferred to their locked passes.",
      matched: [],
      mismatches: [],
      specFixes: [],
      codeFixes: [],
      evidence: [],
      mapStrippedRender: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\blockout\\silhouette.png",
      visualEvidence: {
        referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
        renderScreenshot: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\blockout\\match.png",
        comparisonImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\blockout\\comparison.png",
        cameraView: "",
        notes: "",
        aiVisionNotes: ""
      }
    },
    {
      timestamp: "2026-08-30T20:03:54.902200+00:00",
      passId: "structural-pass",
      estimatedFidelity: 0.66,
      aiVisionScore: null,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      action: "refine-spec",
      summary: "Tall window is cut by central roof cornice, balcony needs actual paired arches, and staircase/entry elevations disagree. Correct measured structure before form pass. Canopy tier structure must flatten.",
      matched: [],
      mismatches: [],
      specFixes: [],
      codeFixes: [],
      evidence: [],
      visualEvidence: {
        referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
        renderScreenshot: "campus/evidence/structural-pass/match.png",
        comparisonImage: "campus/evidence/structural-pass/comparison.png",
        cameraView: "",
        notes: "",
        aiVisionNotes: ""
      }
    },
    {
      timestamp: "2026-08-30T20:07:23.835448+00:00",
      passId: "structural-pass",
      estimatedFidelity: 0.77,
      aiVisionScore: 0.77,
      visualAcceptanceThreshold: 0.7,
      layerScores: {
        silhouetteProportion: 0.81,
        componentStructure: 0.81,
        formDetail: 0.58,
        materialSurface: 0.56,
        lightingCamera: 0.73
      },
      featureReviews: [
        {
          id: "clocktower-massing",
          score: 0.81,
          visible: true,
          notes: "Slender high clock tower; long window no longer intersects roof trim. Pediment requires form refinement."
        },
        {
          id: "hip-roof-system",
          score: 0.81,
          visible: true,
          notes: "Stepped hip roof hierarchy and dormer/parapet assemblies are present; no tile relief yet."
        },
        {
          id: "entrance-and-ground",
          score: 0.81,
          visible: true,
          notes: "Three open entry bays, two balcony bays and staircase share a coherent entrance axis."
        },
        {
          id: "facade-window-system",
          score: 0.81,
          visible: true,
          notes: "Five-bay, three-storey wing grids with side elevations and turret slots; relative trim still simplified."
        },
        {
          id: "landscape-canopy",
          score: 0.8,
          visible: true,
          notes: "Rooted branching tier structure and curved hedges present; finer cloud-shaped foliage belongs to form pass."
        }
      ],
      action: "continue",
      summary: "Structural pass accepted against its own goal: intact tower window, clock, three entrance arches, paired balcony arches, three-storey window grids, dormers, rooted branch tiers, and aligned entry stairs are implemented. Exterior geometry IoU 0.8722; all four views retain volume. Original-colour automatic segmentation is not the silhouette authority. Form pass still owes roof tile relief, pediment, foliage lobes, paving and small street props. Hidden rear is inferred.",
      matched: [],
      mismatches: [],
      specFixes: [],
      codeFixes: [],
      evidence: [],
      mapStrippedRender: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\structural-pass\\silhouette.png",
      visualEvidence: {
        referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
        renderScreenshot: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\structural-pass\\match.png",
        comparisonImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\structural-pass\\comparison.png",
        cameraView: "",
        notes: "",
        aiVisionNotes: ""
      }
    },
    {
      timestamp: "2026-08-30T20:15:57.298167+00:00",
      passId: "form-refinement",
      estimatedFidelity: 0.73,
      aiVisionScore: 0.73,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      action: "refine-code",
      summary: "Form review: roof relief, streetscape, pediment and lettering are present. Tree tier ellipsoids still dominate the small lobes, producing pancake canopies instead of the reference cloud silhouette. Replace tier centre plates with overlapping smaller cloud clusters; keep massing and camera fixed.",
      matched: [],
      mismatches: [],
      specFixes: [],
      codeFixes: [],
      evidence: [],
      visualEvidence: {
        referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
        renderScreenshot: "campus/evidence/form-refinement/match.png",
        comparisonImage: "campus/evidence/form-refinement/comparison.png",
        cameraView: "",
        notes: "",
        aiVisionNotes: ""
      }
    },
    {
      timestamp: "2026-08-30T20:19:42.888351+00:00",
      passId: "form-refinement",
      estimatedFidelity: 0.77,
      aiVisionScore: 0.77,
      visualAcceptanceThreshold: 0.7,
      layerScores: {
        silhouetteProportion: 0.81,
        componentStructure: 0.81,
        formDetail: 0.76,
        materialSurface: 0.57,
        lightingCamera: 0.72
      },
      featureReviews: [
        {
          id: "clocktower-massing",
          score: 0.81,
          visible: true,
          notes: "Clock, pediment, slender shaft and long arched blue window present."
        },
        {
          id: "hip-roof-system",
          score: 0.81,
          visible: true,
          notes: "Stepped red hip roofs with dormers, parapets and actual geometric courses."
        },
        {
          id: "entrance-and-ground",
          score: 0.8,
          visible: true,
          notes: "Open three-bay arcade and aligned stair, road, crosswalks, people and plaque. Base notches remain simplified."
        },
        {
          id: "facade-window-system",
          score: 0.8,
          visible: true,
          notes: "Repeated window bays and paired upper arches hold across side views; frames are stylized."
        },
        {
          id: "landscape-canopy",
          score: 0.8,
          visible: true,
          notes: "Plate-like tiers replaced by smaller connected cloud lobes; broad placement matches, exact branch/leaf topology is approximate."
        }
      ],
      action: "continue",
      summary: "Accepted as a stylized form pass, not an exact replica. Geometric hip courses, dormers, pediment, window grids, three open entrance bays, two balcony arches, street furniture, people, plaque and cloud lobes are built. Geometry IoU 0.8675. Canopy density, low-contrast materials and simplified base still limit reference similarity; material and lighting work remains. Rear is unobserved and simplified.",
      matched: [],
      mismatches: [],
      specFixes: [],
      codeFixes: [],
      evidence: [],
      mapStrippedRender: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\form-refinement\\silhouette.png",
      visualEvidence: {
        referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
        renderScreenshot: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\form-refinement\\match.png",
        comparisonImage: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\form-refinement\\comparison.png",
        cameraView: "",
        notes: "",
        aiVisionNotes: ""
      }
    },
    {
      timestamp: "2026-08-30T20:23:51.054793+00:00",
      passId: "material-pass",
      estimatedFidelity: 0.74,
      aiVisionScore: null,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      action: "refine-code",
      summary: "Material Tier1 foreground geometry passes IoU 0.8622, but full-image five-cluster colour diagnostic fails max DeltaE 24.65. Roof/brick read too muted and the small metal accents are underrepresented in global clusters. Refine the visible warm clay palette using independently sampled reference regions; retain strict thresholds and verify scoped material crops.",
      matched: [],
      mismatches: [],
      specFixes: [],
      codeFixes: [],
      evidence: [],
      visualEvidence: {
        referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
        renderScreenshot: "campus/evidence/material-pass/match.png",
        comparisonImage: "",
        cameraView: "",
        notes: "",
        aiVisionNotes: ""
      }
    },
    {
      timestamp: "2026-08-30T20:26:37.019797+00:00",
      passId: "material-pass",
      estimatedFidelity: 0,
      aiVisionScore: null,
      visualAcceptanceThreshold: 0.7,
      layerScores: {},
      featureReviews: [],
      action: "request-input",
      summary: "Paused without AI acceptance: strict material Tier1 remains failed after the material correction (foreground IoU 0.8622; maximum global-cluster DeltaE 24.27 > 20). Fidelity=0 is an unassessed sentinel, not a visual score. Five total corrections are recorded. Ask the user whether to accept a clearly approximate draft or authorize further scoped refinement; do not silently relax thresholds or advance locked passes. Typecheck/build passed; GLB and performance work are not complete.",
      matched: [],
      mismatches: [],
      specFixes: [],
      codeFixes: [],
      evidence: [],
      visualEvidence: {
        referenceScreenshot: "C:/Users/tony428tw/Desktop/1150902\u6295\u5165\u4E0D\u8D85\u8F09\uFF0C\u5B78\u7FD2\u525B\u525B\u597DAIGC \u8207 XR \u8DE8\u57DF\u8A2D\u8A08\u4E4B\u6559\u5B78\u5BE6\u8E10/\u671D\u967D\u6821\u5712\u7167\u7247/ChatGPT Image 2026\u5E748\u670831\u65E5 \u4E0A\u534803_25_19.png",
        renderScreenshot: "campus/evidence/material-pass/isolated.png",
        comparisonImage: "",
        cameraView: "",
        notes: "",
        aiVisionNotes: ""
      }
    }
  ],
  lodPlan: [
    {
      tier: "near",
      distance: 0,
      strategy: "full component tree and material layers"
    },
    {
      tier: "far",
      distance: 30,
      strategy: "merge static components and reduce local feature geometry"
    }
  ],
  performanceBudget: {
    qualityPriority: "reference-fidelity",
    targetTriangles: 25e4,
    maxDrawCalls: 350,
    textureSize: 1024,
    fpsTarget: 30,
    optimizationPolicy: "Reach accepted visual fidelity first, then optimize without removing reference-critical geometry or surface layers."
  },
  lightingFromPhoto: [
    "Warm large key light from upper front-left; contact shadows fall right/back.",
    "Hemisphere fill cream/grey 1.2; key 3.0 with soft shadow, cool rim 0.6.",
    "ACES filmic tone mapping exposure 1.15, warm ivory background #f8f3e9, contact shadow under plinth."
  ],
  proceduralStrategy: [
    "Block out macro silhouette first.",
    "Add component hierarchy and joints.",
    "Create stable pivot groups, sockets, collider proxies, and destruction metadata before visual polish.",
    "Refine forms with bevels, tapers, bends, and procedural noise.",
    "Run reference PBR extraction for important source-image materials and stop when confidence is below the target threshold.",
    "Add material variation before adding expensive micro-geometry."
  ],
  animationAnchors: [
    "root pivot node supports whole-object translation, rotation, scale, and visibility changes",
    "component pivot groups support later local transforms without rebuilding geometry"
  ],
  destructionAnchors: [
    "actionProfile.destruction.fractureGroup marks detachable or breakable component sets",
    "component seams and sockets define plausible break points instead of random explosions"
  ],
  risks: [
    "One-view occlusion prevents exact rear reconstruction.",
    "Instanced foliage and generated text approximate dense tiny details."
  ],
  localSpecSearch: {
    collection: "core_3d",
    query: "Chaoyang clocktower campus architectural diorama architectural symmetric clock tower mansard hip roof arcade limestone brick foliage instancing",
    index: {
      status: "rebuilt",
      reason: "missing",
      fingerprint: "ac4f0bc9028e34083dbb5d5531ae3df7699c8e7641d5f8e6d42e7492ea1be1d0"
    },
    matches: [
      {
        record_id: "core.description-feldman-method-description-analysis-stages",
        file_path: "docs/raw/img2threejs-skill-dataset.json",
        heading: null,
        key_path: "categories.description_conventions[3]",
        score: 2.570079644576,
        snippets: [
          "... and should be rejected; Acceptable pointers are strictly visual: straight, curved, large, small, symmetric, textured D\u1EA5u hi\u1EC7u nh\u1EADn di\u1EC7n: M\u1ED9t m\xF4 t\u1EA3 d\xF9ng t\u1EEB nh\u01B0 '\u0111\u1EB9p' hay 'tinh t\u1EBF' \u0111\xE3 l\u1EA5n sang giai \u0111o\u1EA1n Di\u1EC5n gi\u1EA3i/\u0110\xE1nh ..."
        ],
        source_refs: [
          {
            path: "docs/raw/img2threejs-skill-dataset.json",
            heading: null,
            key_path: "categories.description_conventions[3]"
          }
        ],
        evidence_refs: [
          {
            kind: "source",
            ref: "docs/raw/img2threejs-skill-dataset.json",
            note: "img2threejs NotebookLM research distillation"
          }
        ]
      }
    ]
  },
  campusBlueprint: {
    seed: 428,
    activeStage: 3,
    notes: "Subject-specific renderer consumes component campus.kind, dimensions and positions. Stage unlocks follow reviewHistory, not UI.",
    massingRevision: "Lower outer wing eaves 8.27\u21927.27; raise turret roof 8.33\u21928.93; add observed rear foliage; road is a silhouette-defining macro frontage.",
    alignmentRevision: "Visible tower apex sits 40px right of plinth centre: architecture offset +1 x, -0.15 y. Lower west rear trees to reference upper canopy; correct road to lie on plinth.",
    structureRevision: "Clock centre 12.65; intact tall arched window centred 10.05 above roof trim; balcony raised to 5.3 with genuine paired arches; entrance raised 0.7 and stairs aligned. Layered branch/canopy structure from reference.",
    formRecipes: {
      hipTiles: {
        courseSpacing: 0.18,
        frontRibSpacing: 0.22,
        sideRibSpacing: 0.25,
        seamRadius: 0.014,
        interpolation: "bottom rectangular ring to truncated upper ring; continuous four-sided courses"
      },
      canopy: {
        tiers: 6,
        lobesPerTier: 11,
        coreRadii: [
          0.73,
          0.44,
          0.68
        ],
        lobeRadii: [
          0.4,
          0.34,
          0.4
        ],
        seed: "analytic phase i*2.4, j*2.09; radial .72 to 1.02; no random input"
      },
      streetscape: {
        lampX: [
          -10,
          -5.3,
          5.3,
          9.7
        ],
        lampHeight: 1.93,
        peopleCount: 9,
        roadTopY: 0.15,
        markingTopY: 0.165,
        crosswalkX: [
          -10,
          0,
          8.5
        ]
      },
      lettering: "Typeset Chinese campus name with a simplified sun emblem; not recovered official vector logo",
      rear: "Closed stone mass; unobserved rear detail remains inferred and simplified",
      formRelief: "Geometric roof courses and ridges; tower stone horizontal joints; pediment and minute ticks; balcony post caps; window mullions"
    },
    materialRecipe: {
      leafLight: "#aab544",
      bumpScale: 0.012,
      normalStrength: 0.09,
      aoIntensity: 0.15,
      mapRepeat: 1,
      uvWorldUnitsPerTile: 2,
      photometricCaveat: "reference-derived inference, not exact inverse PBR recovery"
    }
  },
  tier1Results: [
    {
      passed: false,
      checks: {
        silhouetteIoU: 0.7366,
        aspectRatioDelta: 0.0441,
        scaleDelta: 0.0423,
        bilateralSymmetryError: 0.1686,
        colorDelta: {
          checked: 60,
          maxDeltaE: 25.59,
          perComponent: [
            {
              componentId: null,
              deltaE: 5.03
            },
            {
              componentId: null,
              deltaE: 8.23
            },
            {
              componentId: null,
              deltaE: 15.64
            },
            {
              componentId: null,
              deltaE: 5.03
            },
            {
              componentId: null,
              deltaE: 5.03
            },
            {
              componentId: null,
              deltaE: 5.03
            },
            {
              componentId: null,
              deltaE: 5.03
            },
            {
              componentId: null,
              deltaE: 7.89
            },
            {
              componentId: null,
              deltaE: 7.89
            },
            {
              componentId: null,
              deltaE: 7.89
            },
            {
              componentId: null,
              deltaE: 7.89
            },
            {
              componentId: null,
              deltaE: 19.33
            },
            {
              componentId: null,
              deltaE: 7.89
            },
            {
              componentId: null,
              deltaE: 5.03
            },
            {
              componentId: null,
              deltaE: 7.89
            },
            {
              componentId: null,
              deltaE: 5.03
            },
            {
              componentId: null,
              deltaE: 7.89
            },
            {
              componentId: null,
              deltaE: 19.33
            },
            {
              componentId: null,
              deltaE: 23.59
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 23.59
            },
            {
              componentId: null,
              deltaE: 19.33
            },
            {
              componentId: null,
              deltaE: 23.59
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 23.59
            },
            {
              componentId: null,
              deltaE: 23.59
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 23.59
            },
            {
              componentId: null,
              deltaE: 23.59
            },
            {
              componentId: null,
              deltaE: 5.03
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 11.9
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 15.64
            },
            {
              componentId: null,
              deltaE: 9.75
            },
            {
              componentId: null,
              deltaE: 9.75
            },
            {
              componentId: null,
              deltaE: 9.75
            },
            {
              componentId: null,
              deltaE: 9.75
            },
            {
              componentId: null,
              deltaE: 15.64
            },
            {
              componentId: null,
              deltaE: 9.75
            },
            {
              componentId: null,
              deltaE: 9.75
            },
            {
              componentId: null,
              deltaE: 9.75
            },
            {
              componentId: null,
              deltaE: 9.75
            },
            {
              componentId: null,
              deltaE: 25.59
            },
            {
              componentId: null,
              deltaE: 11.9
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            },
            {
              componentId: null,
              deltaE: 7
            }
          ],
          gated: false
        }
      },
      failures: [
        "silhouette IoU 0.737 is below threshold 0.85",
        "blockout requires --map-stripped-render evidence"
      ],
      maskWarnings: [
        "reference: 2.9% of foreground cells lie outside the largest connected blob and were excluded from the bounding box; if the subject really has separated parts in this projection, they are not being measured"
      ],
      renderHash: "b4752b6118eea059",
      passId: "blockout"
    },
    {
      passed: false,
      checks: {
        silhouetteIoU: 0.7784,
        aspectRatioDelta: 0.0392,
        scaleDelta: 9e-3,
        bilateralSymmetryError: 0.1594,
        colorDelta: {
          checked: 62,
          maxDeltaE: 28.41,
          perComponent: [
            {
              componentId: null,
              deltaE: 5.96
            },
            {
              componentId: null,
              deltaE: 9.93
            },
            {
              componentId: null,
              deltaE: 18.42
            },
            {
              componentId: null,
              deltaE: 5.96
            },
            {
              componentId: null,
              deltaE: 5.96
            },
            {
              componentId: null,
              deltaE: 5.96
            },
            {
              componentId: null,
              deltaE: 5.96
            },
            {
              componentId: null,
              deltaE: 4.66
            },
            {
              componentId: null,
              deltaE: 4.66
            },
            {
              componentId: null,
              deltaE: 4.66
            },
            {
              componentId: null,
              deltaE: 4.66
            },
            {
              componentId: null,
              deltaE: 17.51
            },
            {
              componentId: null,
              deltaE: 4.66
            },
            {
              componentId: null,
              deltaE: 5.96
            },
            {
              componentId: null,
              deltaE: 4.66
            },
            {
              componentId: null,
              deltaE: 5.96
            },
            {
              componentId: null,
              deltaE: 4.66
            },
            {
              componentId: null,
              deltaE: 17.51
            },
            {
              componentId: null,
              deltaE: 22.66
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 22.66
            },
            {
              componentId: null,
              deltaE: 17.51
            },
            {
              componentId: null,
              deltaE: 22.66
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 22.66
            },
            {
              componentId: null,
              deltaE: 22.66
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 22.66
            },
            {
              componentId: null,
              deltaE: 22.66
            },
            {
              componentId: null,
              deltaE: 5.96
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 11.04
            },
            {
              componentId: null,
              deltaE: 7.18
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 18.42
            },
            {
              componentId: null,
              deltaE: 14.51
            },
            {
              componentId: null,
              deltaE: 14.51
            },
            {
              componentId: null,
              deltaE: 14.51
            },
            {
              componentId: null,
              deltaE: 14.51
            },
            {
              componentId: null,
              deltaE: 18.42
            },
            {
              componentId: null,
              deltaE: 14.51
            },
            {
              componentId: null,
              deltaE: 14.51
            },
            {
              componentId: null,
              deltaE: 14.51
            },
            {
              componentId: null,
              deltaE: 14.51
            },
            {
              componentId: null,
              deltaE: 28.41
            },
            {
              componentId: null,
              deltaE: 11.04
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 7.46
            },
            {
              componentId: null,
              deltaE: 14.51
            },
            {
              componentId: null,
              deltaE: 14.51
            }
          ],
          gated: false
        }
      },
      failures: [
        "silhouette IoU 0.778 is below threshold 0.85"
      ],
      maskWarnings: [
        "reference: 2.9% of foreground cells lie outside the largest connected blob and were excluded from the bounding box; if the subject really has separated parts in this projection, they are not being measured"
      ],
      renderHash: "3fce8b3ebc862bd0",
      passId: "blockout",
      mapStrippedRender: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\blockout\\match.png"
    },
    {
      passed: true,
      checks: {
        silhouetteIoU: 0.867,
        aspectRatioDelta: 0.0234,
        scaleDelta: 0.043,
        bilateralSymmetryError: 0.1148,
        colorDelta: {
          checked: 62,
          maxDeltaE: 59.39,
          perComponent: [
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 28.97
            },
            {
              componentId: null,
              deltaE: 59.39
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 31.21
            },
            {
              componentId: null,
              deltaE: 31.21
            },
            {
              componentId: null,
              deltaE: 31.21
            },
            {
              componentId: null,
              deltaE: 31.21
            },
            {
              componentId: null,
              deltaE: 50.53
            },
            {
              componentId: null,
              deltaE: 31.21
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 31.21
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 31.21
            },
            {
              componentId: null,
              deltaE: 50.53
            },
            {
              componentId: null,
              deltaE: 16.2
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 16.2
            },
            {
              componentId: null,
              deltaE: 50.53
            },
            {
              componentId: null,
              deltaE: 16.2
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 16.2
            },
            {
              componentId: null,
              deltaE: 16.2
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 16.2
            },
            {
              componentId: null,
              deltaE: 16.2
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 14.5
            },
            {
              componentId: null,
              deltaE: 12.22
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 59.39
            },
            {
              componentId: null,
              deltaE: 54.2
            },
            {
              componentId: null,
              deltaE: 54.2
            },
            {
              componentId: null,
              deltaE: 54.2
            },
            {
              componentId: null,
              deltaE: 54.2
            },
            {
              componentId: null,
              deltaE: 59.39
            },
            {
              componentId: null,
              deltaE: 54.2
            },
            {
              componentId: null,
              deltaE: 54.2
            },
            {
              componentId: null,
              deltaE: 54.2
            },
            {
              componentId: null,
              deltaE: 54.2
            },
            {
              componentId: null,
              deltaE: 10.75
            },
            {
              componentId: null,
              deltaE: 14.5
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 17.25
            },
            {
              componentId: null,
              deltaE: 54.2
            },
            {
              componentId: null,
              deltaE: 54.2
            }
          ],
          gated: false
        }
      },
      failures: [],
      maskWarnings: [],
      renderHash: "e18f62c59a972b0a",
      passId: "blockout",
      mapStrippedRender: "campus\\evidence\\blockout\\silhouette.png"
    },
    {
      passed: false,
      checks: {
        silhouetteIoU: 0.8007,
        aspectRatioDelta: 0.0544,
        scaleDelta: 0.0233,
        bilateralSymmetryError: 0.1353,
        colorDelta: {
          checked: 62,
          maxDeltaE: 29.03,
          perComponent: [
            {
              componentId: null,
              deltaE: 7.03
            },
            {
              componentId: null,
              deltaE: 8.52
            },
            {
              componentId: null,
              deltaE: 15.95
            },
            {
              componentId: null,
              deltaE: 7.03
            },
            {
              componentId: null,
              deltaE: 7.03
            },
            {
              componentId: null,
              deltaE: 7.03
            },
            {
              componentId: null,
              deltaE: 7.03
            },
            {
              componentId: null,
              deltaE: 4.41
            },
            {
              componentId: null,
              deltaE: 4.41
            },
            {
              componentId: null,
              deltaE: 4.41
            },
            {
              componentId: null,
              deltaE: 4.41
            },
            {
              componentId: null,
              deltaE: 18.69
            },
            {
              componentId: null,
              deltaE: 4.41
            },
            {
              componentId: null,
              deltaE: 7.03
            },
            {
              componentId: null,
              deltaE: 4.41
            },
            {
              componentId: null,
              deltaE: 7.03
            },
            {
              componentId: null,
              deltaE: 4.41
            },
            {
              componentId: null,
              deltaE: 18.69
            },
            {
              componentId: null,
              deltaE: 12.02
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 12.02
            },
            {
              componentId: null,
              deltaE: 18.69
            },
            {
              componentId: null,
              deltaE: 12.02
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 12.02
            },
            {
              componentId: null,
              deltaE: 12.02
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 12.02
            },
            {
              componentId: null,
              deltaE: 12.02
            },
            {
              componentId: null,
              deltaE: 7.03
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 8.94
            },
            {
              componentId: null,
              deltaE: 8.87
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 15.95
            },
            {
              componentId: null,
              deltaE: 10.06
            },
            {
              componentId: null,
              deltaE: 10.06
            },
            {
              componentId: null,
              deltaE: 10.06
            },
            {
              componentId: null,
              deltaE: 10.06
            },
            {
              componentId: null,
              deltaE: 15.95
            },
            {
              componentId: null,
              deltaE: 10.06
            },
            {
              componentId: null,
              deltaE: 10.06
            },
            {
              componentId: null,
              deltaE: 10.06
            },
            {
              componentId: null,
              deltaE: 10.06
            },
            {
              componentId: null,
              deltaE: 29.03
            },
            {
              componentId: null,
              deltaE: 8.94
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 7.22
            },
            {
              componentId: null,
              deltaE: 10.06
            },
            {
              componentId: null,
              deltaE: 10.06
            }
          ],
          gated: false
        }
      },
      failures: [
        "silhouette IoU 0.801 is below threshold 0.85",
        "aspect-ratio delta 0.054 exceeds threshold 0.05"
      ],
      maskWarnings: [
        "reference: 2.9% of foreground cells lie outside the largest connected blob and were excluded from the bounding box; if the subject really has separated parts in this projection, they are not being measured"
      ],
      renderHash: "2b4c0f0204d4649d",
      passId: "structural-pass"
    },
    {
      passed: true,
      checks: {
        silhouetteIoU: 0.8692,
        aspectRatioDelta: 0.0234,
        scaleDelta: 0.043,
        bilateralSymmetryError: 0.1137,
        colorDelta: {
          checked: 62,
          maxDeltaE: 59.39,
          perComponent: [
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 28.96
            },
            {
              componentId: null,
              deltaE: 59.39
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 50.52
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 50.52
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 50.52
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 14.52
            },
            {
              componentId: null,
              deltaE: 12.21
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 59.39
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 59.39
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 10.74
            },
            {
              componentId: null,
              deltaE: 14.52
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            }
          ],
          gated: false
        }
      },
      failures: [],
      maskWarnings: [],
      renderHash: "5e442adb129e200b",
      passId: "structural-pass"
    },
    {
      passed: true,
      checks: {
        silhouetteIoU: 0.8692,
        aspectRatioDelta: 0.0234,
        scaleDelta: 0.043,
        bilateralSymmetryError: 0.1137,
        colorDelta: {
          checked: 62,
          maxDeltaE: 59.39,
          perComponent: [
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 28.96
            },
            {
              componentId: null,
              deltaE: 59.39
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 50.52
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 31.2
            },
            {
              componentId: null,
              deltaE: 50.52
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 50.52
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 16.18
            },
            {
              componentId: null,
              deltaE: 16.64
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 14.52
            },
            {
              componentId: null,
              deltaE: 12.21
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 59.39
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 59.39
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 10.74
            },
            {
              componentId: null,
              deltaE: 14.52
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 17.26
            },
            {
              componentId: null,
              deltaE: 54.18
            },
            {
              componentId: null,
              deltaE: 54.18
            }
          ],
          gated: false
        }
      },
      failures: [],
      maskWarnings: [],
      renderHash: "5e442adb129e200b",
      passId: "structural-pass"
    },
    {
      passed: true,
      checks: {
        silhouetteIoU: 0.8722,
        aspectRatioDelta: 0.0234,
        scaleDelta: 0.043,
        bilateralSymmetryError: 0.1086,
        colorDelta: {
          checked: 62,
          maxDeltaE: 59.32,
          perComponent: [
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 28.85
            },
            {
              componentId: null,
              deltaE: 59.32
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.26
            },
            {
              componentId: null,
              deltaE: 31.26
            },
            {
              componentId: null,
              deltaE: 31.26
            },
            {
              componentId: null,
              deltaE: 31.26
            },
            {
              componentId: null,
              deltaE: 50.54
            },
            {
              componentId: null,
              deltaE: 31.26
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.26
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.26
            },
            {
              componentId: null,
              deltaE: 50.54
            },
            {
              componentId: null,
              deltaE: 15.96
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 15.96
            },
            {
              componentId: null,
              deltaE: 50.54
            },
            {
              componentId: null,
              deltaE: 15.96
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 15.96
            },
            {
              componentId: null,
              deltaE: 15.96
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 15.96
            },
            {
              componentId: null,
              deltaE: 15.96
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 14.71
            },
            {
              componentId: null,
              deltaE: 12.1
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 59.32
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 59.32
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 10.75
            },
            {
              componentId: null,
              deltaE: 14.71
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 17.32
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            }
          ],
          gated: false
        }
      },
      failures: [],
      maskWarnings: [],
      renderHash: "39484b2cde9bcc7b",
      passId: "structural-pass"
    },
    {
      passed: true,
      checks: {
        silhouetteIoU: 0.8705,
        aspectRatioDelta: 0.0234,
        scaleDelta: 0.043,
        bilateralSymmetryError: 0.1088,
        colorDelta: {
          checked: 62,
          maxDeltaE: 59.28,
          perComponent: [
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 28.77
            },
            {
              componentId: null,
              deltaE: 59.28
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 50.57
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 50.57
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 50.57
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 14.85
            },
            {
              componentId: null,
              deltaE: 12.02
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 59.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 59.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 10.75
            },
            {
              componentId: null,
              deltaE: 14.85
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            }
          ],
          gated: false
        }
      },
      failures: [],
      maskWarnings: [],
      renderHash: "20fcc361782a4c29",
      passId: "form-refinement"
    },
    {
      passed: true,
      checks: {
        silhouetteIoU: 0.8705,
        aspectRatioDelta: 0.0234,
        scaleDelta: 0.043,
        bilateralSymmetryError: 0.1088,
        colorDelta: {
          checked: 62,
          maxDeltaE: 59.28,
          perComponent: [
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 28.77
            },
            {
              componentId: null,
              deltaE: 59.28
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 50.57
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.34
            },
            {
              componentId: null,
              deltaE: 50.57
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 50.57
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 15.8
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 14.85
            },
            {
              componentId: null,
              deltaE: 12.02
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 59.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 59.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 10.75
            },
            {
              componentId: null,
              deltaE: 14.85
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 17.36
            },
            {
              componentId: null,
              deltaE: 54.28
            },
            {
              componentId: null,
              deltaE: 54.28
            }
          ],
          gated: false
        }
      },
      failures: [],
      maskWarnings: [],
      renderHash: "20fcc361782a4c29",
      passId: "form-refinement"
    },
    {
      passed: false,
      checks: {
        silhouetteIoU: 0.2869,
        aspectRatioDelta: 0.106,
        scaleDelta: 0.4755,
        bilateralSymmetryError: 0.4478,
        colorDelta: {
          checked: 62,
          maxDeltaE: 58.37,
          perComponent: [
            {
              componentId: null,
              deltaE: 17.22
            },
            {
              componentId: null,
              deltaE: 27.3
            },
            {
              componentId: null,
              deltaE: 58.37
            },
            {
              componentId: null,
              deltaE: 17.22
            },
            {
              componentId: null,
              deltaE: 17.22
            },
            {
              componentId: null,
              deltaE: 17.22
            },
            {
              componentId: null,
              deltaE: 17.22
            },
            {
              componentId: null,
              deltaE: 30.91
            },
            {
              componentId: null,
              deltaE: 30.91
            },
            {
              componentId: null,
              deltaE: 30.91
            },
            {
              componentId: null,
              deltaE: 30.91
            },
            {
              componentId: null,
              deltaE: 50.48
            },
            {
              componentId: null,
              deltaE: 30.91
            },
            {
              componentId: null,
              deltaE: 17.22
            },
            {
              componentId: null,
              deltaE: 30.91
            },
            {
              componentId: null,
              deltaE: 17.22
            },
            {
              componentId: null,
              deltaE: 30.91
            },
            {
              componentId: null,
              deltaE: 50.48
            },
            {
              componentId: null,
              deltaE: 12.25
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 12.25
            },
            {
              componentId: null,
              deltaE: 50.48
            },
            {
              componentId: null,
              deltaE: 12.25
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 12.25
            },
            {
              componentId: null,
              deltaE: 12.25
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 12.25
            },
            {
              componentId: null,
              deltaE: 12.25
            },
            {
              componentId: null,
              deltaE: 17.22
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 10.96
            },
            {
              componentId: null,
              deltaE: 11.02
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 58.37
            },
            {
              componentId: null,
              deltaE: 53.18
            },
            {
              componentId: null,
              deltaE: 53.18
            },
            {
              componentId: null,
              deltaE: 53.18
            },
            {
              componentId: null,
              deltaE: 53.18
            },
            {
              componentId: null,
              deltaE: 58.37
            },
            {
              componentId: null,
              deltaE: 53.18
            },
            {
              componentId: null,
              deltaE: 53.18
            },
            {
              componentId: null,
              deltaE: 53.18
            },
            {
              componentId: null,
              deltaE: 53.18
            },
            {
              componentId: null,
              deltaE: 10.74
            },
            {
              componentId: null,
              deltaE: 10.96
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 18.93
            },
            {
              componentId: null,
              deltaE: 53.18
            },
            {
              componentId: null,
              deltaE: 53.18
            }
          ],
          gated: false
        }
      },
      failures: [
        "silhouette IoU 0.287 is below threshold 0.85",
        "aspect-ratio delta 0.106 exceeds threshold 0.05",
        "scale delta 0.475 exceeds threshold 0.08"
      ],
      maskWarnings: [],
      renderHash: "f4a1a46971c704c7",
      passId: "form-refinement"
    },
    {
      passed: true,
      checks: {
        silhouetteIoU: 0.8675,
        aspectRatioDelta: 0.0234,
        scaleDelta: 0.043,
        bilateralSymmetryError: 0.1083,
        colorDelta: {
          checked: 62,
          maxDeltaE: 59.31,
          perComponent: [
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 28.82
            },
            {
              componentId: null,
              deltaE: 59.31
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.42
            },
            {
              componentId: null,
              deltaE: 31.42
            },
            {
              componentId: null,
              deltaE: 31.42
            },
            {
              componentId: null,
              deltaE: 31.42
            },
            {
              componentId: null,
              deltaE: 50.59
            },
            {
              componentId: null,
              deltaE: 31.42
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.42
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 31.42
            },
            {
              componentId: null,
              deltaE: 50.59
            },
            {
              componentId: null,
              deltaE: 15.9
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 15.9
            },
            {
              componentId: null,
              deltaE: 50.59
            },
            {
              componentId: null,
              deltaE: 15.9
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 15.9
            },
            {
              componentId: null,
              deltaE: 15.9
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 15.9
            },
            {
              componentId: null,
              deltaE: 15.9
            },
            {
              componentId: null,
              deltaE: 16.63
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 14.76
            },
            {
              componentId: null,
              deltaE: 12.07
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 59.31
            },
            {
              componentId: null,
              deltaE: 54.32
            },
            {
              componentId: null,
              deltaE: 54.32
            },
            {
              componentId: null,
              deltaE: 54.32
            },
            {
              componentId: null,
              deltaE: 54.32
            },
            {
              componentId: null,
              deltaE: 59.31
            },
            {
              componentId: null,
              deltaE: 54.32
            },
            {
              componentId: null,
              deltaE: 54.32
            },
            {
              componentId: null,
              deltaE: 54.32
            },
            {
              componentId: null,
              deltaE: 54.32
            },
            {
              componentId: null,
              deltaE: 10.73
            },
            {
              componentId: null,
              deltaE: 14.76
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 17.33
            },
            {
              componentId: null,
              deltaE: 54.32
            },
            {
              componentId: null,
              deltaE: 54.32
            }
          ],
          gated: false
        }
      },
      failures: [],
      maskWarnings: [],
      renderHash: "b7ccce1d224e5a06",
      passId: "form-refinement"
    },
    {
      passed: false,
      checks: {
        silhouetteIoU: 0.8622,
        aspectRatioDelta: 0.0234,
        scaleDelta: 0.043,
        bilateralSymmetryError: 0.109,
        colorDelta: {
          checked: 62,
          maxDeltaE: 24.65,
          perComponent: [
            {
              componentId: null,
              deltaE: 4.17
            },
            {
              componentId: null,
              deltaE: 10.64
            },
            {
              componentId: null,
              deltaE: 10.81
            },
            {
              componentId: null,
              deltaE: 4.17
            },
            {
              componentId: null,
              deltaE: 4.17
            },
            {
              componentId: null,
              deltaE: 4.17
            },
            {
              componentId: null,
              deltaE: 4.17
            },
            {
              componentId: null,
              deltaE: 11.28
            },
            {
              componentId: null,
              deltaE: 11.28
            },
            {
              componentId: null,
              deltaE: 11.28
            },
            {
              componentId: null,
              deltaE: 11.28
            },
            {
              componentId: null,
              deltaE: 24.65
            },
            {
              componentId: null,
              deltaE: 11.28
            },
            {
              componentId: null,
              deltaE: 4.17
            },
            {
              componentId: null,
              deltaE: 11.28
            },
            {
              componentId: null,
              deltaE: 4.17
            },
            {
              componentId: null,
              deltaE: 11.28
            },
            {
              componentId: null,
              deltaE: 24.65
            },
            {
              componentId: null,
              deltaE: 24.21
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 24.21
            },
            {
              componentId: null,
              deltaE: 24.65
            },
            {
              componentId: null,
              deltaE: 24.21
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 24.21
            },
            {
              componentId: null,
              deltaE: 24.21
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 24.21
            },
            {
              componentId: null,
              deltaE: 24.21
            },
            {
              componentId: null,
              deltaE: 4.17
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 11.57
            },
            {
              componentId: null,
              deltaE: 7.32
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 10.81
            },
            {
              componentId: null,
              deltaE: 7.88
            },
            {
              componentId: null,
              deltaE: 7.88
            },
            {
              componentId: null,
              deltaE: 7.88
            },
            {
              componentId: null,
              deltaE: 7.88
            },
            {
              componentId: null,
              deltaE: 10.81
            },
            {
              componentId: null,
              deltaE: 7.88
            },
            {
              componentId: null,
              deltaE: 7.88
            },
            {
              componentId: null,
              deltaE: 7.88
            },
            {
              componentId: null,
              deltaE: 7.88
            },
            {
              componentId: null,
              deltaE: 20.56
            },
            {
              componentId: null,
              deltaE: 11.57
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 6.12
            },
            {
              componentId: null,
              deltaE: 7.88
            },
            {
              componentId: null,
              deltaE: 7.88
            }
          ],
          gated: true
        }
      },
      failures: [
        "max per-part color delta-E 24.65 exceeds threshold 20.0"
      ],
      maskWarnings: [],
      renderHash: "1b5fbf5c8707e515",
      passId: "material-pass"
    },
    {
      passed: false,
      checks: {
        silhouetteIoU: 0.8622,
        aspectRatioDelta: 0.0234,
        scaleDelta: 0.043,
        bilateralSymmetryError: 0.109,
        colorDelta: {
          checked: 62,
          maxDeltaE: 24.27,
          perComponent: [
            {
              componentId: "root",
              deltaE: 4.19
            },
            {
              componentId: "plinth",
              deltaE: 10
            },
            {
              componentId: "landscape",
              deltaE: 10.53
            },
            {
              componentId: "west-wing",
              deltaE: 4.19
            },
            {
              componentId: "east-wing",
              deltaE: 4.19
            },
            {
              componentId: "central-block",
              deltaE: 4.19
            },
            {
              componentId: "tower",
              deltaE: 4.19
            },
            {
              componentId: "tower-roof",
              deltaE: 8.76
            },
            {
              componentId: "west-roof",
              deltaE: 8.76
            },
            {
              componentId: "east-roof",
              deltaE: 8.76
            },
            {
              componentId: "central-roof",
              deltaE: 8.76
            },
            {
              componentId: "arcade",
              deltaE: 17.26
            },
            {
              componentId: "arcade-roof",
              deltaE: 8.76
            },
            {
              componentId: "west-turret",
              deltaE: 4.19
            },
            {
              componentId: "west-turret-roof",
              deltaE: 8.76
            },
            {
              componentId: "east-turret",
              deltaE: 4.19
            },
            {
              componentId: "east-turret-roof",
              deltaE: 8.76
            },
            {
              componentId: "west-arcade",
              deltaE: 17.26
            },
            {
              componentId: "west-windows",
              deltaE: 24.27
            },
            {
              componentId: "west-piers",
              deltaE: 6.11
            },
            {
              componentId: "west-dormers",
              deltaE: 6.11
            },
            {
              componentId: "west-parapets",
              deltaE: 6.11
            },
            {
              componentId: "west-side-windows",
              deltaE: 24.27
            },
            {
              componentId: "east-arcade",
              deltaE: 17.26
            },
            {
              componentId: "east-windows",
              deltaE: 24.27
            },
            {
              componentId: "east-piers",
              deltaE: 6.11
            },
            {
              componentId: "east-dormers",
              deltaE: 6.11
            },
            {
              componentId: "east-parapets",
              deltaE: 6.11
            },
            {
              componentId: "east-side-windows",
              deltaE: 24.27
            },
            {
              componentId: "central-windows",
              deltaE: 24.27
            },
            {
              componentId: "tower-clock",
              deltaE: 6.11
            },
            {
              componentId: "tower-window",
              deltaE: 24.27
            },
            {
              componentId: "tower-lower-window",
              deltaE: 24.27
            },
            {
              componentId: "balcony",
              deltaE: 4.19
            },
            {
              componentId: "stairs",
              deltaE: 6.11
            },
            {
              componentId: "pavement",
              deltaE: 11.56
            },
            {
              componentId: "road",
              deltaE: 7.41
            },
            {
              componentId: "roof-dormers",
              deltaE: 6.11
            },
            {
              componentId: "central-parapet",
              deltaE: 6.11
            },
            {
              componentId: "front-plaque",
              deltaE: 6.11
            },
            {
              componentId: "west-hedges",
              deltaE: 10.53
            },
            {
              componentId: "west-tree-0",
              deltaE: 4.23
            },
            {
              componentId: "west-tree-1",
              deltaE: 4.23
            },
            {
              componentId: "west-tree-2",
              deltaE: 4.23
            },
            {
              componentId: "west-shrubs",
              deltaE: 4.23
            },
            {
              componentId: "east-hedges",
              deltaE: 10.53
            },
            {
              componentId: "east-tree-0",
              deltaE: 4.23
            },
            {
              componentId: "east-tree-1",
              deltaE: 4.23
            },
            {
              componentId: "east-tree-2",
              deltaE: 4.23
            },
            {
              componentId: "east-shrubs",
              deltaE: 4.23
            },
            {
              componentId: "lamp-system",
              deltaE: 17.36
            },
            {
              componentId: "pedestrians",
              deltaE: 11.56
            },
            {
              componentId: "road-markings",
              deltaE: 6.11
            },
            {
              componentId: "campus-sign",
              deltaE: 6.11
            },
            {
              componentId: "roof-tiles",
              deltaE: 6.11
            },
            {
              componentId: "brick-joints",
              deltaE: 6.11
            },
            {
              componentId: "stone-joints",
              deltaE: 6.11
            },
            {
              componentId: "clock-marks",
              deltaE: 6.11
            },
            {
              componentId: "balustrade",
              deltaE: 6.11
            },
            {
              componentId: "window-mullions",
              deltaE: 6.11
            },
            {
              componentId: "west-rear-tree",
              deltaE: 4.23
            },
            {
              componentId: "east-rear-tree",
              deltaE: 4.23
            }
          ],
          gated: true
        }
      },
      failures: [
        "max per-part color delta-E 24.27 exceeds threshold 20.0"
      ],
      maskWarnings: [],
      renderHash: "c00ecda22926b7bd",
      passId: "material-pass"
    }
  ],
  technicalDelivery: {
    userRequest: "\u7E7C\u7E8C\u5B8C\u6210 GLB \u9A57\u6536\u8207\u6548\u80FD\u6700\u4F73\u5316",
    scope: "Export, runtime and performance of current approximation. No reference-colour acceptance is inferred.",
    visualPipelineUnchanged: true,
    optimizations: {
      roundedBoxSegments: 1,
      sphereSegments: [
        10,
        7
      ],
      smallCylinderSegments: 6,
      batchBoundary: "semantic component + material + shadow state",
      vertexWeldTolerance: 1e-5,
      tangents: "normalized explicit tangent frames; deterministic fallback for degenerate UV islands",
      rendering: "on demand while idle; continuous only during interaction, spin or benchmark"
    },
    tests: [
      "check-delivery.mjs",
      "evidence/delivery/browser-roundtrip.json",
      "evidence/delivery/gltf-validator.json"
    ],
    status: "glb-and-performance-verified",
    limitations: [
      "Reference colour not certified",
      "Compound overlaps remain; not a watertight printing mesh",
      "Benchmarks are device-specific"
    ]
  },
  legacyIncompleteMaterialPipeline: {
    status: "incomplete-not-accepted",
    regions: [
      {
        regionId: "stone-visible",
        materialId: "stone",
        status: "proceed",
        evidence: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\stone.png"
      },
      {
        regionId: "brick-visible",
        materialId: "brick",
        status: "proceed",
        evidence: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\brick.png"
      },
      {
        regionId: "roof-visible",
        materialId: "roof",
        status: "proceed",
        evidence: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\roof.png"
      },
      {
        regionId: "foliage-visible",
        materialId: "foliage",
        status: "proceed",
        evidence: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\foliage.png"
      },
      {
        regionId: "base-visible",
        materialId: "base",
        status: "proceed",
        evidence: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\base.png"
      },
      {
        regionId: "paving-visible",
        materialId: "paving",
        status: "proceed",
        evidence: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\paving.png"
      },
      {
        regionId: "glass-visible",
        materialId: "glass",
        status: "proceed",
        evidence: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\glass.png"
      },
      {
        regionId: "grass-visible",
        materialId: "grass",
        status: "proceed",
        evidence: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\grass.png"
      },
      {
        regionId: "trim-visible",
        materialId: "trim",
        status: "proceed",
        evidence: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\trim.png"
      },
      {
        regionId: "road-visible",
        materialId: "road",
        status: "proceed",
        evidence: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\road.png"
      },
      {
        regionId: "metal-visible",
        materialId: "metal",
        status: "proceed",
        evidence: "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\metal.png"
      }
    ],
    note: "Previous per-crop extraction record was not a valid regional materialPipeline. Preserved for provenance; referencePbr records remain authoritative. No colour acceptance is claimed."
  }
};

// src/modelDelivery.ts
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
function modelStats(root) {
  let meshes = 0, triangles = 0, vertices = 0;
  const materials = /* @__PURE__ */ new Set(), geometries = /* @__PURE__ */ new Set();
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      meshes++;
      triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
      vertices += o.geometry.attributes.position.count;
      geometries.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
    }
  });
  return { meshes, triangles, vertices, materials: materials.size, geometries: geometries.size };
}
function addPortableTangents(root, materialNames) {
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material) || !materialNames.has(o.material.name)) return;
    if (!o.geometry.index) {
      const old = o.geometry;
      o.geometry = mergeVertices(old, 1e-5);
      old.dispose();
    }
    const g = o.geometry;
    if (!g.attributes.uv || !g.attributes.normal) return;
    g.computeTangents();
    const t = g.attributes.tangent, n = g.attributes.normal;
    const normal = new THREE.Vector3(), tangent = new THREE.Vector3(), axis = new THREE.Vector3();
    for (let i = 0; i < t.count; i++) {
      normal.fromBufferAttribute(n, i).normalize();
      tangent.fromBufferAttribute(t, i);
      tangent.addScaledVector(normal, -normal.dot(tangent));
      if (!Number.isFinite(tangent.lengthSq()) || tangent.lengthSq() < 1e-10) {
        axis.set(Math.abs(normal.y) < 0.9 ? 0 : 1, Math.abs(normal.y) < 0.9 ? 1 : 0, 0);
        tangent.crossVectors(axis, normal);
      }
      tangent.normalize();
      t.setXYZW(i, tangent.x, tangent.y, tangent.z, t.getW(i) < 0 ? -1 : 1);
    }
  });
}
function batchCampus(root) {
  root.updateMatrixWorld(true);
  const batches = /* @__PURE__ */ new Map();
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
    let owner = o.parent;
    while (owner && !owner.userData.componentId) owner = owner.parent;
    if (!owner) return;
    if (!batches.has(owner)) batches.set(owner, /* @__PURE__ */ new Map());
    const key = `${o.material.uuid}:${o.castShadow}:${o.receiveShadow}:${o.visible}`;
    const bucket = batches.get(owner);
    if (!bucket.has(key)) bucket.set(key, []);
    bucket.get(key).push(o);
  });
  const retired = /* @__PURE__ */ new Set();
  for (const [owner, buckets] of batches) {
    const inverse = owner.matrixWorld.clone().invert();
    for (const list of buckets.values()) {
      if (list.length < 2) continue;
      const transformed = list.map((o) => {
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        for (const name of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
        if (!g.getAttribute("uv")) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
        g.clearGroups();
        return g;
      });
      const merged = mergeGeometries(transformed, false);
      if (!merged) throw new Error("Component batching failed");
      const welded = mergeVertices(merged, 1e-5);
      merged.dispose();
      transformed.forEach((g) => g.dispose());
      welded.computeBoundingBox();
      welded.computeBoundingSphere();
      const first = list[0], mesh = new THREE.Mesh(welded, first.material);
      mesh.name = `${owner.name}-${first.material.name || "material"}-batch`;
      mesh.castShadow = first.castShadow;
      mesh.receiveShadow = first.receiveShadow;
      mesh.visible = first.visible;
      mesh.userData = { explodeWithParent: true, sourceMeshCount: list.length };
      owner.add(mesh);
      for (const old of list) {
        old.removeFromParent();
        retired.add(old.geometry);
      }
    }
  }
  const alive = /* @__PURE__ */ new Set();
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) alive.add(o.geometry);
  });
  retired.forEach((g) => {
    if (!alive.has(g)) g.dispose();
  });
  root.updateMatrixWorld(true);
}

// src/createCampusModel.ts
function createCampusModel(spec = object_sculpt_spec_default, options = {}) {
  const optimized = options.optimize !== false;
  const stage = Math.min(options.stage ?? spec.campusBlueprint.activeStage, spec.campusBlueprint.activeStage);
  const root = new THREE2.Group();
  root.name = "ChaoyangClocktowerCampus";
  const nodes = {}, mats = {};
  const colliders = {}, sockets = {};
  const materialColors = { stone: "#dfcfb0", trim: "#f0dfba", brick: "#bd6744", roof: "#a76450", foliage: "#a7b44f", grass: "#929f40", glass: "#88a6aa", paving: "#e8d6b7", base: "#caaa7c", road: "#b8aea0", metal: "#6d6b60", bark: "#897040", joint: "#b9a58a", tileSeam: "#885441", white: "#fff9e9", yellow: "#e8bf6c", skin: "#deb08a", blue: "#678ca0", rose: "#b66862", leafLight: "#bbc560" };
  for (const [id, color] of Object.entries(materialColors)) mats[id] = new THREE2.MeshStandardMaterial({ color, roughness: id === "glass" ? 0.3 : 0.85 });
  for (const [id, material] of Object.entries(mats)) material.name = id;
  const textureJobs = [], textures = [];
  if (stage >= 3) {
    mats.leafLight.color.set("#aab544");
    const loader = typeof document !== "undefined" ? new THREE2.TextureLoader() : null;
    for (const source of spec.materials) {
      const info = source, m = mats[source.id];
      if (!m) continue;
      m.color.set(info.renderColor ?? source.color);
      m.roughness = info.roughness.base;
      m.metalness = info.metalness.base;
      if (!loader || !info.referencePbr?.usable) continue;
      for (const [channel, slot] of [["roughness", "roughnessMap"], ["normal", "normalMap"], ["ao", "aoMap"]]) {
        const uri = info.referencePbr.maps[channel].url;
        textureJobs.push(loader.loadAsync(uri).then((t) => {
          t.colorSpace = THREE2.NoColorSpace;
          t.wrapS = t.wrapT = THREE2.RepeatWrapping;
          t.anisotropy = 8;
          textures.push(t);
          m[slot] = t;
          m.needsUpdate = true;
        }));
      }
      m.roughness = source.id === "glass" ? 0.4 : 1;
      m.normalScale.setScalar(source.id === "glass" ? 0.018 : 0.09);
      m.aoMapIntensity = 0.15;
    }
  }
  root.userData.assetsReady = textureJobs.length === 0;
  Promise.all(textureJobs).then(() => {
    root.userData.assetsReady = true;
  }).catch((e) => {
    root.userData.assetError = String(e);
  });
  const grey = new THREE2.MeshStandardMaterial({ color: "#d8cdbb", roughness: 0.9 });
  function mesh(g, mat, parent, p = [0, 0, 0], scale) {
    if (stage >= 3) {
      const pos = g.getAttribute("position"), norm = g.getAttribute("normal"), uv = [];
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) * (scale?.[0] ?? 1), y = pos.getY(i) * (scale?.[1] ?? 1), z = pos.getZ(i) * (scale?.[2] ?? 1);
        const nx = Math.abs(norm.getX(i)), ny = Math.abs(norm.getY(i)), nz = Math.abs(norm.getZ(i));
        uv.push(...ny > nx && ny > nz ? [x / 2, z / 2] : nx > nz ? [z / 2, y / 2] : [x / 2, y / 2]);
      }
      g.setAttribute("uv", new THREE2.Float32BufferAttribute(uv, 2));
    }
    const m = new THREE2.Mesh(g, mats[mat] ?? grey);
    m.position.set(...p);
    if (scale) m.scale.set(...scale);
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = `${parent.name}-surface-${parent.children.length}`;
    m.userData.explodeWithParent = true;
    parent.add(m);
    return m;
  }
  function box(parent, size, p, mat, r = 0.03) {
    if (size.some((v) => v <= 0)) throw new Error("Nonpositive box dimension");
    return mesh(r ? new RoundedBoxGeometry(...size, optimized ? 1 : 2, Math.min(r, ...size.map((v) => v / 3))) : new THREE2.BoxGeometry(...size), mat, parent, p);
  }
  function sphere(parent, p, scale, mat = "foliage") {
    return mesh(new THREE2.SphereGeometry(1, optimized ? 10 : 12, optimized ? 7 : 8), mat, parent, p, scale);
  }
  function cylinder(parent, a, b, r1, r2, mat) {
    const va = new THREE2.Vector3(...a), vb = new THREE2.Vector3(...b), delta = vb.clone().sub(va);
    const m = mesh(new THREE2.CylinderGeometry(r2, r1, delta.length(), optimized && Math.max(r1, r2) < 0.06 ? 6 : 9), mat, parent);
    m.position.copy(va.add(vb).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE2.Vector3(0, 1, 0), delta.normalize());
    return m;
  }
  function hip(parent, w, h, d, ratio) {
    const points = [];
    for (const y of [0, h]) for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) points.push(new THREE2.Vector3(x * w / 2 * (y ? ratio : 1), y, z * d / 2 * (y ? ratio : 1)));
    mesh(new ConvexGeometry(points), "roof", parent);
    box(parent, [w + 0.13, 0.18, d + 0.13], [0, 0.015, 0], "trim", 0.035);
    if (stage >= 2) {
      if (ratio > 0.1) box(parent, [w * ratio, 0.12, d * ratio], [0, h + 0.04, 0], "trim");
      for (let row = 1; row < Math.ceil(h / 0.18); row++) {
        const t = row / Math.ceil(h / 0.18), s = 1 - t * (1 - ratio), y = t * h + 0.01;
        for (const z of [-1, 1]) cylinder(parent, [-w * s / 2, y, z * d * s / 2], [w * s / 2, y, z * d * s / 2], 0.014, 0.014, "tileSeam");
        for (const x of [-1, 1]) cylinder(parent, [x * w * s / 2, y, -d * s / 2], [x * w * s / 2, y, d * s / 2], 0.014, 0.014, "tileSeam");
      }
      for (const z of [-1, 1]) for (let i = 1; i < Math.ceil(w / 0.22); i++) {
        const x = -w / 2 + w * i / Math.ceil(w / 0.22);
        cylinder(parent, [x, 0.1, z * d / 2], [x * ratio, h + 0.012, z * d * ratio / 2], 0.01, 0.01, "tileSeam");
      }
      for (const x of [-1, 1]) for (let i = 1; i < Math.ceil(d / 0.25); i++) {
        const z = -d / 2 + d * i / Math.ceil(d / 0.25);
        cylinder(parent, [x * w / 2, 0.1, z], [x * w * ratio / 2, h + 0.012, z * ratio], 0.01, 0.01, "tileSeam");
      }
    }
  }
  function arcade(parent, w, h, d, count, wall = "brick") {
    const bay = w / count, r = bay * 0.4, spring = h - r - 0.27;
    for (let i = 0; i < count; i++) {
      const s = new THREE2.Shape();
      s.moveTo(-bay / 2, 0);
      s.lineTo(-bay / 2, h);
      s.lineTo(bay / 2, h);
      s.lineTo(bay / 2, 0);
      s.lineTo(r, 0);
      s.lineTo(r, spring);
      s.absarc(0, spring, r, 0, Math.PI, false);
      s.lineTo(-r, 0);
      s.closePath();
      const geo = new THREE2.ExtrudeGeometry(s, { depth: 0.44, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, steps: 1, curveSegments: 20 });
      mesh(geo, wall, parent, [-w / 2 + bay * (i + 0.5), 0, d / 2 - 0.44]);
    }
    box(parent, [w, 0.18, d], [0, h + 0.04, 0], "trim");
    box(parent, [w, 0.1, d], [0, 0.015, 0], "paving");
    box(parent, [0.3, h, d], [-w / 2 + 0.14, h / 2, 0], wall);
    box(parent, [0.3, h, d], [w / 2 - 0.14, h / 2, 0], wall);
  }
  function windowPane(parent, x, y, w, h, z = 0, arched = false) {
    if (arched) {
      const s = new THREE2.Shape();
      s.moveTo(-w / 2, -h / 2);
      s.lineTo(w / 2, -h / 2);
      s.lineTo(w / 2, h / 2 - w / 2);
      s.absarc(0, h / 2 - w / 2, w / 2, 0, Math.PI, false);
      s.closePath();
      mesh(new THREE2.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: false, curveSegments: 20 }), "glass", parent, [x, y, z]);
      const curve = new THREE2.EllipseCurve(0, 0, w / 2 + 0.045, w / 2 + 0.045, 0, Math.PI, false, 0).getPoints(24).map((p) => new THREE2.Vector3(p.x + x, p.y + y + h / 2 - w / 2, z + 0.035));
      mesh(new THREE2.TubeGeometry(new THREE2.CatmullRomCurve3(curve), 24, 0.035, 6, false), "trim", parent);
    } else box(parent, [w, h, 0.055], [x, y, z], "glass", 5e-3);
    box(parent, [0.045, h, 0.072], [x, y, z + 0.045], "trim", 0);
    for (const dy of [-h / 2 + 0.04, 0, h / 2 - 0.03]) if (!arched || dy <= 0) box(parent, [w + 0.08, 0.05, 0.075], [x, y + dy, z + 0.05], "trim", 0);
    for (const dx of [-w / 2 - 0.035, w / 2 + 0.035]) box(parent, [0.07, arched ? h - w / 2 : h, 0.1], [x + dx, y - (arched ? w / 4 : 0), z + 0.025], "trim", 0.01);
    box(parent, [w + 0.2, 0.1, 0.2], [x, y - h / 2 - 0.06, z + 0.03], "trim", 0.02);
  }
  function windows(parent, w, h, cols, rows) {
    const pitch = w / cols, ypitch = h / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) windowPane(parent, -w / 2 + pitch * (i + 0.5), j * ypitch + ypitch * 0.45, Math.min(0.67, pitch * 0.56), ypitch * 0.72, 0);
  }
  function arcTrim(parent, x, spring, r, z) {
    const s = new THREE2.Shape();
    s.absarc(0, 0, r + 0.075, 0, Math.PI, false);
    s.absarc(0, 0, r, Math.PI, 0, true);
    s.closePath();
    mesh(new THREE2.ExtrudeGeometry(s, { depth: 0.09, bevelEnabled: false, curveSegments: 24 }), "trim", parent, [x, spring, z]);
    for (const dx of [-r, r]) {
      box(parent, [0.13, spring, 0.19], [x + dx, spring / 2, z + 0.04], "trim", 0.02);
      box(parent, [0.25, 0.12, 0.28], [x + dx, spring, z + 0.06], "trim");
      box(parent, [0.24, 0.12, 0.26], [x + dx, 0.06, z + 0.06], "trim");
    }
  }
  function build(c, g) {
    const { width: w, height: h, depth: d } = c.dimensions;
    const cfg = c.campus;
    switch (cfg.kind) {
      case "container":
        return;
      case "plinth":
        box(g, [w, h, d], [0, 0, 0], "base", 0.65);
        box(g, [w - 0.18, 0.18, d - 0.18], [0, h / 2 - 0.04, 0], "paving", 0.56);
        break;
      case "garden-base":
        box(g, [w, h, d], [0, 0, 0], "grass", 0.3);
        break;
      case "road":
        box(g, [w, h, d], [0, 0, 0], "road", 0.07);
        break;
      case "wing":
        box(g, [w, h, d], [0, 0, 0], "stone", 0.06);
        box(g, [w + 0.15, 0.24, d + 0.15], [0, h / 2 - 0.06, 0], "trim");
        break;
      case "tower":
        box(g, [w, h, d], [0, 0, 0], "stone", 0.055);
        box(g, [w + 0.25, 0.23, d + 0.25], [0, h / 2 - 0.04, 0], "trim");
        break;
      case "turret":
        box(g, [w, h, d], [0, 0, 0], "stone", 0.06);
        box(g, [w + 0.2, 0.2, d + 0.2], [0, h / 2 - 0.02, 0], "trim");
        if (stage >= 1) for (const y of [-1.4, 0, 1.4]) windowPane(g, 0, y, 0.26, 0.5, d / 2 + 0.025);
        break;
      case "hip":
        hip(g, w, h, d, cfg.topRatio ?? 0.6);
        break;
      case "arcade": {
        const count = cfg.count ?? 3;
        arcade(g, w, h, d, count);
        if (stage >= 1) for (let i = 0; i < count; i++) {
          const bay = w / count, x = -w / 2 + bay * (i + 0.5), r = bay * 0.4;
          arcTrim(g, x, h - r - 0.27, r, d / 2 + 0.012);
          if (cfg.glazed) windowPane(g, x, h * 0.43, bay * 0.72, h * 0.83, d / 2 - 0.065, true);
          else {
            box(g, [bay * 0.6, h * 0.73, 0.09], [x, h * 0.36, -d / 2 + 0.03], "bark");
            windowPane(g, x, h * 0.48, bay * 0.51, h * 0.59, -d / 2 + 0.09, true);
          }
        }
        break;
      }
      case "windows":
        windows(g, w, h, cfg.columns, cfg.rows);
        break;
      case "side-windows":
        g.rotation.y = cfg.side === "east" ? Math.PI / 2 : -Math.PI / 2;
        windows(g, w, h, cfg.columns, cfg.rows);
        break;
      case "piers":
        for (let i = 0; i <= 5; i++) box(g, [0.2, h, 0.22], [-w / 2 + i * w / 5, h / 2, 0], "trim", 0.025);
        box(g, [w + 0.1, 0.24, 0.38], [0, 0, 0.04], "trim");
        box(g, [w + 0.12, 0.18, 0.32], [0, h, 0.04], "trim");
        break;
      case "dormers":
        for (let i = 0; i < cfg.count; i++) {
          const x = (i - (cfg.count - 1) / 2) * w / (cfg.count + 1);
          box(g, [0.53, h, 0.65], [x, h * 0.43, 0], "stone");
          box(g, [0.7, 0.2, 0.87], [x, h * 0.91, 0.01], "trim");
          windowPane(g, x, h * 0.42, 0.23, h * 0.55, 0.35);
        }
        break;
      case "parapet":
        for (const z of [-d / 2, d / 2]) {
          box(g, [w, 0.23, 0.25], [0, 0, z], "trim");
          for (const x of [-w / 2, 0, w / 2]) box(g, [0.65, 0.43, 0.58], [x, 0.16, z], "trim");
        }
        for (const x of [-w / 2, w / 2]) box(g, [0.25, 0.24, d], [x, 0, 0], "trim");
        break;
      case "clock": {
        box(g, [w + 0.38, h + 0.38, 0.18], [0, 0, 0.01], "trim");
        const dial = mesh(new THREE2.CylinderGeometry(w * 0.46, w * 0.46, 0.07, 48), "paving", g, [0, 0, 0.15]);
        dial.rotation.x = Math.PI / 2;
        mesh(new THREE2.TorusGeometry(w * 0.47, 0.042, 8, 48), "bark", g, [0, 0, 0.2]);
        for (let i = 0; i < 12; i++) {
          const a = i * Math.PI / 6, m = box(g, [i % 3 === 0 ? 0.045 : 0.03, 0.105, 0.025], [Math.sin(a) * w * 0.38, Math.cos(a) * w * 0.38, 0.208], "metal", 0);
          m.rotation.z = -a;
        }
        const hour = box(g, [0.047, w * 0.27, 0.027], [0, w * 0.12, 0.24], "metal", 0.01);
        hour.rotation.z = -0.2;
        const minute = box(g, [0.035, w * 0.36, 0.035], [0, w * 0.16, 0.23], "metal", 0.01);
        minute.rotation.z = -1.16;
        sphere(g, [0, 0, 0.245], [0.055, 0.055, 0.025], "metal");
        break;
      }
      case "arched-window":
        windowPane(g, 0, 0, w, h, 0, true);
        for (const j of [-0.75, -0.25, 0.25, 0.75]) box(g, [w, 0.033, 0.06], [0, j, 0.05], "trim", 0);
        break;
      case "balcony": {
        box(g, [w + 0.25, 0.22, d + 0.18], [0, h, 0], "trim");
        box(g, [w, 0.19, d], [0, 0.45, 0], "trim");
        const upper = new THREE2.Group();
        upper.name = "balcony-upper-arches";
        upper.position.y = 0.5;
        g.add(upper);
        arcade(upper, w, h - 0.5, d, 2, "stone");
        for (const x of [-w * 0.22, w * 0.22]) {
          box(g, [w * 0.44, 0.12, 0.15], [x, 0.93, d / 2], "trim");
          for (let i = 0; i < 7; i++) cylinder(g, [x - w * 0.19 + i * w * 0.063, 0.54, d / 2], [x - w * 0.19 + i * w * 0.063, 0.9, d / 2], 0.025, 0.025, "trim");
        }
        for (const x of [-w / 2, w / 2]) box(g, [0.18, 0.65, d], [x, 0.74, 0], "stone");
        break;
      }
      case "stairs":
        for (let i = 0; i < cfg.count; i++) {
          const depth = d * (cfg.count - i) / cfg.count;
          box(g, [w, h * (i + 1) / cfg.count, depth], [0, h * (i + 1) / cfg.count / 2, -d / 2 + depth / 2], "trim", 0.018);
        }
        for (const x of [-w / 2 - 0.15, w / 2 + 0.15]) for (let i = 0; i < 4; i++) box(g, [0.3, 0.28 + h * i / 4, d / 4], [x, (0.28 + h * i / 4) / 2, d / 2 - (i + 0.5) * d / 4], "stone", 0.04);
        break;
      case "pavement":
        box(g, [w, h, d], [0, 0, 0], "paving");
        if (stage >= 2) {
          for (let x = -w / 2 + 0.5; x < w / 2; x += 0.5) box(g, [0.012, 6e-3, d], [x, h / 2 + 5e-3, 0], "joint", 0);
          for (const z of [-0.5, 0, 0.5]) box(g, [w, 6e-3, 0.012], [0, h / 2 + 5e-3, z], "joint", 0);
        }
        break;
      case "hedges": {
        const curve = new THREE2.CatmullRomCurve3([new THREE2.Vector3(-w * 0.46, 0, -d * 0.4), new THREE2.Vector3(-w * 0.47, 0, d * 0.3), new THREE2.Vector3(-w * 0.25, 0, d * 0.5), new THREE2.Vector3(w * 0.3, 0, d * 0.5), new THREE2.Vector3(w * 0.45, 0, d * 0.25), new THREE2.Vector3(w * 0.42, 0, -d * 0.4)], false, "catmullrom", 0.2);
        for (let i = 0; i <= 48; i++) {
          const p = curve.getPoint(i / 48);
          box(g, [0.32, 0.25, 0.37], [p.x, 0, p.z], "trim", 0.08);
          sphere(g, [p.x, 0.34, p.z], [0.36, 0.38, 0.36], "grass");
        }
        box(g, [w * 0.68, 0.05, d * 0.64], [0, 0.06, 0], "grass", 0.1);
        break;
      }
      case "tree": {
        cylinder(g, [0, -0.05, 0], [0, h * 0.7, 0], 0.27, 0.12, "bark");
        for (let i = 0; i < 6; i++) {
          const a = i * 2.4;
          const y = h * (0.4 + i * 0.085), x = Math.sin(a) * w * 0.23, z = Math.cos(a) * d * 0.23;
          cylinder(g, [0, y - 0.6, 0], [x, y + 0.15, z], 0.12, 0.06, "bark");
          sphere(g, [x, y, z], stage >= 2 ? [0.73, 0.44, 0.68] : [w * 0.4, stage >= 1 ? 0.48 : h * 0.19, d * 0.4]);
          if (stage >= 1) for (let j = 0; j < (stage >= 2 ? 11 : 3); j++) {
            const b = a + j * 2.09;
            const radial = stage >= 2 ? 0.72 + j % 3 * 0.15 : 0.7;
            sphere(g, [x + Math.cos(b) * radial, y + 0.07 + j % 3 * 0.16, z + Math.sin(b) * radial * 0.87], stage >= 2 ? [0.4, 0.34, 0.4] : [0.82, 0.45, 0.72], stage >= 2 && j % 3 === 0 ? "leafLight" : "foliage");
          }
        }
        break;
      }
      case "plaque": {
        box(g, [w, h, d], [0, 0, 0], "trim", 0.12);
        box(g, [w - 0.2, h - 0.16, 0.03], [0, 0, d / 2 + 0.012], "paving", 0.07);
        if (typeof document !== "undefined") {
          const canvas = document.createElement("canvas");
          canvas.width = 1536;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#eedcba";
          ctx.fillRect(0, 0, 1536, 256);
          ctx.fillStyle = "#967c57";
          ctx.font = '110px "Microsoft JhengHei", serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("\u671D\u967D\u79D1\u6280\u5927\u5B78", 850, 133);
          ctx.fillStyle = "#83a7a9";
          ctx.beginPath();
          ctx.arc(200, 150, 55, Math.PI, 0);
          ctx.fill();
          ctx.strokeStyle = "#d7a751";
          ctx.lineWidth = 14;
          for (let i = 0; i < 9; i++) {
            const a = Math.PI + i * Math.PI / 8;
            ctx.beginPath();
            ctx.moveTo(200 + Math.cos(a) * 66, 150 + Math.sin(a) * 66);
            ctx.lineTo(200 + Math.cos(a) * 90, 150 + Math.sin(a) * 90);
            ctx.stroke();
          }
          const texture = new THREE2.CanvasTexture(canvas);
          texture.colorSpace = THREE2.SRGBColorSpace;
          const label = new THREE2.Mesh(new THREE2.PlaneGeometry(w - 0.24, h - 0.2), new THREE2.MeshStandardMaterial({ map: texture, roughness: 0.9 }));
          label.position.z = d / 2 + 0.03;
          label.name = c.id + "-lettering";
          label.userData.explodeWithParent = true;
          g.add(label);
        }
        break;
      }
      case "shrubs": {
        for (let i = 0; i < 12; i++) {
          const x = Math.sin(i * 2.39) * w * 0.43, z = Math.cos(i * 1.7) * d * 0.4;
          sphere(g, [x, 0.18, z], [0.35, 0.33, 0.3], i % 3 ? "grass" : "foliage");
          if (i % 2 === 0) sphere(g, [x + 0.1, 0.36, z + 0.15], [0.055, 0.055, 0.055], "rose");
        }
        for (const x of [-w * 0.25, w * 0.25]) {
          cylinder(g, [x, 0, 0], [x, 1.18, 0], 0.11, 0.05, "bark");
          for (let j = 0; j < 5; j++) {
            const a = j * 2.4;
            sphere(g, [x + Math.sin(a) * 0.32, 1.15 + j * 0.08, Math.cos(a) * 0.25], [0.47, 0.32, 0.41], j % 2 ? "foliage" : "leafLight");
          }
        }
        break;
      }
      case "lamps":
        for (const x of [-10, -5.3, 5.3, 9.7]) {
          cylinder(g, [x, 0, 0], [x, 0.09, 0], 0.14, 0.14, "metal");
          cylinder(g, [x, 0.05, 0], [x, 1.62, 0], 0.043, 0.029, "metal");
          box(g, [0.22, 0.3, 0.22], [x, 1.61, 0], "yellow", 0.018);
          const cap = mesh(new THREE2.ConeGeometry(0.21, 0.17, 4), "metal", g, [x, 1.845, 0]);
          cap.rotation.y = Math.PI / 4;
          for (const dx of [-0.11, 0.11]) for (const z of [-0.11, 0.11]) cylinder(g, [x + dx, 1.45, z], [x + dx, 1.77, z], 0.014, 0.014, "metal");
          cylinder(g, [x, 0.95, 0], [x + 0.3, 0.95, 0], 0.025, 0.025, "metal");
          box(g, [0.21, 0.37, 0.025], [x + 0.26, 0.8, 0], "blue", 0.012);
        }
        break;
      case "people":
        for (let i = 0; i < 9; i++) {
          const x = -9.1 + i * 2.35, z = Math.sin(i * 3.1) * 0.25, body = i % 3 === 0 ? "rose" : i % 3 === 1 ? "blue" : "grass";
          sphere(g, [x, 0.5, z], [0.14, 0.16, 0.135], "skin");
          sphere(g, [x, 0.575, z - 0.015], [0.145, 0.09, 0.13], i % 2 ? "bark" : "base");
          sphere(g, [x, 0.25, z], [0.105, 0.15, 0.085], body);
          for (const side of [-1, 1]) {
            cylinder(g, [x + side * 0.05, 0.19, z], [x + side * 0.067, 0.045, z + side * 0.03], 0.035, 0.035, "blue");
            sphere(g, [x + side * 0.065, 0.025, z + 0.03], [0.045, 0.035, 0.068], "bark");
            cylinder(g, [x + side * 0.085, 0.32, z], [x + side * 0.13, 0.17, z + 0.02], 0.03, 0.03, "skin");
          }
        }
        break;
      case "markings": {
        const y = 0.159 - c.transform.position[1], z = 7.65 - c.transform.position[2];
        for (const x of [-10, 0, 8.5]) for (let i = 0; i < 5; i++) box(g, [1.4, 0.012, 0.19], [x, y, z - 0.75 + i * 0.36], "white", 0);
        for (let x = -12; x < 13; x += 2) if (Math.abs(x) > 0.95) box(g, [1.05, 0.01, 0.035], [x, y + 2e-3, z], "yellow", 0);
        break;
      }
      case "sign":
        box(g, [w, h, d], [0, h / 2, 0], "trim", 0.06);
        box(g, [w * 0.76, h * 0.65, 0.03], [0, h * 0.56, d / 2 + 0.02], "paving");
        sphere(g, [0, h * 0.6, d / 2 + 0.05], [0.27, 0.27, 0.025], "yellow");
        sphere(g, [0, h * 0.49, d / 2 + 0.065], [0.3, 0.13, 0.025], "blue");
        box(g, [w + 0.35, 0.3, 0.7], [0, 0.15, 0], "brick", 0.07);
        for (let i = 0; i < 5; i++) sphere(g, [-0.48 + i * 0.24, 0.35, 0.15], [0.15, 0.15, 0.13], "foliage");
        break;
      case "relief": {
        const p = spec.componentTree.find((x) => x.id === c.parent);
        const pw = p.dimensions.width, ph = p.dimensions.height, pd = p.dimensions.depth;
        if (c.id === "roof-tiles") for (const x of [-1, 1]) cylinder(g, [x * pw / 2, 0.12, pd / 2], [x * pw * p.campus.topRatio / 2, ph + 0.03, pd * p.campus.topRatio / 2], 0.04, 0.04, "roof");
        if (c.id === "brick-joints") for (let y = 2.4; y < ph; y += 0.2) box(g, [pw, 0.013, 0.012], [0, y, pd / 2 + 0.032], "tileSeam", 0);
        if (c.id === "stone-joints") for (let y = -ph / 2 + 0.6; y < ph / 2; y += 0.72) {
          box(g, [pw, 0.013, 9e-3], [0, y, pd / 2 + 0.058], "joint", 0);
          box(g, [0.01, 0.013, pd], [pw / 2 + 0.058, y, 0], "joint", 0);
        }
        if (c.id === "clock-marks") {
          const s = new THREE2.Shape();
          s.moveTo(-pw * 0.64, ph * 0.48);
          s.lineTo(0, ph * 0.95);
          s.lineTo(pw * 0.64, ph * 0.48);
          s.closePath();
          mesh(new THREE2.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.02, bevelSegments: 1 }), "trim", g, [0, 0, -0.04]);
          for (let i = 0; i < 60; i++) if (i % 5) {
            const a = i * Math.PI / 30, m = box(g, [0.013, 0.035, 0.016], [Math.sin(a) * pw * 0.405, Math.cos(a) * pw * 0.405, 0.207], "bark", 0);
            m.rotation.z = -a;
          }
        }
        if (c.id === "balustrade") for (const x of [-pw * 0.48, pw * 0.48]) box(g, [0.18, 0.2, 0.22], [x, 1, pd / 2], "trim");
        if (c.id === "window-mullions") for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) box(g, [0.035, 0.95, 0.03], [-pw / 2 + pw / 5 * (i + 0.5), ph / 3 * (j + 0.45), 0.1], "trim", 0);
        break;
      }
    }
  }
  for (const c of spec.componentTree) {
    if (c.campus.stage > stage) continue;
    const g = new THREE2.Group();
    g.name = c.id;
    g.position.fromArray(c.transform.position);
    g.userData.componentId = c.id;
    g.userData.label = c.name;
    g.userData.actionProfile = c.actionProfile;
    nodes[c.id] = g;
    (c.parent && nodes[c.parent] ? nodes[c.parent] : root).add(g);
    colliders[c.id] = c.actionProfile.collider;
    const socket = new THREE2.Object3D();
    socket.name = c.id + ":assembly-origin";
    g.add(socket);
    sockets[socket.name] = socket;
    build(c, g);
  }
  root.updateMatrixWorld(true);
  const unbatchedStats = modelStats(root);
  if (optimized) {
    batchCampus(root);
    if (stage >= 3) addPortableTangents(root, new Set(spec.materials.filter((m) => m.referencePbr?.usable).map((m) => m.id)));
  }
  const rest = {};
  for (const [id, n] of Object.entries(nodes)) rest[id] = n.position.clone();
  root.userData.sculptRuntime = {
    nodes,
    colliders,
    sockets,
    stage,
    restPositions: rest,
    optimized,
    unbatchedStats,
    stats: modelStats(root),
    setExplode(amount) {
      for (const [id, n] of Object.entries(nodes)) {
        const c = spec.componentTree.find((c2) => c2.id === id);
        n.position.copy(rest[id]);
        if (c.parent === "root") n.position.addScaledVector(rest[id].clone().sub(new THREE2.Vector3(0, 3.5, 0)), amount * 0.55);
      }
    },
    tick(_time) {
    },
    dispose() {
      const geometries = /* @__PURE__ */ new Set(), materials = /* @__PURE__ */ new Set(), allTextures = new Set(textures);
      root.traverse((o) => {
        if (o instanceof THREE2.Mesh) {
          geometries.add(o.geometry);
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            materials.add(m);
            for (const value of Object.values(m)) if (value instanceof THREE2.Texture) allTextures.add(value);
          }
        }
      });
      geometries.forEach((g) => g.dispose());
      allTextures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
      Object.values(mats).forEach((m) => m.dispose());
      grey.dispose();
    }
  };
  return root;
}
export {
  createCampusModel
};
