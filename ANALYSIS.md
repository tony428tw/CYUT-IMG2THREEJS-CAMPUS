# Chaoyang clocktower campus reconstruction

Reference: the user-supplied 1672 × 941 image. This is one coherent tabletop architectural diorama, not a request to reconstruct the poster background or its annotation typography. Intended output: interactive browser prop. Conditional suitability: visible front/right façade and roof are clear; rear, interiors and exact dimensions are not observable. The source itself is stylized; the result is a stylized procedural reconstruction, not a survey of the real campus.

## Direct observation

The diorama has a rounded beige rectangular plinth, a two-lane road along its front edge, pale pavement, a raised garden and a central staircase. The main building is bilaterally organized around a slender square clock tower. Three upper storeys of beige stone sit above a terracotta brick ground floor. Blue-grey rectangular windows repeat between stone piers. The wings carry truncated hip/mansard roofs with small pale dormers and raised pale parapets. Two narrower front turrets flank a two-opening balcony. The front entrance projects outward, with three true open arches below a low tiled hip roof. The clock tower rises substantially above the roofline; it has a round cream dial, dark tick marks/hands, a tall arched blue window, and a red pyramidal roof. Bushes, clipped curved hedges and layered yellow-green broadleaf trees occupy both sides. Small stylized pedestrian figures and slender street lamps give scale.

## Measurement anchors (image pixels; approximate observed landmarks)

- Tower apex (878,39); tower clock centre (831,136); tower front cornice (800,355).
- Main roof eaves roughly (462,315) to (1256,431); main entrance arch band roughly (620,559) to (975,658).
- Plinth visible envelope roughly (96,558) to (1536,933); building upper mass roughly (459,180) to (1338,687).
- Front window rhythm: about five bays per outer wing, three vertically repeated upper rows. Central arcade: three openings; flank brick arcades: three openings each.
- Adopt +Y up, +Z front; inferred orthographic camera yaw 28 degrees and elevation 26 degrees. Architectural width 19.4 units, plinth width 28, depth 17.5, tower apex 14.0. These are relative units, not metres.

## Hierarchy and geometry

Plinth → pavement/road/garden; architecture → west/east wing + central block + tower + projecting arcade; roof groups → hip shells + dormers + parapets; façade groups → glazing + mullions + stone trim + pilasters; garden → rooted trunks + branching segments + overlapping ellipsoidal foliage. Arches use extruded curved profiles with genuine negative space. Hip roofs use closed polyhedral meshes and raised tile seams. Repeated window, tile, paving and foliage geometry can be instanced/merged inside named selectable assemblies. Every independent assembly has a stable pivot and collider metadata; relief follows its assembly during explode.

## Material interpretation

Observed warm ivory stone, terracotta brick, muted red-brown tiles, grey-blue glazing, yellow-green foliage, tan pavement/base and grey roadway are predominantly matte dielectrics. Roughness inference is uncertain because the source is a stylized render; do not treat cast shadows as albedo. Sample bounded material crops, use their palettes as evidence, and use independent procedural relief/roughness fields. Architectural joints and roof tiles are geometry, not projected building photography. Projection is not applicable to the solid-colour architecture; the campus plaque will use generated text and an approximate sun motif, with that limitation disclosed.

## Single-view limits

Rear elevation and inner courtyard are inferred from visible repetition. Dense leaves, tiny pedestrian facial features and plaque logo are approximate. Trees partly obscure wing ends. No interior rooms, building-code dimensions or exact campus branding are claimed. Decorative tiny people are scenery, not a character-likeness task.

## Acceptance priorities

Preserve tower-to-wing height, symmetrical massing, hip roof slopes, central three-arch negative space, pale stone/red tile palette, garden/tree distribution, road and stepped plinth. Review each unlocked pass against its own goal and record shortcomings. Capture reference, front/right/rear/left and elevated views. Verify closed geometry, part coverage, rooted attachments, picking and explode; do not claim unavailable rear reference fidelity.
