﻿Array.prototype.__yy_owner=0;
var g_RUN=0x80000000;
var JSON_game=
{
	Extensions:[],ExtensionOptions:
	{
	}
	,Sounds:[],AudioGroups:[
	{
		name:"audiogroup_default",enabled:true,	}
	],Sprites:[],EmbeddedEntries:
	{
		"fallbacktexture":0	}
	,Backgrounds:[],Paths:[],Shaders:[
	{
		name:"__yy_sdf_shader",Vertex:"#define LOWPREC lowp\n#define	MATRIX_VIEW 					0\n#define	MATRIX_PROJECTION 				1\n#define	MATRIX_WORLD 					2\n#define	MATRIX_WORLD_VIEW 				3\n#define	MATRIX_WORLD_VIEW_PROJECTION 	4\n#define	MATRICES_MAX					5\n\nuniform mat4 gm_Matrices[MATRICES_MAX]; \n\nuniform bool gm_LightingEnabled;\nuniform bool gm_VS_FogEnabled;\nuniform float gm_FogStart;\nuniform float gm_RcpFogRange;\n\n#define MAX_VS_LIGHTS	8\n#define MIRROR_WIN32_LIGHTING_EQUATION\n\n\n//#define	MAX_VS_LIGHTS					8\nuniform vec4   gm_AmbientColour;							// rgb=colour, a=1\nuniform vec4   gm_Lights_Direction[MAX_VS_LIGHTS];		// normalised direction\nuniform vec4   gm_Lights_PosRange[MAX_VS_LIGHTS];			// X,Y,Z position,  W range\nuniform vec4   gm_Lights_Colour[MAX_VS_LIGHTS];			// rgb=colour, a=1\n\nfloat CalcFogFactor(vec4 pos)\n{\n	if (gm_VS_FogEnabled)\n	{\n		vec4 viewpos = gm_Matrices[MATRIX_WORLD_VIEW] * pos;\n		float fogfactor = ((viewpos.z - gm_FogStart) * gm_RcpFogRange);\n		return fogfactor;\n	}\n	else\n	{\n		return 0.0;\n	}\n}\n\nvec4 DoDirLight(vec3 ws_normal, vec4 dir, vec4 diffusecol)\n{\n	float dotresult = dot(ws_normal, dir.xyz);\n	dotresult = min(dotresult, dir.w);			// the w component is 1 if the directional light is active, or 0 if it isn't\n	dotresult = max(0.0, dotresult);\n\n	return dotresult * diffusecol;\n}\n\nvec4 DoPointLight(vec3 ws_pos, vec3 ws_normal, vec4 posrange, vec4 diffusecol)\n{\n	vec3 diffvec = ws_pos - posrange.xyz;\n	float veclen = length(diffvec);\n	diffvec /= veclen;	// normalise\n	float atten;\n	if (posrange.w == 0.0)		// the w component of posrange is 0 if the point light is disabled - if we don't catch it here we might end up generating INFs or NaNs\n	{\n		atten = 0.0;\n	}\n	else\n	{\n#ifdef MIRROR_WIN32_LIGHTING_EQUATION\n	// This is based on the Win32 D3D and OpenGL falloff model, where:\n	// Attenuation = 1.0f / (factor0 + (d * factor1) + (d*d * factor2))\n	// For some reason, factor0 is set to 0.0f while factor1 is set to 1.0f/lightrange (on both D3D and OpenGL)\n	// This'll result in no visible falloff as 1.0f / (d / lightrange) will always be larger than 1.0f (if the vertex is within range)\n	\n		atten = 1.0 / (veclen / posrange.w);\n		if (veclen > posrange.w)\n		{\n			atten = 0.0;\n		}	\n#else\n		atten = clamp( (1.0 - (veclen / posrange.w)), 0.0, 1.0);		// storing 1.0f/range instead would save a rcp\n#endif\n	}\n	float dotresult = dot(ws_normal, diffvec);\n	dotresult = max(0.0, dotresult);\n\n	return dotresult * atten * diffusecol;\n}\n\nvec4 DoLighting(vec4 vertexcolour, vec4 objectspacepos, vec3 objectspacenormal)\n{\n	if (gm_LightingEnabled)\n	{\n		// Normally we'd have the light positions\\directions back-transformed from world to object space\n		// But to keep things simple for the moment we'll just transform the normal to world space\n		vec4 objectspacenormal4 = vec4(objectspacenormal, 0.0);\n		vec3 ws_normal;\n		ws_normal = (gm_Matrices[MATRIX_WORLD] * objectspacenormal4).xyz;\n		ws_normal = normalize(ws_normal);\n\n		vec3 ws_pos;\n		ws_pos = (gm_Matrices[MATRIX_WORLD] * objectspacepos).xyz;\n\n		// Accumulate lighting from different light types\n		vec4 accumcol = vec4(0.0, 0.0, 0.0, 0.0);		\n		for(int i = 0; i < MAX_VS_LIGHTS; i++)\n		{\n			accumcol += DoDirLight(ws_normal, gm_Lights_Direction[i], gm_Lights_Colour[i]);\n		}\n\n		for(int i = 0; i < MAX_VS_LIGHTS; i++)\n		{\n			accumcol += DoPointLight(ws_pos, ws_normal, gm_Lights_PosRange[i], gm_Lights_Colour[i]);\n		}\n\n		accumcol *= vertexcolour;\n		accumcol += gm_AmbientColour;\n		accumcol = min(vec4(1.0, 1.0, 1.0, 1.0), accumcol);\n		accumcol.a = vertexcolour.a;\n		return accumcol;\n	}\n	else\n	{\n		return vertexcolour;\n	}\n}\n\n#define _YY_GLSLES_ 1\n//\n// SDF vertex shader\n//\nattribute vec3 in_Position;                  // (x,y,z)\n//attribute vec3 in_Normal;                  // (x,y,z)     unused in this shader.\nattribute vec4 in_Colour;                    // (r,g,b,a)\nattribute vec2 in_TextureCoord;              // (u,v)\n\nvarying vec2 v_vTexcoord;\nvarying vec4 v_vColour;\n\nvoid main()\n{\n    vec4 object_space_pos = vec4( in_Position.x, in_Position.y, in_Position.z, 1.0);\n    gl_Position = gm_Matrices[MATRIX_WORLD_VIEW_PROJECTION] * object_space_pos;\n    \n    v_vColour = in_Colour;\n    v_vTexcoord = in_TextureCoord;\n}\n",Fragment:"precision mediump float;\n#define LOWPREC lowp\n// Uniforms look like they're shared between vertex and fragment shaders in GLSL, so we have to be careful to avoid name clashes\n\nuniform sampler2D gm_BaseTexture;\n\nuniform bool gm_PS_FogEnabled;\nuniform vec4 gm_FogColour;\nuniform bool gm_AlphaTestEnabled;\nuniform float gm_AlphaRefValue;\n\nvoid DoAlphaTest(vec4 SrcColour)\n{\n	if (gm_AlphaTestEnabled)\n	{\n		if (SrcColour.a <= gm_AlphaRefValue)\n		{\n			discard;\n		}\n	}\n}\n\nvoid DoFog(inout vec4 SrcColour, float fogval)\n{\n	if (gm_PS_FogEnabled)\n	{\n		SrcColour = mix(SrcColour, gm_FogColour, clamp(fogval, 0.0, 1.0)); \n	}\n}\n\n#define _YY_GLSLES_ 1\n//\n// SDF fragment shader\n//\nvarying vec2 v_vTexcoord;\nvarying vec4 v_vColour;\n\nvoid main()\n{\n	vec4 texcol = texture2D( gm_BaseTexture, v_vTexcoord );\n	\n	float spread = fwidth(texcol.a);	\n	spread = max(spread * 0.75, 0.001);	\n	texcol.a = smoothstep(0.5 - spread, 0.5 + spread, texcol.a);			\n	\n	vec4 combinedcol = v_vColour * texcol;\n	DoAlphaTest(combinedcol);	\n			\n    gl_FragColor = combinedcol;\n}\n",Attributes:["in_Position","in_Colour","in_TextureCoord"]	}
	,
	{
		name:"__yy_sdf_effect_shader",Vertex:"#define LOWPREC lowp\n#define	MATRIX_VIEW 					0\n#define	MATRIX_PROJECTION 				1\n#define	MATRIX_WORLD 					2\n#define	MATRIX_WORLD_VIEW 				3\n#define	MATRIX_WORLD_VIEW_PROJECTION 	4\n#define	MATRICES_MAX					5\n\nuniform mat4 gm_Matrices[MATRICES_MAX]; \n\nuniform bool gm_LightingEnabled;\nuniform bool gm_VS_FogEnabled;\nuniform float gm_FogStart;\nuniform float gm_RcpFogRange;\n\n#define MAX_VS_LIGHTS	8\n#define MIRROR_WIN32_LIGHTING_EQUATION\n\n\n//#define	MAX_VS_LIGHTS					8\nuniform vec4   gm_AmbientColour;							// rgb=colour, a=1\nuniform vec4   gm_Lights_Direction[MAX_VS_LIGHTS];		// normalised direction\nuniform vec4   gm_Lights_PosRange[MAX_VS_LIGHTS];			// X,Y,Z position,  W range\nuniform vec4   gm_Lights_Colour[MAX_VS_LIGHTS];			// rgb=colour, a=1\n\nfloat CalcFogFactor(vec4 pos)\n{\n	if (gm_VS_FogEnabled)\n	{\n		vec4 viewpos = gm_Matrices[MATRIX_WORLD_VIEW] * pos;\n		float fogfactor = ((viewpos.z - gm_FogStart) * gm_RcpFogRange);\n		return fogfactor;\n	}\n	else\n	{\n		return 0.0;\n	}\n}\n\nvec4 DoDirLight(vec3 ws_normal, vec4 dir, vec4 diffusecol)\n{\n	float dotresult = dot(ws_normal, dir.xyz);\n	dotresult = min(dotresult, dir.w);			// the w component is 1 if the directional light is active, or 0 if it isn't\n	dotresult = max(0.0, dotresult);\n\n	return dotresult * diffusecol;\n}\n\nvec4 DoPointLight(vec3 ws_pos, vec3 ws_normal, vec4 posrange, vec4 diffusecol)\n{\n	vec3 diffvec = ws_pos - posrange.xyz;\n	float veclen = length(diffvec);\n	diffvec /= veclen;	// normalise\n	float atten;\n	if (posrange.w == 0.0)		// the w component of posrange is 0 if the point light is disabled - if we don't catch it here we might end up generating INFs or NaNs\n	{\n		atten = 0.0;\n	}\n	else\n	{\n#ifdef MIRROR_WIN32_LIGHTING_EQUATION\n	// This is based on the Win32 D3D and OpenGL falloff model, where:\n	// Attenuation = 1.0f / (factor0 + (d * factor1) + (d*d * factor2))\n	// For some reason, factor0 is set to 0.0f while factor1 is set to 1.0f/lightrange (on both D3D and OpenGL)\n	// This'll result in no visible falloff as 1.0f / (d / lightrange) will always be larger than 1.0f (if the vertex is within range)\n	\n		atten = 1.0 / (veclen / posrange.w);\n		if (veclen > posrange.w)\n		{\n			atten = 0.0;\n		}	\n#else\n		atten = clamp( (1.0 - (veclen / posrange.w)), 0.0, 1.0);		// storing 1.0f/range instead would save a rcp\n#endif\n	}\n	float dotresult = dot(ws_normal, diffvec);\n	dotresult = max(0.0, dotresult);\n\n	return dotresult * atten * diffusecol;\n}\n\nvec4 DoLighting(vec4 vertexcolour, vec4 objectspacepos, vec3 objectspacenormal)\n{\n	if (gm_LightingEnabled)\n	{\n		// Normally we'd have the light positions\\directions back-transformed from world to object space\n		// But to keep things simple for the moment we'll just transform the normal to world space\n		vec4 objectspacenormal4 = vec4(objectspacenormal, 0.0);\n		vec3 ws_normal;\n		ws_normal = (gm_Matrices[MATRIX_WORLD] * objectspacenormal4).xyz;\n		ws_normal = normalize(ws_normal);\n\n		vec3 ws_pos;\n		ws_pos = (gm_Matrices[MATRIX_WORLD] * objectspacepos).xyz;\n\n		// Accumulate lighting from different light types\n		vec4 accumcol = vec4(0.0, 0.0, 0.0, 0.0);		\n		for(int i = 0; i < MAX_VS_LIGHTS; i++)\n		{\n			accumcol += DoDirLight(ws_normal, gm_Lights_Direction[i], gm_Lights_Colour[i]);\n		}\n\n		for(int i = 0; i < MAX_VS_LIGHTS; i++)\n		{\n			accumcol += DoPointLight(ws_pos, ws_normal, gm_Lights_PosRange[i], gm_Lights_Colour[i]);\n		}\n\n		accumcol *= vertexcolour;\n		accumcol += gm_AmbientColour;\n		accumcol = min(vec4(1.0, 1.0, 1.0, 1.0), accumcol);\n		accumcol.a = vertexcolour.a;\n		return accumcol;\n	}\n	else\n	{\n		return vertexcolour;\n	}\n}\n\n#define _YY_GLSLES_ 1\n//\n// Simple passthrough vertex shader\n//\nattribute vec3 in_Position;                  // (x,y,z)\n//attribute vec3 in_Normal;                  // (x,y,z)     unused in this shader.\nattribute vec4 in_Colour;                    // (r,g,b,a)\nattribute vec2 in_TextureCoord;              // (u,v)\n\nvarying vec2 v_vTexcoord;\nvarying vec4 v_vColour;\n\nvoid main()\n{\n    vec4 object_space_pos = vec4( in_Position.x, in_Position.y, in_Position.z, 1.0);\n    gl_Position = gm_Matrices[MATRIX_WORLD_VIEW_PROJECTION] * object_space_pos;\n    \n    v_vColour = in_Colour;\n    v_vTexcoord = in_TextureCoord;\n}\n",Fragment:"precision mediump float;\n#define LOWPREC lowp\n// Uniforms look like they're shared between vertex and fragment shaders in GLSL, so we have to be careful to avoid name clashes\n\nuniform sampler2D gm_BaseTexture;\n\nuniform bool gm_PS_FogEnabled;\nuniform vec4 gm_FogColour;\nuniform bool gm_AlphaTestEnabled;\nuniform float gm_AlphaRefValue;\n\nvoid DoAlphaTest(vec4 SrcColour)\n{\n	if (gm_AlphaTestEnabled)\n	{\n		if (SrcColour.a <= gm_AlphaRefValue)\n		{\n			discard;\n		}\n	}\n}\n\nvoid DoFog(inout vec4 SrcColour, float fogval)\n{\n	if (gm_PS_FogEnabled)\n	{\n		SrcColour = mix(SrcColour, gm_FogColour, clamp(fogval, 0.0, 1.0)); \n	}\n}\n\n#define _YY_GLSLES_ 1\n//\n// SDF (with effects) fragment shader\n//\nvarying vec2 v_vTexcoord;\nvarying vec4 v_vColour;\n\n// SDF values are measured from 0 (at the outer edge) to 1 which is the innermost point that can be represented\nuniform bool gm_SDF_DrawGlow;				// whether the glow effect is enabled\nuniform vec2 gm_SDF_Glow_MinMax;			// the SDF range across which the glow fades\nuniform vec4 gm_SDF_Glow_Col;				// the colour of the glow\n\nuniform bool gm_SDF_DrawOutline;			// whether the outline effect is enabled\nuniform float gm_SDF_Outline_Thresh;		// the SDF distance which represents the outer edge of the outline\nuniform vec4 gm_SDF_Outline_Col;			// the colour of the outline\n\nuniform float gm_SDF_Core_Thresh;			// the SDF distance which represents the outer edge the shape\nuniform vec4 gm_SDF_Core_Col;				// the colour of the core part of the shape\n\nvoid main()\n{\n	vec4 texcol = texture2D( gm_BaseTexture, v_vTexcoord );\n		\n	float pixelspread = fwidth(texcol.a);	\n	pixelspread = max(pixelspread * 0.75, 0.001);	\n	\n	float blendfactor;\n	vec4 currcol = vec4(0.0, 0.0, 0.0, -1.0);\n	\n	// Handle glow effect\n	if (gm_SDF_DrawGlow)\n	{		\n		if (texcol.a > gm_SDF_Glow_MinMax.x)\n		{\n			currcol = gm_SDF_Glow_Col;\n			currcol.a *= smoothstep(gm_SDF_Glow_MinMax.x, gm_SDF_Glow_MinMax.y, texcol.a);\n		}\n	}	\n	\n	// Handle outline effect\n	if (gm_SDF_DrawOutline)\n	{\n		if (texcol.a > (gm_SDF_Outline_Thresh - pixelspread))\n		{			\n			blendfactor = smoothstep(gm_SDF_Outline_Thresh - pixelspread, gm_SDF_Outline_Thresh + pixelspread, texcol.a);\n			if (currcol.a < 0.0)\n			{\n				currcol = vec4(gm_SDF_Outline_Col.r,gm_SDF_Outline_Col.g,gm_SDF_Outline_Col.b, 0.0);\n			}\n			currcol = mix(currcol, gm_SDF_Outline_Col, blendfactor);\n		}\n	}\n	\n	// Handle inner core\n	blendfactor = smoothstep(gm_SDF_Core_Thresh - pixelspread, gm_SDF_Core_Thresh + pixelspread, texcol.a);\n	\n	if (currcol.a < 0.0)\n	{\n		currcol = vec4(gm_SDF_Core_Col.r,gm_SDF_Core_Col.g,gm_SDF_Core_Col.b, 0.0);\n	}\n	texcol = mix(currcol, gm_SDF_Core_Col, blendfactor);	\n	\n	vec4 combinedcol = v_vColour * texcol;\n	DoAlphaTest(combinedcol);	\n			\n    gl_FragColor = combinedcol;\n}\n",Attributes:["in_Position","in_Colour","in_TextureCoord"]	}
	,
	{
		name:"__yy_sdf_blur_shader",Vertex:"#define LOWPREC lowp\n#define	MATRIX_VIEW 					0\n#define	MATRIX_PROJECTION 				1\n#define	MATRIX_WORLD 					2\n#define	MATRIX_WORLD_VIEW 				3\n#define	MATRIX_WORLD_VIEW_PROJECTION 	4\n#define	MATRICES_MAX					5\n\nuniform mat4 gm_Matrices[MATRICES_MAX]; \n\nuniform bool gm_LightingEnabled;\nuniform bool gm_VS_FogEnabled;\nuniform float gm_FogStart;\nuniform float gm_RcpFogRange;\n\n#define MAX_VS_LIGHTS	8\n#define MIRROR_WIN32_LIGHTING_EQUATION\n\n\n//#define	MAX_VS_LIGHTS					8\nuniform vec4   gm_AmbientColour;							// rgb=colour, a=1\nuniform vec4   gm_Lights_Direction[MAX_VS_LIGHTS];		// normalised direction\nuniform vec4   gm_Lights_PosRange[MAX_VS_LIGHTS];			// X,Y,Z position,  W range\nuniform vec4   gm_Lights_Colour[MAX_VS_LIGHTS];			// rgb=colour, a=1\n\nfloat CalcFogFactor(vec4 pos)\n{\n	if (gm_VS_FogEnabled)\n	{\n		vec4 viewpos = gm_Matrices[MATRIX_WORLD_VIEW] * pos;\n		float fogfactor = ((viewpos.z - gm_FogStart) * gm_RcpFogRange);\n		return fogfactor;\n	}\n	else\n	{\n		return 0.0;\n	}\n}\n\nvec4 DoDirLight(vec3 ws_normal, vec4 dir, vec4 diffusecol)\n{\n	float dotresult = dot(ws_normal, dir.xyz);\n	dotresult = min(dotresult, dir.w);			// the w component is 1 if the directional light is active, or 0 if it isn't\n	dotresult = max(0.0, dotresult);\n\n	return dotresult * diffusecol;\n}\n\nvec4 DoPointLight(vec3 ws_pos, vec3 ws_normal, vec4 posrange, vec4 diffusecol)\n{\n	vec3 diffvec = ws_pos - posrange.xyz;\n	float veclen = length(diffvec);\n	diffvec /= veclen;	// normalise\n	float atten;\n	if (posrange.w == 0.0)		// the w component of posrange is 0 if the point light is disabled - if we don't catch it here we might end up generating INFs or NaNs\n	{\n		atten = 0.0;\n	}\n	else\n	{\n#ifdef MIRROR_WIN32_LIGHTING_EQUATION\n	// This is based on the Win32 D3D and OpenGL falloff model, where:\n	// Attenuation = 1.0f / (factor0 + (d * factor1) + (d*d * factor2))\n	// For some reason, factor0 is set to 0.0f while factor1 is set to 1.0f/lightrange (on both D3D and OpenGL)\n	// This'll result in no visible falloff as 1.0f / (d / lightrange) will always be larger than 1.0f (if the vertex is within range)\n	\n		atten = 1.0 / (veclen / posrange.w);\n		if (veclen > posrange.w)\n		{\n			atten = 0.0;\n		}	\n#else\n		atten = clamp( (1.0 - (veclen / posrange.w)), 0.0, 1.0);		// storing 1.0f/range instead would save a rcp\n#endif\n	}\n	float dotresult = dot(ws_normal, diffvec);\n	dotresult = max(0.0, dotresult);\n\n	return dotresult * atten * diffusecol;\n}\n\nvec4 DoLighting(vec4 vertexcolour, vec4 objectspacepos, vec3 objectspacenormal)\n{\n	if (gm_LightingEnabled)\n	{\n		// Normally we'd have the light positions\\directions back-transformed from world to object space\n		// But to keep things simple for the moment we'll just transform the normal to world space\n		vec4 objectspacenormal4 = vec4(objectspacenormal, 0.0);\n		vec3 ws_normal;\n		ws_normal = (gm_Matrices[MATRIX_WORLD] * objectspacenormal4).xyz;\n		ws_normal = normalize(ws_normal);\n\n		vec3 ws_pos;\n		ws_pos = (gm_Matrices[MATRIX_WORLD] * objectspacepos).xyz;\n\n		// Accumulate lighting from different light types\n		vec4 accumcol = vec4(0.0, 0.0, 0.0, 0.0);		\n		for(int i = 0; i < MAX_VS_LIGHTS; i++)\n		{\n			accumcol += DoDirLight(ws_normal, gm_Lights_Direction[i], gm_Lights_Colour[i]);\n		}\n\n		for(int i = 0; i < MAX_VS_LIGHTS; i++)\n		{\n			accumcol += DoPointLight(ws_pos, ws_normal, gm_Lights_PosRange[i], gm_Lights_Colour[i]);\n		}\n\n		accumcol *= vertexcolour;\n		accumcol += gm_AmbientColour;\n		accumcol = min(vec4(1.0, 1.0, 1.0, 1.0), accumcol);\n		accumcol.a = vertexcolour.a;\n		return accumcol;\n	}\n	else\n	{\n		return vertexcolour;\n	}\n}\n\n#define _YY_GLSLES_ 1\n//\n// Simple passthrough vertex shader\n//\nattribute vec3 in_Position;                  // (x,y,z)\n//attribute vec3 in_Normal;                  // (x,y,z)     unused in this shader.\nattribute vec4 in_Colour;                    // (r,g,b,a)\nattribute vec2 in_TextureCoord;              // (u,v)\n\nvarying vec2 v_vTexcoord;\nvarying vec4 v_vColour;\n\nvoid main()\n{\n    vec4 object_space_pos = vec4( in_Position.x, in_Position.y, in_Position.z, 1.0);\n    gl_Position = gm_Matrices[MATRIX_WORLD_VIEW_PROJECTION] * object_space_pos;\n    \n    v_vColour = in_Colour;\n    v_vTexcoord = in_TextureCoord;\n}\n",Fragment:"precision mediump float;\n#define LOWPREC lowp\n// Uniforms look like they're shared between vertex and fragment shaders in GLSL, so we have to be careful to avoid name clashes\n\nuniform sampler2D gm_BaseTexture;\n\nuniform bool gm_PS_FogEnabled;\nuniform vec4 gm_FogColour;\nuniform bool gm_AlphaTestEnabled;\nuniform float gm_AlphaRefValue;\n\nvoid DoAlphaTest(vec4 SrcColour)\n{\n	if (gm_AlphaTestEnabled)\n	{\n		if (SrcColour.a <= gm_AlphaRefValue)\n		{\n			discard;\n		}\n	}\n}\n\nvoid DoFog(inout vec4 SrcColour, float fogval)\n{\n	if (gm_PS_FogEnabled)\n	{\n		SrcColour = mix(SrcColour, gm_FogColour, clamp(fogval, 0.0, 1.0)); \n	}\n}\n\n#define _YY_GLSLES_ 1\n//\n// SDF (with blur) fragment shader\n//\nvarying vec2 v_vTexcoord;\nvarying vec4 v_vColour;\n\n// SDF values are measured from 0 (at the outer edge) to 1 which is the innermost point that can be represented\nuniform vec2 gm_SDF_Blur_MinMax;			// the range across which to filter the SDF\nuniform vec4 gm_SDF_Blur_Col;				// the colour tint of the blurred text\n\nvoid main()\n{\n	vec4 texcol = texture2D( gm_BaseTexture, v_vTexcoord );	\n	vec4 currcol = gm_SDF_Blur_Col;\n		\n	currcol.a *= smoothstep(gm_SDF_Blur_MinMax.x, gm_SDF_Blur_MinMax.y, texcol.a);		\n	\n	vec4 combinedcol = v_vColour * currcol;\n	DoAlphaTest(combinedcol);	\n\n    gl_FragColor = combinedcol;\n}\n",Attributes:["in_Position","in_Colour","in_TextureCoord"]	}
	],Fonts:[
	{
		pName:"fntA2ROM",size:6,bold:false,italic:false,first:32,last:9647,charset:0,antialias:1,fontname:"A2ROM",ascenderOffset:0,ascender:0,sdfSpread:0,lineHeight:0,TPageEntry:1,scaleX:1,scaleY:1,glyphs:[
		{
			i:32,c:" ",x:2,y:2,w:7,h:8,shift:7,offset:0		}
		,
		{
			i:33,c:"!",x:95,y:32,w:1,h:8,shift:7,offset:3		}
		,
		{
			i:34,c:"\"",x:90,y:32,w:3,h:8,shift:7,offset:2		}
		,
		{
			i:35,c:"#",x:83,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:36,c:"$",x:76,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:37,c:"%",x:69,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:38,c:"&",x:62,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:39,c:"'",x:59,y:32,w:1,h:8,shift:7,offset:3		}
		,
		{
			i:40,c:"(",x:54,y:32,w:3,h:8,shift:7,offset:1		}
		,
		{
			i:41,c:")",x:49,y:32,w:3,h:8,shift:7,offset:3		}
		,
		{
			i:42,c:"*",x:98,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:43,c:"+",x:42,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:44,c:",",x:31,y:32,w:2,h:8,shift:7,offset:2		}
		,
		{
			i:45,c:"-",x:24,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:46,c:".",x:21,y:32,w:1,h:8,shift:7,offset:3		}
		,
		{
			i:47,c:"/",x:14,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:48,c:"0",x:7,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:49,c:"1",x:2,y:32,w:3,h:8,shift:7,offset:2		}
		,
		{
			i:50,c:"2",x:118,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:51,c:"3",x:111,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:52,c:"4",x:104,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:53,c:"5",x:35,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:54,c:"6",x:105,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:55,c:"7",x:112,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:56,c:"8",x:119,y:32,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:57,c:"9",x:9,y:52,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:58,c:":",x:6,y:52,w:1,h:8,shift:7,offset:3		}
		,
		{
			i:59,c:";",x:2,y:52,w:2,h:8,shift:7,offset:2		}
		,
		{
			i:60,c:"<",x:118,y:42,w:4,h:8,shift:7,offset:1		}
		,
		{
			i:61,c:"=",x:111,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:62,c:">",x:105,y:42,w:4,h:8,shift:7,offset:2		}
		,
		{
			i:63,c:"?",x:98,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:64,c:"@",x:91,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:65,c:"A",x:84,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:66,c:"B",x:77,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:67,c:"C",x:70,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:68,c:"D",x:63,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:69,c:"E",x:56,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:70,c:"F",x:49,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:71,c:"G",x:42,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:72,c:"H",x:35,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:73,c:"I",x:30,y:42,w:3,h:8,shift:7,offset:2		}
		,
		{
			i:74,c:"J",x:23,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:75,c:"K",x:16,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:76,c:"L",x:9,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:77,c:"M",x:2,y:42,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:78,c:"N",x:97,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:79,c:"O",x:16,y:52,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:80,c:"P",x:90,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:81,c:"Q",x:76,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:82,c:"R",x:23,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:83,c:"S",x:16,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:84,c:"T",x:9,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:85,c:"U",x:2,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:86,c:"V",x:116,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:87,c:"W",x:109,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:88,c:"X",x:102,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:89,c:"Y",x:95,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:90,c:"Z",x:88,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:91,c:"[",x:30,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:92,c:"\\",x:81,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:93,c:"]",x:67,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:94,c:"^",x:60,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:95,c:"_",x:51,y:2,w:7,h:8,shift:7,offset:0		}
		,
		{
			i:96,c:"`",x:46,y:2,w:3,h:8,shift:7,offset:2		}
		,
		{
			i:97,c:"a",x:39,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:98,c:"b",x:32,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:99,c:"c",x:25,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:100,c:"d",x:18,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:101,c:"e",x:11,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:102,c:"f",x:74,y:2,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:103,c:"g",x:37,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:104,c:"h",x:44,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:105,c:"i",x:51,y:12,w:3,h:8,shift:7,offset:2		}
		,
		{
			i:106,c:"j",x:70,y:22,w:4,h:8,shift:7,offset:1		}
		,
		{
			i:107,c:"k",x:63,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:108,c:"l",x:58,y:22,w:3,h:8,shift:7,offset:2		}
		,
		{
			i:109,c:"m",x:51,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:110,c:"n",x:44,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:111,c:"o",x:37,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:112,c:"p",x:30,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:113,c:"q",x:23,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:114,c:"r",x:16,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:115,c:"s",x:9,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:116,c:"t",x:2,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:117,c:"u",x:115,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:118,c:"v",x:108,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:119,c:"w",x:101,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:120,c:"x",x:94,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:121,c:"y",x:87,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:122,c:"z",x:80,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:123,c:"{",x:73,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:124,c:"|",x:70,y:12,w:1,h:8,shift:7,offset:3		}
		,
		{
			i:125,c:"}",x:63,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:126,c:"~",x:56,y:12,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:127,x:83,y:22,w:5,h:8,shift:7,offset:1		}
		,
		{
			i:9647,c:"▯",x:23,y:52,w:6,h:8,shift:8,offset:1		}
		,],	}
	],Timelines:[],Triggers:[
	{
	}
	],GMObjects:[
	{
		pName:"object0",spriteIndex:-1,visible:true,parent:-100,CreateEvent:gml_Object_object0_Create_0,GlobalLeftButtonPressed:gml_Object_object0_Mouse_53,DrawEvent:gml_Object_object0_Draw_0,TriggerEvents:[],CollisionEvents:[]	}
	],AnimCurves:[],Sequences:[],FiltersAndEffectDefs:[],PSEmitters:[],ParticleSystems:[],GMRooms:[
	{
		pName:"room0",width:280,height:192,speed:0,colour:0,LayerCount:1,showColour:false,enableViews:true,clearDisplayBuffer:false,backgrounds:[],views:[
		{
			visible:true,wview:280,hview:192,wport:1120,hport:768		}
		,
		{
			wview:1024,hview:768,wport:1024,hport:768		}
		,
		{
			wview:1024,hview:768,wport:1024,hport:768		}
		,
		{
			wview:1024,hview:768,wport:1024,hport:768		}
		,
		{
			wview:1024,hview:768,wport:1024,hport:768		}
		,
		{
			wview:1024,hview:768,wport:1024,hport:768		}
		,
		{
			wview:1024,hview:768,wport:1024,hport:768		}
		,
		{
			wview:1024,hview:768,wport:1024,hport:768		}
		],pInstances:[
		{
			x:32,y:32,index:0,id:100000,rotation:0,scaleX:1,scaleY:1,imageSpeed:1,imageIndex:0,colour:4294967295		}
		],tiles:[],layers:[
		{
			pName:"Instances",id:0,type:2,depth:0,x:0,y:0,hspeed:0,vspeed:0,visible:1,effectEnabled:1,effectType:"",effectProperties:[],icount:1,iinstIDs:[100000]		}
		]	}
	],RoomOrder:[0],TPageEntries:[
	{
		x:0,y:0,w:64,h:64,XOffset:0,YOffset:0,CropWidth:64,CropHeight:64,ow:64,oh:64,tp:0	}
	,
	{
		x:0,y:0,w:128,h:64,XOffset:0,YOffset:0,CropWidth:128,CropHeight:64,ow:128,oh:64,tp:1	}
	],Textures:["apple-iie-hal-pal_texture_0.png","apple-iie-hal-pal_texture_1.png"],TexturesBlocks:[
	{
		MipsToGenerate:0	}
	,
	{
		MipsToGenerate:0	}
	],TextureGroupInfo:[
	{
		pName:"__YY__0fallbacktexture.png_YYG_AUTO_GEN_TEX_GROUP_NAME_",TextureIDs:[0],SpriteIDs:[],SpineSpriteIDs:[],FontIDs:[],TilesetIDs:[]	}
	,
	{
		pName:"Default",TextureIDs:[1],SpriteIDs:[],SpineSpriteIDs:[],FontIDs:[0],TilesetIDs:[]	}
	],FeatureFlags:
	{
		"filt+fx":"filt+fx","gx_mod_wallpaper":"gx_mod_wallpaper","nullish":"nullish","login_sso":"login_sso","operagx-yyc":"operagx-yyc","mqtt":"mqtt","audio-fx":"audio-fx","intellisense":"intellisense","test":"test","custom_env":"custom_env","filt+fx":"filt+fx","gx_mod_wallpaper":"gx_mod_wallpaper","gx_mod_gamestrip":"gx_mod_gamestrip","live_wallpaper_subscription":"live_wallpaper_subscription","rollback":"rollback","code-editor":"code-editor"	}
	,Options:
	{
		debugMode:false,AssetCompilerMajorVersion:2,AssetCompilerMinorVersion:0,AssetCompilerBuildVersion:0,GameSpeed:60,DrawColour:4294967295,xscreensize:1120,yscreensize:768,gameId:0,gameGuid:"612ae9b4-959f-4028-92a1-06c271c642ca",fullScreen:false,interpolatePixels:false,showCursor:true,scale:1,allowFullScreenKey:true,freezeOnLostFocus:false,showLoadingBar:false,displayErrors:false,writeErrors:false,abortErrors:false,variableErrors:true,outputDebugToConsole:true,WebGL:1,WebGLPreserveDrawingBuffer:0,CollisionCompatibility:false,UseNewAudio:true,GameDir:"html5game",Config:"Default",ViewColour:0,CreateEventOrder:false,UseParticles:false,UseBuiltinFont:false,LocalRunAlert:true,crc:0,ProjectName:"apple-iie-hal-pal",md5:[131,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],MajorVersion:1,MinorVersion:0,BuildVersion:0,RevisionVersion:0,DisplayName:" Apple IIe HAL/PAL emulator",UseFBExtension:false,tm:1719715599,AllowStatistics:"True"	}
}
;

function gml_Object_object0_Create_0(_inst,_other)
{
	_inst.gmlSEGB=0;
	_inst.gmlGX_=0;
	_inst.gmlCSEN_=0;
	_inst.gmlCOL80_=0;
	_inst.gmlV=__yy_gml_array_create([0,0,0,0,0,0,0,0,0]);
	_inst.gmlsurf=(-1);
	_inst.gmlw=280;
	_inst.gmlh=192;
}

function gml_Object_object0_Mouse_53(_inst,_other)
{
	var gmlmx=g_pBuiltIn.get_mouse_x();
	var gmlmy=g_pBuiltIn.get_mouse_y();
	if((yyGetBool(yyfgreaterequal(gmlmy,160)))&&(yyGetBool(yyfless(gmlmy,168))))
	{

				{
			if(yyfless(gmlmx,56))
			{

								{
					_inst.gmlSEGB=!yyGetBool(_inst.gmlSEGB);
				}
				;
			}
			else 
			{
				if(yyfless(gmlmx,112))
				{

										{
						_inst.gmlGX_=!yyGetBool(_inst.gmlGX_);
					}
					;
				}
				else 
				{
					if(yyfless(gmlmx,189))
					{

												{
							_inst.gmlCSEN_=!yyGetBool(_inst.gmlCSEN_);
						}
						;
					}
					else 
					{

												{
							_inst.gmlCOL80_=!yyGetBool(_inst.gmlCOL80_);
						}
						;
					}
					;
				}
				;
			}
			;
		}
		;
	}
	;
	if(yyfgreater(gmlmy,176))
	{

				{
			var gmlb=yyfminus(__yy_gml_errCheck(yyfdiv(__yy_gml_errCheck(gmlmx),7)),4);
			if((yyGetBool(yyfgreaterequal(gmlb,1)))&&(yyGetBool(yyflessequal(gmlb,8))))
			{

								{
					_inst.gmlV=__yy_gml_array_check(_inst.gmlV,1275309256);
					_inst.gmlV[__yy_gml_array_check_index_set(gmlb)]=!yyGetBool(_inst.gmlV[__yy_gml_array_check_index(gmlb,_inst.gmlV)]);
				}
				;
			}
			;
		}
		;
	}
	;
	if(yyGetBool(surface_exists(_inst.gmlsurf)))
	{

				{
			surface_free(_inst.gmlsurf);
		}
		;
	}
	;
}

function gml_Object_object0_Draw_0(_inst,_other)
{
	if(!yyGetBool(surface_exists(_inst.gmlsurf)))
	{

				{
			_inst.gmlsurf=surface_create(_inst.gmlw,_inst.gmlh);
			surface_set_target(_inst.gmlsurf);
			draw_clear_alpha(0,1);
			var gmldata=__yy_gml_array_create([0,0,0,1,0,1,0,0,0,0,1,0]);
			var gmlW,gmlI;
			var gmli=0;
			for(;yyflessequal(gmli,11);gmli=yyfplus(gmli,1))
			{

								{
					gmlW=__yy_gml_array_check(gmlW,-32);
					gmlW[__yy_gml_array_check_index_chain(gmli,gmlW)][__yy_gml_array_check_index_set(0)]=gmldata[__yy_gml_array_check_index(gmli,gmldata)];
					gmlI=__yy_gml_array_check(gmlI,-33);
					gmlI[__yy_gml_array_check_index_set(gmli)]=gmldata[__yy_gml_array_check_index(gmli,gmldata)];
				}
			}
			;
			var gmlTITLES=__yy_gml_array_create(["14M  ","RAS' ","AX   ","CAS' ","Q3   ","PHS0 ","PHS1 ","H0   ","CREF ","7M    ","VID7M","LDPS'","VID7 "]);
			var gmlSCAN=0;
			var gmlHCNT=0;
			var gmlVCNT=0;
			draw_set_font(YYASSET_REF(0x06000000));
			draw_set_color(16777215);
			var gmltext="";
			gmltext=yyfplus(gmltext,yyfplus("SEGB=",__yy_gml_errCheck(string(_inst.gmlSEGB))));
			gmltext=yyfplus(gmltext,yyfplus("   GR'=",__yy_gml_errCheck(string(_inst.gmlGX_))));
			gmltext=yyfplus(gmltext,yyfplus("   CASEN'=",__yy_gml_errCheck(string(_inst.gmlCSEN_))));
			gmltext=yyfplus(gmltext,yyfplus("   80COL'=",__yy_gml_errCheck(string(_inst.gmlCOL80_))));
			gmltext=yyfplus(gmltext,"\n\n");
			gmltext=yyfplus(gmltext,"VID7=");
			var gmli=1;
			for(;yyflessequal(gmli,8);gmli=yyfplus(gmli,1))
			{

								{
					gmltext=yyfplus(gmltext,string(_inst.gmlV[__yy_gml_array_check_index(gmli,_inst.gmlV)]));
				}
			}
			;
			draw_text(0,160,gmltext);
			gmltext="";
			var gmli=0;
			for(;yyflessequal(gmli,12);gmli=yyfplus(gmli,1))
			{

								{
					gmltext=yyfplus(gmltext,yyfplus(__yy_gml_errCheck(gmlTITLES[__yy_gml_array_check_index(gmli,gmlTITLES)]),"\n"));
				}
			}
			;
			draw_text(0,0,gmltext);
			matrix_stack_push(matrix_build(0.5,0.5,0,0,0,0,1,1,1));
			matrix_set(2,matrix_stack_top());
			var gmlX=36;
			for(;yyflessequal(gmlX,276);gmlX=yyfplus(gmlX,4))
			{

								{
					draw_primitive_begin(3);
					draw_vertex(gmlX,5);
					draw_vertex(gmlX,1);
					draw_vertex(yyfplus(__yy_gml_errCheck(gmlX),2),1);
					draw_vertex(yyfplus(__yy_gml_errCheck(gmlX),2),5);
					draw_vertex(yyfplus(__yy_gml_errCheck(gmlX),4),5);
					draw_primitive_end();
					draw_primitive_begin(1);
					draw_vertex(gmlX,1);
					draw_primitive_end();
					var gmlSIGNAL=0;
					for(;yyflessequal(gmlSIGNAL,11);gmlSIGNAL=yyfplus(gmlSIGNAL,1))
					{

												{
							var gmlTERM=1;
							for(;yyflessequal(gmlTERM,8);gmlTERM=yyfplus(gmlTERM,1))
							{

																{
									gmlW=__yy_gml_array_check(gmlW,-32);
									gmlW[__yy_gml_array_check_index_chain(gmlSIGNAL,gmlW)][__yy_gml_array_check_index_set(gmlTERM)]=0;
								}
							}
							;
						}
					}
					;
					var gmlRAS_=gmlW[__yy_gml_array_check_index(0,gmlW)][__yy_gml_array_check_index(0,gmlW[~~0])];
					var gmlAX=gmlW[__yy_gml_array_check_index(1,gmlW)][__yy_gml_array_check_index(0,gmlW[~~1])];
					var gmlCAS_=gmlW[__yy_gml_array_check_index(2,gmlW)][__yy_gml_array_check_index(0,gmlW[~~2])];
					var gmlQ3=gmlW[__yy_gml_array_check_index(3,gmlW)][__yy_gml_array_check_index(0,gmlW[~~3])];
					var gmlP0=gmlW[__yy_gml_array_check_index(4,gmlW)][__yy_gml_array_check_index(0,gmlW[~~4])];
					var gmlP1=gmlW[__yy_gml_array_check_index(5,gmlW)][__yy_gml_array_check_index(0,gmlW[~~5])];
					var gmlH0=gmlW[__yy_gml_array_check_index(6,gmlW)][__yy_gml_array_check_index(0,gmlW[~~6])];
					var gmlCREF=gmlW[__yy_gml_array_check_index(7,gmlW)][__yy_gml_array_check_index(0,gmlW[~~7])];
					var gmlS7M=gmlW[__yy_gml_array_check_index(8,gmlW)][__yy_gml_array_check_index(0,gmlW[~~8])];
					var gmlV7M=gmlW[__yy_gml_array_check_index(9,gmlW)][__yy_gml_array_check_index(0,gmlW[~~9])];
					var gmlLDPS_=gmlW[__yy_gml_array_check_index(10,gmlW)][__yy_gml_array_check_index(0,gmlW[~~10])];
					var gmlVID7=gmlW[__yy_gml_array_check_index(11,gmlW)][__yy_gml_array_check_index(0,gmlW[~~11])];
					gmlW=__yy_gml_array_check(gmlW,-32);
					gmlW[__yy_gml_array_check_index_chain(0,gmlW)][__yy_gml_array_check_index_set(1)]=gmlQ3;
					gmlW[__yy_gml_array_check_index_chain(0,gmlW)][__yy_gml_array_check_index_set(2)]=(yyGetBool(!yyGetBool(gmlRAS_)))&&(yyGetBool(!yyGetBool(gmlAX)));
					gmlW[__yy_gml_array_check_index_chain(0,gmlW)][__yy_gml_array_check_index_set(3)]=(yyGetBool(!yyGetBool(gmlRAS_)))&&(yyGetBool(gmlCREF))&&(yyGetBool(gmlH0))&&(yyGetBool(gmlP0));
					gmlW[__yy_gml_array_check_index_chain(0,gmlW)][__yy_gml_array_check_index_set(4)]=(yyGetBool(!yyGetBool(gmlRAS_)))&&(yyGetBool(!yyGetBool(gmlS7M)))&&(yyGetBool(gmlH0))&&(yyGetBool(gmlP0));
					gmlW[__yy_gml_array_check_index_chain(1,gmlW)][__yy_gml_array_check_index_set(1)]=(yyGetBool(!yyGetBool(gmlRAS_)))&&(yyGetBool(gmlQ3));
					gmlW[__yy_gml_array_check_index_chain(1,gmlW)][__yy_gml_array_check_index_set(2)]=(yyGetBool(!yyGetBool(gmlAX)))&&(yyGetBool(gmlQ3));
					gmlW[__yy_gml_array_check_index_chain(2,gmlW)][__yy_gml_array_check_index_set(1)]=(yyGetBool(!yyGetBool(gmlAX)))&&(yyGetBool(!yyGetBool(_inst.gmlCSEN_)));
					gmlW[__yy_gml_array_check_index_chain(2,gmlW)][__yy_gml_array_check_index_set(2)]=(yyGetBool(!yyGetBool(gmlAX)))&&(yyGetBool(gmlP1));
					gmlW[__yy_gml_array_check_index_chain(2,gmlW)][__yy_gml_array_check_index_set(3)]=(yyGetBool(!yyGetBool(gmlCAS_)))&&(yyGetBool(!yyGetBool(gmlRAS_)));
					gmlW[__yy_gml_array_check_index_chain(3,gmlW)][__yy_gml_array_check_index_set(1)]=(yyGetBool(!yyGetBool(gmlAX)))&&(yyGetBool(gmlP1))&&(yyGetBool(!yyGetBool(gmlS7M)));
					gmlW[__yy_gml_array_check_index_chain(3,gmlW)][__yy_gml_array_check_index_set(2)]=(yyGetBool(!yyGetBool(gmlAX)))&&(yyGetBool(gmlP0))&&(yyGetBool(gmlS7M));
					gmlW[__yy_gml_array_check_index_chain(3,gmlW)][__yy_gml_array_check_index_set(3)]=(yyGetBool(!yyGetBool(gmlQ3)))&&(yyGetBool(!yyGetBool(gmlRAS_)));
					gmlW[__yy_gml_array_check_index_chain(4,gmlW)][__yy_gml_array_check_index_set(1)]=(yyGetBool(gmlP0))&&(yyGetBool(gmlRAS_))&&(yyGetBool(!yyGetBool(gmlQ3)));
					gmlW[__yy_gml_array_check_index_chain(4,gmlW)][__yy_gml_array_check_index_set(2)]=(yyGetBool(!yyGetBool(gmlP0)))&&(yyGetBool(!yyGetBool(gmlRAS_)));
					gmlW[__yy_gml_array_check_index_chain(4,gmlW)][__yy_gml_array_check_index_set(3)]=(yyGetBool(!yyGetBool(gmlP0)))&&(yyGetBool(gmlQ3));
					gmlW[__yy_gml_array_check_index_chain(5,gmlW)][__yy_gml_array_check_index_set(1)]=(yyGetBool(!yyGetBool(gmlP0)))&&(yyGetBool(gmlRAS_))&&(yyGetBool(!yyGetBool(gmlQ3)));
					gmlW[__yy_gml_array_check_index_chain(5,gmlW)][__yy_gml_array_check_index_set(2)]=(yyGetBool(gmlP0))&&(yyGetBool(!yyGetBool(gmlRAS_)));
					gmlW[__yy_gml_array_check_index_chain(5,gmlW)][__yy_gml_array_check_index_set(3)]=(yyGetBool(gmlP0))&&(yyGetBool(gmlQ3));
					gmlW[__yy_gml_array_check_index_chain(9,gmlW)][__yy_gml_array_check_index_set(1)]=(yyGetBool(!yyGetBool(_inst.gmlGX_)))&&(yyGetBool(_inst.gmlSEGB));
					gmlW[__yy_gml_array_check_index_chain(9,gmlW)][__yy_gml_array_check_index_set(2)]=(yyGetBool(_inst.gmlGX_))&&(yyGetBool(!yyGetBool(_inst.gmlCOL80_)));
					gmlW[__yy_gml_array_check_index_chain(9,gmlW)][__yy_gml_array_check_index_set(3)]=(yyGetBool(_inst.gmlGX_))&&(yyGetBool(gmlS7M));
					gmlW[__yy_gml_array_check_index_chain(9,gmlW)][__yy_gml_array_check_index_set(4)]=(yyGetBool(!yyGetBool(gmlVID7)))&&(yyGetBool(gmlP1))&&(yyGetBool(!yyGetBool(gmlQ3)))&&(yyGetBool(!yyGetBool(gmlAX)));
					gmlW[__yy_gml_array_check_index_chain(9,gmlW)][__yy_gml_array_check_index_set(5)]=(yyGetBool(!yyGetBool(gmlH0)))&&(yyGetBool(gmlCREF))&&(yyGetBool(gmlP1))&&(yyGetBool(!yyGetBool(gmlQ3)))&&(yyGetBool(!yyGetBool(gmlAX)));
					gmlW[__yy_gml_array_check_index_chain(9,gmlW)][__yy_gml_array_check_index_set(6)]=(yyGetBool(gmlV7M))&&(yyGetBool(gmlAX));
					gmlW[__yy_gml_array_check_index_chain(9,gmlW)][__yy_gml_array_check_index_set(7)]=(yyGetBool(gmlV7M))&&(yyGetBool(gmlP0));
					gmlW[__yy_gml_array_check_index_chain(9,gmlW)][__yy_gml_array_check_index_set(8)]=(yyGetBool(gmlV7M))&&(yyGetBool(gmlQ3));
					gmlW[__yy_gml_array_check_index_chain(10,gmlW)][__yy_gml_array_check_index_set(1)]=(yyGetBool(!yyGetBool(gmlQ3)))&&(yyGetBool(!yyGetBool(gmlAX)))&&(yyGetBool(!yyGetBool(_inst.gmlCOL80_)))&&(yyGetBool(_inst.gmlGX_));
					gmlW[__yy_gml_array_check_index_chain(10,gmlW)][__yy_gml_array_check_index_set(2)]=(yyGetBool(!yyGetBool(gmlQ3)))&&(yyGetBool(!yyGetBool(gmlAX)))&&(yyGetBool(gmlP1))&&(yyGetBool(_inst.gmlGX_));
					gmlW[__yy_gml_array_check_index_chain(10,gmlW)][__yy_gml_array_check_index_set(3)]=(yyGetBool(!yyGetBool(gmlQ3)))&&(yyGetBool(!yyGetBool(gmlAX)))&&(yyGetBool(gmlP1))&&(yyGetBool(_inst.gmlSEGB));
					gmlW[__yy_gml_array_check_index_chain(10,gmlW)][__yy_gml_array_check_index_set(4)]=(yyGetBool(!yyGetBool(gmlQ3)))&&(yyGetBool(!yyGetBool(gmlAX)))&&(yyGetBool(gmlP1))&&(yyGetBool(!yyGetBool(gmlVID7)));
					gmlW[__yy_gml_array_check_index_chain(10,gmlW)][__yy_gml_array_check_index_set(5)]=(yyGetBool(!yyGetBool(gmlQ3)))&&(yyGetBool(!yyGetBool(gmlAX)))&&(yyGetBool(gmlP1))&&(yyGetBool(gmlCREF))&&(yyGetBool(!yyGetBool(gmlH0)));
					gmlW[__yy_gml_array_check_index_chain(10,gmlW)][__yy_gml_array_check_index_set(6)]=(yyGetBool(!yyGetBool(gmlQ3)))&&(yyGetBool(gmlAX))&&(yyGetBool(!yyGetBool(gmlRAS_)))&&(yyGetBool(gmlP1))&&(yyGetBool(gmlVID7))&&(yyGetBool(!yyGetBool(_inst.gmlSEGB)))&&(yyGetBool(!yyGetBool(_inst.gmlGX_)));
					if((yyGetBool(!yyGetBool(gmlRAS_)))||(yyGetBool(!yyGetBool(gmlP1)))||(yyGetBool(gmlQ3)))
					{

												{
							gmlW[__yy_gml_array_check_index_chain(6,gmlW)][__yy_gml_array_check_index_set(1)]=gmlH0;
						}
						;
					}
					else 
					{

												{
							gmlHCNT=yyfplus(gmlHCNT,1);
							if(yyfnotequal(gmlHCNT,3))
							{

																{
									gmlW[__yy_gml_array_check_index_chain(6,gmlW)][__yy_gml_array_check_index_set(1)]=!yyGetBool(gmlH0);
								}
								;
							}
							else 
							{

																{
									gmlW[__yy_gml_array_check_index_chain(6,gmlW)][__yy_gml_array_check_index_set(1)]=gmlH0;
								}
								;
							}
							;
						}
						;
					}
					;
					if(yyGetBool(gmlS7M))
					{

												{
							gmlW[__yy_gml_array_check_index_chain(7,gmlW)][__yy_gml_array_check_index_set(1)]=!yyGetBool(gmlCREF);
						}
						;
					}
					else 
					{

												{
							gmlW[__yy_gml_array_check_index_chain(7,gmlW)][__yy_gml_array_check_index_set(1)]=gmlCREF;
						}
						;
					}
					;
					gmlW[__yy_gml_array_check_index_chain(8,gmlW)][__yy_gml_array_check_index_set(1)]=!yyGetBool(gmlS7M);
					if((yyGetBool(gmlRAS_))&&(yyGetBool(!yyGetBool(gmlQ3))))
					{

												{
							gmlVCNT=yyfplus(gmlVCNT,1);
							if(yyfless(gmlVCNT,9))
							{

																{
									gmlW[__yy_gml_array_check_index_chain(11,gmlW)][__yy_gml_array_check_index_set(1)]=_inst.gmlV[__yy_gml_array_check_index(gmlVCNT,_inst.gmlV)];
								}
								;
							}
							else 
							{

																{
									gmlW[__yy_gml_array_check_index_chain(11,gmlW)][__yy_gml_array_check_index_set(1)]=gmlVID7;
								}
								;
							}
							;
						}
						;
					}
					else 
					{

												{
							gmlW[__yy_gml_array_check_index_chain(11,gmlW)][__yy_gml_array_check_index_set(1)]=gmlVID7;
						}
						;
					}
					;
					if((yyGetBool(!yyGetBool(gmlSCAN)))&&(yyGetBool(gmlP0))&&(yyGetBool(!yyGetBool(gmlQ3)))&&(yyGetBool(gmlRAS_)))
					{

												{
							draw_primitive_begin(2);
							draw_vertex(gmlX,0);
							draw_vertex(gmlX,102);
							draw_primitive_end();
							draw_primitive_begin(1);
							draw_vertex(gmlX,102);
							draw_primitive_end();
						}
						;
					}
					;
					if((yyGetBool(!yyGetBool(gmlSCAN)))&&(yyGetBool(gmlP1))&&(yyGetBool(!yyGetBool(gmlQ3)))&&(yyGetBool(!yyGetBool(gmlAX))))
					{

												{
							var gmlY=7;
							for(;yyflessequal(gmlY,95);gmlY=yyfplus(gmlY,8))
							{

																{
									draw_primitive_begin(1);
									draw_vertex(yyfminus(__yy_gml_errCheck(gmlX),2),gmlY);
									draw_primitive_end();
								}
							}
							;
						}
						;
					}
					;
					var gmlSIGNAL=0;
					for(;yyflessequal(gmlSIGNAL,11);gmlSIGNAL=yyfplus(gmlSIGNAL,1))
					{

												{
							var gmlY=yyfplus(__yy_gml_errCheck(yyftime(__yy_gml_errCheck(gmlSIGNAL),8)),13);
							var gmlTERM=8;
							for(;yyfgreaterequal(gmlTERM,2);gmlTERM=yyfminus(gmlTERM,1))
							{

																{
									gmlW[__yy_gml_array_check_index_chain(gmlSIGNAL,gmlW)][__yy_gml_array_check_index_set(yyfminus(__yy_gml_errCheck(gmlTERM),1))]=(yyGetBool(gmlW[__yy_gml_array_check_index(gmlSIGNAL,gmlW)][__yy_gml_array_check_index(yyfminus(__yy_gml_errCheck(gmlTERM),1),gmlW[~~gmlSIGNAL])]))||(yyGetBool(gmlW[__yy_gml_array_check_index(gmlSIGNAL,gmlW)][__yy_gml_array_check_index(gmlTERM,gmlW[~~gmlSIGNAL])]));
								}
							}
							;
							if((yyGetBool(yyfless(gmlSIGNAL,6)))||(yyGetBool(yyfequal(gmlSIGNAL,9)))||(yyGetBool(yyfequal(gmlSIGNAL,10))))
							{

																{
									gmlW[__yy_gml_array_check_index_chain(gmlSIGNAL,gmlW)][__yy_gml_array_check_index_set(1)]=!yyGetBool(gmlW[__yy_gml_array_check_index(gmlSIGNAL,gmlW)][__yy_gml_array_check_index(1,gmlW[~~gmlSIGNAL])]);
								}
								;
							}
							;
							draw_primitive_begin(3);
							draw_vertex(gmlX,yyfminus(__yy_gml_errCheck(gmlY),__yy_gml_errCheck(yyftime(4,__yy_gml_errCheck(gmlW[__yy_gml_array_check_index(gmlSIGNAL,gmlW)][__yy_gml_array_check_index(0,gmlW[~~gmlSIGNAL])])))));
							draw_vertex(gmlX,yyfminus(__yy_gml_errCheck(gmlY),__yy_gml_errCheck(yyftime(4,__yy_gml_errCheck(gmlW[__yy_gml_array_check_index(gmlSIGNAL,gmlW)][__yy_gml_array_check_index(1,gmlW[~~gmlSIGNAL])])))));
							draw_vertex(yyfplus(__yy_gml_errCheck(gmlX),4),yyfminus(__yy_gml_errCheck(gmlY),__yy_gml_errCheck(yyftime(4,__yy_gml_errCheck(gmlW[__yy_gml_array_check_index(gmlSIGNAL,gmlW)][__yy_gml_array_check_index(1,gmlW[~~gmlSIGNAL])])))));
							draw_primitive_end();
							draw_primitive_begin(1);
							draw_vertex(gmlX,yyfminus(__yy_gml_errCheck(gmlY),__yy_gml_errCheck(yyftime(4,__yy_gml_errCheck(gmlW[__yy_gml_array_check_index(gmlSIGNAL,gmlW)][__yy_gml_array_check_index(1,gmlW[~~gmlSIGNAL])])))));
							draw_primitive_end();
							gmlW[__yy_gml_array_check_index_chain(gmlSIGNAL,gmlW)][__yy_gml_array_check_index_set(0)]=gmlW[__yy_gml_array_check_index(gmlSIGNAL,gmlW)][__yy_gml_array_check_index(1,gmlW[~~gmlSIGNAL])];
						}
					}
					;
				}
			}
			;
			matrix_stack_pop();
			matrix_set(2,matrix_stack_top());
			surface_reset_target();
		}
		;
	}
	;
	if(yyGetBool(method(undefined,surface_exists)))
	{

				{
			draw_surface(_inst.gmlsurf,0,0);
		}
		;
	}
	else 
	{

				{
			draw_set_color(255);
			draw_set_font(YYASSET_REF(0x06000000));
			draw_text(10,10,"SURFACE ERROR");
		}
		;
	}
	;
}

function compile_if_weak_ref()
{
}

function compile_if_used()
{
}

function gmlInitGlobal()
{
	global.__yyIsGMLObject=true;
	compile_if_weak_ref(move_random,move_random.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(place_free,place_free.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(place_empty,place_empty.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(place_meeting,place_meeting.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(place_snapped,place_snapped.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(move_snap,move_snap.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(move_towards_point,move_towards_point.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(move_contact_solid,move_contact_solid.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(move_contact_all,move_contact_all.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(move_outside_solid,move_outside_solid.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(move_outside_all,move_outside_all.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(move_and_collide,move_and_collide.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(move_bounce_solid,move_bounce_solid.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(move_bounce_all,move_bounce_all.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(move_wrap,move_wrap.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(motion_set,motion_set.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(motion_add,motion_add.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(distance_to_point,distance_to_point.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(distance_to_object,distance_to_object.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(path_start,path_start.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(path_end,path_end.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(mp_linear_step,mp_linear_step.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(mp_linear_path,mp_linear_path.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(mp_linear_step_object,mp_linear_step_object.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(mp_linear_path_object,mp_linear_path_object.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(mp_potential_settings,mp_potential_settings.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(mp_potential_step,mp_potential_step.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(mp_potential_path,mp_potential_path.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(mp_potential_step_object,mp_potential_step_object.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(mp_potential_path_object,mp_potential_path_object.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(mp_grid_add_instances,mp_grid_add_instances.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(mp_grid_path,mp_grid_path.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(collision_point,collision_point.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(collision_point_list,collision_point_list.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(collision_rectangle,collision_rectangle.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(collision_rectangle_list,collision_rectangle_list.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(collision_circle,collision_circle.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(collision_circle_list,collision_circle_list.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(collision_ellipse,collision_ellipse.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(collision_ellipse_list,collision_ellipse_list.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(collision_line,collision_line.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(collision_line_list,collision_line_list.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_nearest,instance_nearest.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_furthest,instance_furthest.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_place,instance_place.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_place_list,instance_place_list.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_copy,instance_copy.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_change,instance_change.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_destroy,instance_destroy.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(position_empty,position_empty.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(position_meeting,position_meeting.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(position_destroy,position_destroy.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(position_change,position_change.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_id_get,instance_id_get.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_deactivate_all,instance_deactivate_all.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_deactivate_object,instance_deactivate_object.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_deactivate_region,instance_deactivate_region.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_deactivate_layer,instance_deactivate_layer.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_activate_all,instance_activate_all.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_activate_object,instance_activate_object.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_activate_region,instance_activate_region.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(instance_activate_layer,instance_activate_layer.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_self,draw_self.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_sprite,draw_sprite.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_sprite_pos,draw_sprite_pos.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_sprite_ext,draw_sprite_ext.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_sprite_stretched,draw_sprite_stretched.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_sprite_stretched_ext,draw_sprite_stretched_ext.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_sprite_part,draw_sprite_part.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_sprite_part_ext,draw_sprite_part_ext.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_sprite_general,draw_sprite_general.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_sprite_tiled,draw_sprite_tiled.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_sprite_tiled_ext,draw_sprite_tiled_ext.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(event_inherited,event_inherited.__yy_bothSelfAndOther=true);
	compile_if_weak_ref(event_perform,event_perform.__yy_bothSelfAndOther=true);
	compile_if_weak_ref(event_perform_async,event_perform_async.__yy_bothSelfAndOther=true);
	compile_if_weak_ref(event_user,event_user.__yy_bothSelfAndOther=true);
	compile_if_weak_ref(event_perform_object,event_perform_object.__yy_bothSelfAndOther=true);
	compile_if_weak_ref(alarm_get,alarm_get.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(alarm_set,alarm_set.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_fixture_bind,physics_fixture_bind.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_fixture_bind_ext,physics_fixture_bind_ext.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_apply_force,physics_apply_force.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_apply_impulse,physics_apply_impulse.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_apply_angular_impulse,physics_apply_angular_impulse.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_apply_local_force,physics_apply_local_force.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_apply_local_impulse,physics_apply_local_impulse.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_apply_torque,physics_apply_torque.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_mass_properties,physics_mass_properties.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_draw_debug,physics_draw_debug.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_test_overlap,physics_test_overlap.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_get_friction,physics_get_friction.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_get_density,physics_get_density.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_get_restitution,physics_get_restitution.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_set_friction,physics_set_friction.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_set_density,physics_set_density.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(physics_set_restitution,physics_set_restitution.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_set,skeleton_animation_set.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_get,skeleton_animation_get.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_mix,skeleton_animation_mix.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_set_ext,skeleton_animation_set_ext.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_get_ext,skeleton_animation_get_ext.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_get_duration,skeleton_animation_get_duration.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_get_frames,skeleton_animation_get_frames.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_clear,skeleton_animation_clear.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_skin_set,skeleton_skin_set.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_skin_get,skeleton_skin_get.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_skin_create,skeleton_skin_create.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_attachment_set,skeleton_attachment_set.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_attachment_get,skeleton_attachment_get.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_attachment_create,skeleton_attachment_create.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_attachment_create_colour,skeleton_attachment_create_colour.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_attachment_create_color,skeleton_attachment_create_color.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_attachment_replace,skeleton_attachment_replace.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_attachment_replace_colour,skeleton_attachment_replace_colour.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_attachment_replace_color,skeleton_attachment_replace_color.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_attachment_destroy,skeleton_attachment_destroy.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_attachment_exists,skeleton_attachment_exists.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_collision_draw_set,skeleton_collision_draw_set.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_bone_data_get,skeleton_bone_data_get.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_bone_data_set,skeleton_bone_data_set.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_bone_state_get,skeleton_bone_state_get.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_bone_state_set,skeleton_bone_state_set.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_slot_data_instance,skeleton_slot_data_instance.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_slot_colour_set,skeleton_slot_colour_set.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_slot_color_set,skeleton_slot_color_set.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_slot_colour_get,skeleton_slot_colour_get.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_slot_color_get,skeleton_slot_color_get.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_slot_alpha_get,skeleton_slot_alpha_get.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_get_frame,skeleton_animation_get_frame.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_set_frame,skeleton_animation_set_frame.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_is_looping,skeleton_animation_is_looping.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_is_finished,skeleton_animation_is_finished.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_get_position,skeleton_animation_get_position.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_set_position,skeleton_animation_set_position.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_animation_get_event_frames,skeleton_animation_get_event_frames.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_get_minmax,skeleton_get_minmax.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_get_num_bounds,skeleton_get_num_bounds.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_get_bounds,skeleton_get_bounds.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(skeleton_find_slot,skeleton_find_slot.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_tilemap,draw_tilemap.__yy_onlySelfNoOther=true);
	compile_if_weak_ref(draw_tile,draw_tile.__yy_onlySelfNoOther=true);
}

function gmlGameEndScripts()
{
}
Tags=[];
IDToTagList=[];
JSON_game.ScriptNames=[];
JSON_game.Scripts=[];
var __yyg__SetImageIndexGML=
function(frame)
{
	this.image_index=frame;
}
;
var g_instance_names=
{
	"x":[true,true,true,null,null],"y":[true,true,true,null,null],"xprevious":[true,true,true,null,null],"yprevious":[true,true,true,null,null],"xstart":[true,true,true,null,null],"ystart":[true,true,true,null,null],"hspeed":[true,true,true,null,null],"vspeed":[true,true,true,null,null],"direction":[true,true,true,null,null],"speed":[true,true,true,null,null],"friction":[true,true,true,null,null],"gravity":[true,true,true,null,null],"gravity_direction":[true,true,true,null,null],"in_collision_tree":[true,false,true,null,null],"object_index":[true,false,false,null,null],"id":[true,false,false,null,null],"alarm":[true,true,true,null,null],"solid":[true,true,true,null,null],"visible":[true,true,true,null,null],"persistent":[true,true,true,null,null],"managed":[true,false,true,null,null],"depth":[true,true,true,null,null],"bbox_left":[true,false,false,null,null],"bbox_right":[true,false,false,null,null],"bbox_top":[true,false,false,null,null],"bbox_bottom":[true,false,false,null,null],"sprite_index":[true,true,true,null,null],"image_index":[true,true,true,null,"SetImageIndexGML"],"image_single":[true,true,true,null,null],"image_number":[true,false,false,null,null],"sprite_width":[true,false,false,null,null],"sprite_height":[true,false,false,null,null],"sprite_xoffset":[true,false,false,null,null],"sprite_yoffset":[true,false,false,null,null],"image_xscale":[true,true,true,null,null],"image_yscale":[true,true,true,null,null],"image_angle":[true,true,true,null,null],"image_alpha":[true,true,true,null,null],"image_blend":[true,true,true,null,null],"image_speed":[true,true,true,null,null],"mask_index":[true,true,true,null,null],"path_index":[true,false,false,null,null],"path_position":[true,true,true,null,null],"path_positionprevious":[true,true,true,null,null],"path_speed":[true,true,true,null,null],"path_scale":[true,true,true,null,null],"path_orientation":[true,true,true,null,null],"path_endaction":[true,true,true,null,null],"timeline_index":[true,true,true,null,null],"timeline_position":[true,true,true,null,null],"timeline_speed":[true,true,true,null,null],"timeline_running":[true,true,true,null,null],"timeline_loop":[true,true,true,null,null],"phy_rotation":[true,true,true,null,null],"phy_position_x":[true,true,true,null,null],"phy_position_y":[true,true,true,null,null],"phy_angular_velocity":[true,true,true,null,null],"phy_linear_velocity_x":[true,true,true,null,null],"phy_linear_velocity_y":[true,true,true,null,null],"phy_speed_x":[true,true,true,null,null],"phy_speed_y":[true,true,true,null,null],"phy_speed":[true,false,true,null,null],"phy_angular_damping":[true,true,true,null,null],"phy_linear_damping":[true,true,true,null,null],"phy_bullet":[true,true,true,null,null],"phy_fixed_rotation":[true,true,true,null,null],"phy_active":[true,true,true,null,null],"phy_mass":[true,false,true,null,null],"phy_inertia":[true,false,true,null,null],"phy_com_x":[true,false,true,null,null],"phy_com_y":[true,false,true,null,null],"phy_dynamic":[true,false,true,null,null],"phy_kinematic":[true,false,true,null,null],"phy_sleeping":[true,false,true,null,null],"phy_position_xprevious":[true,true,true,null,null],"phy_position_yprevious":[true,true,true,null,null],"phy_collision_points":[true,false,true,null,null],"layer":[true,true,true,null,null],"in_sequence":[true,false,true,null,null],"sequence_instance":[true,false,true,null,null],"drawn_by_sequence":[true,false,true,null,null],"phy_collision_x":[true,false,true,null,null],"phy_collision_y":[true,false,true,null,null],"phy_col_normal_x":[true,false,true,null,null],"phy_col_normal_y":[true,false,true,null,null]}
;
var g_global_names=
{
	"argument_relative":[true,false,false,"get_argument_relative",null],"argument_count":[true,false,false,null,null],"argument":[true,true,true,null,null],"argument0":[true,true,true,null,null],"argument1":[true,true,true,null,null],"argument2":[true,true,true,null,null],"argument3":[true,true,true,null,null],"argument4":[true,true,true,null,null],"argument5":[true,true,true,null,null],"argument6":[true,true,true,null,null],"argument7":[true,true,true,null,null],"argument8":[true,true,true,null,null],"argument9":[true,true,true,null,null],"argument10":[true,true,true,null,null],"argument11":[true,true,true,null,null],"argument12":[true,true,true,null,null],"argument13":[true,true,true,null,null],"argument14":[true,true,true,null,null],"argument15":[true,true,true,null,null],"debug_mode":[true,false,true,null,null],"pointer_invalid":[true,false,false,null,null],"pointer_null":[true,false,false,null,null],"undefined":[true,false,false,null,null],"NaN":[true,false,false,null,null],"infinity":[true,false,false,null,null],"room":[true,true,true,"get_current_room","set_current_room"],"room_first":[true,false,false,null,null],"room_last":[true,false,false,null,null],"transition_kind":[true,true,true,null,null],"transition_steps":[true,true,true,null,null],"score":[true,true,true,null,null],"lives":[true,true,true,null,"set_lives_function"],"health":[true,true,true,null,"set_health_function"],"game_id":[true,false,false,null,null],"game_display_name":[true,false,true,null,null],"game_project_name":[true,false,true,null,null],"game_save_id":[true,false,true,null,null],"working_directory":[true,false,false,null,null],"temp_directory":[true,false,false,null,null],"cache_directory":[true,false,false,null,null],"program_directory":[true,false,false,null,null],"instance_count":[true,false,false,"get_instance_count",null],"instance_id":[true,false,false,null,null],"room_width":[true,true,false,null,"set_room_width"],"room_height":[true,true,false,null,"set_room_height"],"room_caption":[true,true,true,null,"set_room_caption"],"room_speed":[true,true,true,"get_room_speed","set_room_speed"],"room_persistent":[true,true,true,null,"set_room_persistent"],"view_enabled":[true,true,true,"get_view_enable","set_view_enable"],"view_current":[true,false,false,null,null],"view_visible":[true,true,true,null,null],"mouse_x":[true,false,false,"get_mouse_x",null],"mouse_y":[true,false,false,"get_mouse_y",null],"mouse_button":[true,true,true,null,null],"mouse_lastbutton":[true,true,true,null,null],"keyboard_key":[true,true,true,null,null],"keyboard_lastkey":[true,true,true,null,null],"keyboard_lastchar":[true,true,true,null,null],"keyboard_string":[true,true,true,null,null],"show_score":[true,true,true,null,null],"show_lives":[true,true,true,null,null],"show_health":[true,true,true,null,null],"caption_score":[true,true,true,null,null],"caption_lives":[true,true,true,null,null],"caption_health":[true,true,true,null,null],"fps":[true,false,false,null,null],"fps_real":[true,false,false,null,null],"current_time":[true,false,false,"get_current_time",null],"current_year":[true,false,false,"get_current_year",null],"current_month":[true,false,false,"get_current_month",null],"current_day":[true,false,false,"get_current_day",null],"current_weekday":[true,false,false,"get_current_weekday",null],"current_hour":[true,false,false,"get_current_hour",null],"current_minute":[true,false,false,"get_current_minute",null],"current_second":[true,false,false,"get_current_second",null],"event_type":[true,false,false,"get_current_event_type",null],"event_number":[true,false,false,"get_current_event_number",null],"event_object":[true,false,false,"get_current_event_object",null],"event_action":[true,false,false,null,null],"error_occurred":[true,true,true,null,null],"error_last":[true,true,true,null,null],"gamemaker_registered":[true,false,false,null,null],"gamemaker_pro":[true,false,false,null,null],"application_surface":[true,false,false,null,null],"font_texture_page_size":[true,true,false,null,null],"os_type":[true,false,false,"get_os_type",null],"os_device":[true,false,false,"get_os_device",null],"os_browser":[true,false,false,"get_os_browser",null],"os_version":[true,false,false,"get_os_version",null],"browser_width":[true,false,false,"get_browser_width",null],"browser_height":[true,false,false,"get_browser_height",null],"async_load":[true,false,false,"get_async_load",null],"event_data":[true,false,false,"get_event_data",null],"display_aa":[true,false,false,"get_display_aa",null],"iap_data":[true,false,false,"get_iap_data",null],"cursor_sprite":[true,true,false,"get_cursor_sprite","set_cursor_sprite"],"delta_time":[true,true,false,"get_delta_time",null],"webgl_enabled":[true,false,false,null,null],"audio_bus_main":[true,true,true,null,null],"rollback_current_frame":[true,false,false,null,null],"rollback_confirmed_frame":[true,false,false,null,null],"rollback_event_id":[true,false,false,null,null],"rollback_event_param":[true,false,false,null,null],"rollback_game_running":[true,false,false,null,null],"rollback_api_server":[true,false,false,null,null],"wallpaper_config":[true,false,false,null,null],"wallpaper_subscription_data":[true,false,false,null,null],"view_xview":[true,true,true,null,null],"view_yview":[true,true,true,null,null],"view_wview":[true,true,true,null,null],"view_hview":[true,true,true,null,null],"view_angle":[true,true,true,null,null],"view_hborder":[true,true,true,null,null],"view_vborder":[true,true,true,null,null],"view_hspeed":[true,true,true,null,null],"view_vspeed":[true,true,true,null,null],"view_object":[true,true,true,null,null],"view_xport":[true,true,true,null,null],"view_yport":[true,true,true,null,null],"view_wport":[true,true,true,null,null],"view_hport":[true,true,true,null,null],"view_surface_id":[true,true,true,null,null],"view_camera":[true,true,true,null,null],"marked":[false,false,false,null,null],"active":[false,false,false,null,null]}
;
/*@constructor */
function _Q1(_R1)
{
	this._S1=false;
	this._T1=0;
	this._U1=0;
	this._V1=false;
	this._W1=0;
	this._X1=new _Y1(0);
	this._Z1=new _Y1(0);
	this.__1=null;
	this._02=null;
	this._12=null;
	this._22=null;
	this._32=null;
	this._42=null;
	this._52=[];
	this._62(_R1._42);
}
;
_Q1.prototype._72=
function()
{
	var _82=new _Q1(
	{
		_42:this._42	}
	);
	return _82;
}
;
_Q1.prototype._62=
function(_92)
{
	this._42=_92;
	this.__1=new spine._a2(_92);
	this._32=new spine._b2(this.__1.data);
	this._22=new spine._c2(this._32);
	var listener=new Object();
	listener.start=
function(_d2)
	{
	}
	;
	listener.end=
function(_d2)
	{
	}
	;
	listener.complete=
function(_d2,_e2)
	{
	}
	;
	listener.event=
function(_d2,_f2)
	{
		var map=ds_map_create();
		g_pBuiltIn.event_data=map;
		ds_map_add(map,"name",_f2.data.name);
		ds_map_add(map,"track",_d2);
		ds_map_add(map,"integer",_f2._g2);
		ds_map_add(map,"float",_f2._h2);
		var _i2=_f2._i2?_f2._i2:_f2.data._i2;
		ds_map_add(map,"string",_i2);
		_j2._k2(_l2,0);
		ds_map_destroy(map);
		g_pBuiltIn.event_data=-1;
	}
	;
	this._22._m2(listener);
	if(_92.animations.length>0)
	{
		this._n2(null);
	}
	this._o2(null);
	this._02=new spine._p2();
}
;
_Q1.prototype._q2=
function(_r2,_s2)
{
	if(_s2==undefined)_s2=0;
	if(_s2<0)return 0;
	if(_s2>=this._22.tracks.length)return 0;
	var _t2=_u2?_u2._v2():30;
	if(_w2)
	{
		if((_r2!=undefined)&&(_r2!=null))
		{
			if(_r2.playbackspeedtype==_x2)
			{
				_t2=_y2._z2();
			}
			else 
			{
				_t2=_r2.playbackspeed;
			}
		}
		else 
		{
			_t2=_y2._z2();
		}
	}
	if(this._22.tracks[_s2]==null)
	{
		return ~~((_t2*this._12.duration)+0.5);
	}
	return ~~((_t2*this._22.tracks[_s2]._A2.duration)+0.5);
}
;

function _B2(_C2,_D2)
{
	if(_D2<0.0)return _C2;
	var _E2=_C2/_D2;
	var frac=_E2-Math.floor(_E2);
	var _F2=frac*_D2;
	return _F2;
}
_Q1.prototype._G2=
function(_s2)
{
	if(_s2<0)return 0;
	if(_s2>=this._22.tracks.length)return 0;
	if(this._22.tracks[_s2]===null)return 0;
	var _t2=_u2?_u2._v2():30;
	if(_w2)
	{
		_t2=_y2._z2();
	}
	if(_t2<=0)return 0;
	var _H2=this._22.tracks[_s2]._I2*_t2;
	_H2=_B2(_H2,_t2*this._22.tracks[_s2]._A2.duration);
	return ~~(_H2+0.5);
}
;
_Q1.prototype._J2=
function(_s2,_K2)
{
	if(_s2<0)return;
	if(_s2>=this._22.tracks.length)return;
	if(this._22.tracks[_s2]===null)return;
	var _t2=_u2?_u2._v2():30;
	if(_w2)
	{
		_t2=_y2._z2();
	}
	if(_t2<=0)return 0;
	var _H2=_B2(_K2,_t2*this._22.tracks[_s2]._A2.duration);
	var time=(_H2/_t2);
	this._22.tracks[_s2]._I2=time;
	this._S1=true;
}
;
_Q1.prototype._L2=
function(_s2)
{
	if(_s2<0)return false;
	if(_s2>=this._22.tracks.length)return false;
	if(this._22.tracks[_s2]===null)return false;
	return this._22.tracks[_s2].loop;
}
;
_Q1.prototype._M2=
function(_s2)
{
	if(_s2<0)return false;
	if(_s2>=this._22.tracks.length)return false;
	if(this._22.tracks[_s2]===null)return false;
	var _N2=this._22.tracks[_s2];
	return !_N2.loop&&_N2._I2>=_N2._A2.duration;
}
;
_Q1.prototype._n2=
function(_O2,_P2=true)
{
	this._Q2(_O2,0,_P2);
}
;
_Q1.prototype._Q2=
function(_O2,_s2,_P2=true)
{
	var _A2=null;
	if(((_O2===null)||(_O2===undefined))&&(_s2===0))
	{
		if(this._42.animations.length>0)
		{
			_A2=this._42._R2(this._42.animations[0].name);
		}
	}
	else 
	{
		_A2=this._42._R2(_O2);
	}
	if(_A2!==null&&_A2!==undefined)
	{
		if(_s2===0)
		{
			this._T1=0;
			this._U1=0;
			this._12=_A2;
		}
		this._22._S2(_s2,_A2.name,_P2);
	}
}
;
_Q1.prototype._o2=
function(_T2)
{
	var _U2=_T2;
	if(_T2===null||_T2===undefined)
	{
		if(this._42._V2)
		{
			_U2=this._42._V2.name;
		}
	}
	if(_U2!=null)
	{
		if(_U2.__type=="[SkeletonSkin]")
		{
			if(this.__1._W2===_U2._W2)
			{
				return;
			}
			this.__1._X2(_U2._W2);
			this.__1._Y2();
		}
		else 
		{
			if((this.__1.skin!=null)&&(this.__1.skin.name!=null))
			{
				if(_U2==this.__1.skin.name)
				{
					return;
				}
			}
			this.__1._Z2(_U2);
			this.__1._Y2();
		}
	}
}
;
_Q1.prototype.__2=
function(_03,_13,_23)
{
	this._32._33(_03,_13,_23);
}
;
_Q1.prototype._43=
function(_53,_63)
{
	var slot=this.__1._73(_53);
	if((slot!==null)&&(slot!==undefined))
	{
		if(typeof(_63)==='number')
		{
			slot._83(null);
		}
		else 
		{
			var _93=-1;
			if((slot.data!==null)&&(slot.data!==undefined))
			{
				_93=slot.data.index;
			}
			for(var _a3=0;_a3<this._42.skins.length;_a3++)
			{
				var skin=this._42.skins[_a3];
				var attachment=skin._b3(_93,_63);
				if(attachment)
				{
					slot._83(attachment);
					return;
				}
			}
			for(var _c3=0;_c3<this._52.length;_c3++)
			{
				var attachment=this._52[_c3].attachment;
				if(attachment.name===_63)
				{
					slot._83(attachment);
					return;
				}
			}
		}
	}
}
;
_Q1.prototype._d3=
function(_53,_e3)
{
	var slot=this.__1._73(_53);
	if((slot!==null)&&(slot!==undefined))
	{
		var _f3,_g3,_h3,_i3;
		_f3=(_e3&0xff)/255.0;
		_g3=((_e3&0xff00)>>8)/255.0;
		_h3=((_e3&0xff0000)>>16)/255.0;
		if(slot.color!=undefined)
		{
			_i3=slot.color._i3;
		}
		else 
		{
			_i3=1.0;
		}
		slot.color=new spine._j3(_f3,_g3,_h3,_i3);
	}
}
;
_Q1.prototype._k3=
function(_53,_l3)
{
	var slot=this.__1._73(_53);
	if((slot!==null)&&(slot!==undefined))
	{
		var _f3,_g3,_h3,_i3;
		_i3=_l3;
		if(slot.color!=undefined)
		{
			_f3=slot.color._f3;
			_g3=slot.color._g3;
			_h3=slot.color._h3;
		}
		else 
		{
			_f3=1.0;
			_g3=1.0;
			_h3=1.0;
		}
		slot.color=new spine._j3(_f3,_g3,_h3,_i3);
	}
}
;
_Q1.prototype._m3=
function(_53,_e3)
{
	var slot=this.__1._73(_53);
	if((slot!==null)&&(slot!==undefined))
	{
		var _n3;
		if(slot.color!=undefined)
		{
			_n3=slot.color._f3*255.0;
			_n3|=(slot.color._g3*255.0)<<8;
			_n3|=(slot.color._h3*255.0)<<16;
			_n3|=0xff000000;
		}
		else 
		{
			_n3=0xffffffff;
		}
		return _n3;
	}
	return 0xffffffff;
}
;
_Q1.prototype._o3=
function(_53,_e3)
{
	var slot=this.__1._73(_53);
	if((slot!==null)&&(slot!==undefined))
	{
		if(slot.color!=undefined)
		{
			return slot.color._i3;
		}
		else 
		{
			return 1.0;
		}
	}
	return 1.0;
}
;
_Q1.prototype._p3=
function(_53,_63,_q3=false)
{
	var _r3=undefined;
	if(!_q3)
	{
		var _93=-1;
		var slot=this.__1._73(_53);
		if((slot!==null)&&(slot!==undefined)&&(slot.data!==null)&&(slot.data!==undefined))
		{
			_93=slot.data.index;
		}
		for(var _a3=0;_a3<this._42.skins.length;_a3++)
		{
			var skin=this._42.skins[_a3];
			var attachment=skin._b3(_93,_63);
			if(attachment)
			{
				_r3=_63;
				break;
			}
		}
	}
	if(_r3===undefined)
	{
		for(var _c3=0;_c3<this._52.length;_c3++)
		{
			var attachment=this._52[_c3].attachment;
			if(attachment.name===_63)
			{
				_r3=_63;
				break;
			}
		}
	}
	return _r3;
}
;
_Q1.prototype._s3=
function(_63,_t3,_u3,_v3,_w3,_x3,_y3,_z3,_A3,_e3,_l3,_B3)
{
	var _C3=_t3._D3[_u3%_t3._E3()];
	var _F3=_G3[_C3.tp];
	var _H3;
	for(_H3=0;_H3<this._52.length;_H3++)
	{
		var attachment=this._52[_H3].attachment;
		if(attachment.name===_63)
		{
			if(_B3)
			{
				break;
			}
			else 
			{
				_I3("Custom attachment with name '"+_63+"' already exists");
			}
		}
	}
	if(!_F3.complete)
	{
		debug("Trying to create attachment "+_63+" with texture that hasn't been loaded yet.");
		return;
	}
	var _J3=new spine._K3();
	_J3.name=_t3.pName;
	_J3._L3=_C3.tp;
	_J3.width=_C3.texture.width;
	_J3.height=_C3.texture.height;
	_J3._M3=spine._N3.Linear;
	_J3._O3=spine._N3.Linear;
	_J3._P3=spine._Q3.ClampToEdge;
	_J3._R3=spine._Q3.ClampToEdge;
	_J3.texture=new _S3();
	_J3.texture.width=_J3.width;
	_J3.texture.height=_J3.height;
	_J3.texture._L3=_C3.tp;
	_J3.texture._T3=_F3;
	_J3.texture._U3(_J3._M3,_J3._O3);
	_J3.texture._V3(_J3._P3,_J3._R3);
	var _W3=new spine._X3();
	_W3._J3=_J3;
	_W3.name=_63;
	_W3.x=0;
	_W3.y=0;
	_W3.width=_t3.width;
	_W3.height=_t3.height;
	_W3._Y3=_C3.x/_C3.texture.width;
	_W3._Z3=_C3.y/_C3.texture.height;
	_W3.__3=(_C3.x+_C3.w)/_C3.texture.width;
	_W3._04=(_C3.y+_C3.h)/_C3.texture.height;
	_W3._14=0;
	_W3._24=0;
	_W3._34=_W3.width;
	_W3._44=_W3.height;
	_W3.index=0;
	_W3._54=0;
	_W3._64=null;
	_W3._74=null;
	_W3.texture=_J3.texture;
	var _84=new spine._94("");
	_84._a4.push(_J3);
	_84._b4.push(_W3);
	var _c4=new spine._d4(_84);
	var _e4=_c4._f4(this._42.skins[0],_63,_63);
	_e4.width=_W3.width;
	_e4.height=_W3.height;
	_e4.scaleX=_x3;
	_e4.scaleY=_y3;
	_e4.x=_v3;
	_e4.y=_w3;
	_e4.rotation=_z3;
	if((_e3!=undefined)&&(_l3!=undefined))
	{
		var _g4=(_e3&0xff)/255.0,_h4=((_e3&0xff00)>>8)/255.0,_i4=((_e3&0xff0000)>>16)/255.0;
		_e4.color=new spine._j3(_g4,_h4,_i4,_l3);
	}
	else if(_A3!=undefined)
	{
		_e4.color=new spine._j3();
		_e4.color._j4(_A3);
	}
	_e4._k4(_e4);
	if(_H3<this._52.length)
	{
		this._l4(this._52[_H3].attachment,_e4);
		this._52[_H3]=
		{
			attachment:_e4,_84:_84		}
		;
	}
	else 
	{
		this._52.push(
		{
			attachment:_e4,_84:_84		}
		);
	}
}
;
_Q1.prototype._m4=
function(_63)
{
	for(var i=0;i<this._52.length;i++)
	{
		var attachment=this._52[i].attachment;
		if(attachment.name===_63)
		{
			this._l4(attachment,null);
			this._52.splice(i,1);
			return true;
		}
	}
	return false;
}
;
_Q1.prototype._l4=
function(_n4,_o4)
{
	for(var i=0;i<this.__1.slots.length;++i)
	{
		var slot=this.__1.slots[i];
		if(slot&&slot._b3()===_n4)
		{
			slot._83(_o4);
		}
	}
}
;
_Q1.prototype._p4=
function(_C2)
{
	this._V1=_C2;
}
;
_Q1.prototype._q4=
function(_u3,_r4,_s4,_t4,_u4,_v4,_w4,_r2)
{
	var skeleton=this.__1;
	var _x4=this.__1._y4();
	var _z4=this._T1;
	var _A4=this._S1;
	var _B4=false;
	_u4*=-1.0;
	var _C4=(_w4!==undefined);
	if((_A4==true)||(_z4!==_u3)||(skeleton.x!==_r4)||(skeleton.y!==_s4)||(skeleton.scaleX!=_t4)||(skeleton.scaleY!=_u4)||(this._W1!==_v4))
	{
		var _D4=_r2;
		if(((_r2==undefined)||(_r2==null))&&(_w4!=undefined)&&(_w4!=null))
		{
			var index;
			index=_w4.sprite_index;
			_D4=_E4._F4(index);
		}
		var _G4=this._q2(_D4,0);
		if(_G4>0)
		{
			var _H4=_u3,_I4=this._T1,duration=this._12.duration,_J4=this._12._K4.length;
			var _L4=0;
			if(Math.abs(_H4-_I4)<(_G4/2))
			{
				if(_H4>_I4)_L4=1;
				else if(_H4<_I4)_L4=-1;
				else _L4=0;
			}
			if((this._U1>0)&&(_H4<_I4))
			{
				_H4+=_G4;
			}
			if(_I4-_H4>=_G4-1)
			{
				_H4+=_G4;
			}
			this._U1=_L4;
			var _M4=(_H4-_I4)/_G4;
			this._22._N4(_M4*duration);
		}
		this._22.apply(this.__1);
		this._T1=_u3%_G4;
		skeleton.x=_r4;
		skeleton.y=_s4;
		skeleton.scaleX=_t4;
		skeleton.scaleY=_u4;
		this._W1=_v4;
		this._X1=new _Y1(-_v4);
		this._Z1=new _Y1(_v4);
		_C4=true;
		_B4=true;
		this._S1=false;
	}
	if(_C4)
	{
		if(_w4)
		{
			_w4._O4(_P4,0,_w4,null);
		}
		this._Q4();
	}
	return _B4;
}
;
_Q1.prototype._Q4=
function()
{
	var skeleton=this.__1;
	skeleton._C4();
	this._02._N4(this.__1,1);
	var _R4=this._S4();
	_T4(this._02,this._X1,_R4[0],_R4[1]);
}
;

function _T4(_U4,_V4,_W4,_X4)
{
	var _Y4=true;
	for(var i=0;i<_U4._Z4.length;++i)
	{
		var __4=_U4._Z4[i];
		for(var _05=0;_05<__4.length;)
		{
			var _15=_25([__4[_05],__4[_05+1]],[_W4,_X4],_V4);
			var _35=__4[_05++]=_15[0];
			var _45=__4[_05++]=_15[1];
			if(_Y4)
			{
				_U4._55=_U4._65=_35;
				_U4._75=_U4._85=_45;
				_Y4=false;
			}
			else 
			{
				_U4._55=Math.min(_U4._55,_35);
				_U4._65=Math.max(_U4._65,_35);
				_U4._75=Math.min(_U4._75,_45);
				_U4._85=Math.max(_U4._85,_45);
			}
		}
	}
}
_Q1.prototype._95=
function(_a5,_r4,_s4,_t4,_u4,_v4)
{
	var _G4=this._q2(undefined,0);
	var frame=~~(_G4*(_a5/this._12.duration)+0.5);
	this._q4(frame,_r4,_s4,_t4,_u4,_v4);
}
;
_Q1.prototype._b5=
function(_c5,_u3,_r4,_s4,_t4,_u4,_v4)
{
	if(this._02!=null)
	{
		var _d5=this._02;
		this._q4(_u3,_r4,_s4,_t4,_u4,_v4,_e5);
		if(_d5._f5.length>0)
		{
			_c5.left=~~(_d5._55+0.5);
			_c5.right=~~(_d5._65+0.5);
			_c5.top=~~(_d5._75+0.5);
			_c5.bottom=~~(_d5._85+0.5);
			return true;
		}
	}
	return false;
}
;
_Q1.prototype._g5=
function(_c5)
{
	if(this._02!=null)
	{
		this._Q4();
		if(this._02._f5.length>0)
		{
			_c5.left=this._02._55;
			_c5.right=this._02._65;
			_c5.top=this._02._75;
			_c5.bottom=this._02._85;
			return true;
		}
	}
	return false;
}
;
_Q1.prototype._h5=
function()
{
	if(this._02==null)return 0;
	this._Q4();
	return this._02._f5.length;
}
;
_Q1.prototype._i5=
function(_K2)
{
	if(this._02!=null)
	{
		if(_K2>=0)
		{
			this._Q4();
			if(_K2<this._02._f5.length)
			{
				var _j5=this._02._Z4[_K2];
				var _k5=_j5.length/2;
				var _l5=[];
				_l5.push(_k5);
				_l5.push(this._02._f5[_K2].name);
				for(var i=0;i<_k5;i++)
				{
					_l5.push(_j5[i*2]);
					_l5.push(_j5[i*2+1]);
				}
				return _l5;
			}
		}
	}
	var _l5=[];
	_l5.push(0,"");
	return _l5;
}
;
_Q1.prototype._S4=
function()
{
	return [this.__1.x,this.__1.y];
}
;
_Q1.prototype._m5=
function(_u3,_r4,_s4,_t4,_u4,_v4,_n5,_o5,_p5,_q5,_r5,_s5,_t5)
{
	this._q4(_u3,_r4,_s4,_t4,_u4,_v4);
	_n5._q4(_o5,_p5,_q5,_r5,_s5,_t5);
	for(var _u5=0;_u5<_n5._02._Z4.length;_u5++)
	{
		var _v5=_n5._02._Z4[_u5];
		var size=_v5.length/2;
		for(var _w5=0;_w5<size;_w5++)
		{
			var _x5,_y5,_z5,_A5;
			_x5=_v5[(_w5*2)+0];
			_y5=_v5[(_w5*2)+1];
			if(_w5===(size-1))
			{
				_z5=_v5[0];
				_A5=_v5[1];
			}
			else 
			{
				_z5=_v5[((_w5+1)*2)+0];
				_A5=_v5[((_w5+1)*2)+1];
			}
			var _B5=this._02._C5(_x5,_y5,_z5,_A5);
			if(_B5!==null)
			{
				return true;
			}
		}
	}
	return false;
}
;
_Q1.prototype._D5=
function(_u3,_r4,_s4,_t4,_u4,_v4,_D4,_E5,_o5,_p5,_q5,_r5,_s5,_t5)
{
	this._q4(_u3,_r4,_s4,_t4,_u4,_v4);
	if(_D4==null)
	{
		return false;
	}
	if(_D4._F5<=0)
	{
		return false;
	}
	if(_D4._G5.length>0)
	{
		_o5=_o5%_D4._G5.length;
	}
	if(_o5<0)
	{
		_o5=_o5+_D4._G5.length;
	}
	_r5=1.0/_r5;
	_s5=1.0/_s5;
	var _d5=this._02;
	var _H5=_I5(_d5._55,_E5.left);
	var _f3=_J5(_d5._65,_E5.right);
	var _K5=_I5(_d5._75,_E5.top);
	var _h3=_J5(_d5._85,_E5.bottom);
	var _L5=Math.sin(-_t5*(_M5/180.0));
	var _N5=Math.cos(-_t5*(_M5/180.0));
	for(var i=_H5;i<=_f3;i++)
	{
		for(var _05=_K5;_05<=_h3;_05++)
		{
			var _O5=((_N5*(i-_p5)+_L5*(_05-_q5))*_r5+_D4._P5);
			var _Q5=((_N5*(_05-_q5)-_L5*(i-_p5))*_s5+_D4._R5);
			if((_O5<0)||(_O5>=_D4._S5))
			{
				continue;
			}
			if((_Q5<0)||(_Q5>=_D4._T5))
			{
				continue;
			}
			if(_D4._U5)
			{
				if(!_D4._G5._l5[_o5]._l5[_O5+(_Q5*_D4._S5)])
				{
					continue;
				}
			}
			var _B5=_d5._V5(i,_05);
			if(_B5!==null)
			{
				return true;
			}
		}
	}
	return false;
}
;
_Q1.prototype._W5=
function(_u3,_r4,_s4,_t4,_u4,_v4,_X5,_Y5)
{
	this._q4(_u3,_r4,_s4,_t4,_u4,_v4);
	var _B5=this._02._V5(_X5,_Y5);
	if(_B5!==null)
	{
		return true;
	}
	return false;
}
;
_Q1.prototype._Z5=
function(_u3,_r4,_s4,_t4,_u4,_v4,_X5,_Y5,_p5,_q5)
{
	this._q4(_u3,_r4,_s4,_t4,_u4,_v4);
	var _B5=this._02._C5(_X5,_Y5,_p5,_q5);
	if(_B5!==null)
	{
		return true;
	}
	return false;
}
;
_Q1.prototype.__5=
function(_u3,_r4,_s4,_t4,_u4,_v4,_X5,_Y5,_p5,_q5)
{
	this._q4(_u3,_r4,_s4,_t4,_u4,_v4);
	var _d5=this._02;
	var _B5=_d5._C5(_X5,_Y5,_p5,_q5);
	if(_B5!==null)
	{
		return true;
	}
	_B5=_d5._C5(_X5,_Y5,_p5,_Y5);
	if(_B5!==null)
	{
		return true;
	}
	_B5=_d5._C5(_p5,_Y5,_p5,_q5);
	if(_B5!==null)
	{
		return true;
	}
	_B5=_d5._C5(_p5,_q5,_X5,_q5);
	if(_B5!==null)
	{
		return true;
	}
	_B5=_d5._C5(_X5,_q5,_X5,_Y5);
	if(_B5!==null)
	{
		return true;
	}
	return false;
}
;
_Q1.prototype._06=
function(_u3,_r4,_s4,_t4,_u4,_v4,_16)
{
	this._q4(_u3,_r4,_s4,_t4,_u4,_v4);
	var _d5=this._02;
	var skeleton=this.__1;
	var _H5=_I5(_d5._55,_16.left);
	var _f3=_J5(_d5._65,_16.right);
	var _K5=_I5(_d5._75,_16.top);
	var _h3=_J5(_d5._85,_16.bottom);
	var _26=((_16.right+_16.left)/2);
	var _36=((_16.bottom+_16.top)/2);
	var _46=((_16.right-_16.left)/2);
	var _56=((_16.bottom-_16.top)/2);
	var _S5=(_d5._65-_d5._55);
	var _T5=(_d5._85-_d5._75);
	var _P5=skeleton.x-_d5._55;
	var _R5=skeleton.y-_d5._75;
	if((_t4==1)&&(_u4==1)&&(Math.abs(_v4)<0.0001))
	{
		for(var i=_H5;i<=_f3;i++)
		{
			for(var _05=_K5;_05<=_h3;_05++)
			{
				if(sqr((i-_26)/_46)+sqr((_05-_36)/_56)>1)continue;
				var _O5=i-_r4+_P5;
				var _Q5=_05-_s4+_R5;
				if((_O5<0)||(_O5>=_S5))continue;
				if((_Q5<0)||(_Q5>=_T5))continue;
				var _B5=_d5._V5(i,_05);
				if(_B5!==null)
				{
					return true;
				}
			}
		}
	}
	else 
	{
		var _66=Math.sin(-_v4*_M5/180.0);
		var _76=Math.cos(-_v4*_M5/180.0);
		for(var i=_H5;i<=_f3;i++)
		{
			for(var _05=_K5;_05<=_h3;_05++)
			{
				if(sqr((i-_26)/_46)+sqr((_05-_36)/_56)>1)continue;
				var _O5=Math.floor((_76*(i-_r4)+_66*(_05-_s4))/_t4+_P5);
				var _Q5=Math.floor((_76*(_05-_s4)-_66*(i-_r4))/_u4+_R5);
				if((_O5<0)||(_O5>=_S5))continue;
				if((_Q5<0)||(_Q5>=_T5))continue;
				var _B5=_d5._V5(i,_05);
				if(_B5!==null)
				{
					return true;
				}
			}
		}
	}
	return false;
}
;
_Q1.prototype._86=
function(_96,_a6)
{
	var bone=this.__1._b6(_96);
	if(bone)
	{
		var _c6=_d6._F4(_a6);
		if(_c6)
		{
			_c6.set("length",bone.data.length);
			_c6.set("x",bone.data.x);
			_c6.set("y",bone.data.y);
			_c6.set("angle",bone.data.rotation);
			_c6.set("xscale",bone.data.scaleX);
			_c6.set("yscale",bone.data.scaleY);
			if((bone.data.parent!==undefined)&&(bone.data.parent!==null))
			{
				_c6.set("parent",bone.data.parent.name);
			}
			else 
			{
				_c6.set("parent","");
			}
			return true;
		}
	}
	return false;
}
;
_Q1.prototype._e6=
function(_96,_a6)
{
	var bone=this.__1._b6(_96);
	if(bone)
	{
		var _c6=_d6._F4(_a6);
		if(_c6)
		{
			bone.data.length=(_c6.get("length")!==undefined)?_c6.get("length"):bone.data.length;
			bone.data.x=(_c6.get("x")!==undefined)?_c6.get("x"):bone.data.x;
			bone.data.y=(_c6.get("y")!==undefined)?_c6.get("y"):bone.data.y;
			bone.data.rotation=(_c6.get("angle")!==undefined)?_c6.get("angle"):bone.data.rotation;
			bone.data.scaleX=(_c6.get("xscale")!==undefined)?_c6.get("xscale"):bone.data.scaleX;
			bone.data.scaleY=(_c6.get("yscale")!==undefined)?_c6.get("yscale"):bone.data.scaleY;
			return true;
		}
	}
	return false;
}
;
_Q1.prototype._f6=
function(_g6,_96,_a6)
{
	var bone=this.__1._b6(_96);
	if(bone)
	{
		var _c6=_d6._F4(_a6);
		if(_c6)
		{
			var angle=_g6.image_angle;
			var _R4=this._S4();
			var _h6=[bone._i6,bone._j6];
			_h6=_25(_h6,_R4,this._X1);
			_c6.set("x",bone.x);
			_c6.set("y",bone.y);
			_c6.set("angle",bone.rotation);
			_c6.set("xscale",bone.scaleX);
			_c6.set("yscale",bone.scaleY);
			_c6.set("worldX",_h6[0]);
			_c6.set("worldY",_h6[1]);
			_c6.set("worldAngleX",bone._k6()-angle);
			_c6.set("worldAngleY",bone._l6()-angle);
			_c6.set("worldScaleX",bone._m6());
			_c6.set("worldScaleY",bone._n6());
			_c6.set("appliedAngle",bone._o6);
			if(bone.parent!=null)if(bone.parent.data!=null)_c6.set("parent",bone.parent.data.name);
			return true;
		}
	}
	return false;
}
;
_Q1.prototype._p6=
function(_g6,_96,_a6)
{
	var bone=this.__1._b6(_96);
	if(bone)
	{
		var _c6=_d6._F4(_a6);
		if(_c6)
		{
			if(_c6.get("angle")!==undefined)bone.rotation=_c6.get("angle");
			if(_c6.get("xscale")!==undefined)bone.scaleX=_c6.get("xscale");
			if(_c6.get("yscale")!==undefined)bone.scaleY=_c6.get("yscale");
			var _R4=this._S4();
			var _h6=[bone._i6,bone._j6];
			_h6=_25(_h6,_R4,this._X1);
			if(_c6.get("worldX")!==undefined)_h6[0]=_c6.get("worldX");
			if(_c6.get("worldY")!==undefined)_h6[1]=_c6.get("worldY");
			_h6=_25(_h6,_R4,this._Z1);
			if(!(Math.abs(_h6[0]-bone._i6)<0.01)||!(Math.abs(_h6[1]-bone._j6)<0.01))
			{
				var _q6;
				if((bone.parent!==undefined)&&(bone.parent!==null))
				{
					_q6=bone.parent._r6(
					{
						x:_h6[0],y:_h6[1]					}
					);
				}
				else 
				{
					_q6=bone._r6(
					{
						x:_h6[0],y:_h6[1]					}
					);
				}
				bone.x=_q6.x;
				bone.y=_q6.y;
			}
			else 
			{
				if(_c6.get("x")!==undefined)bone.x=_c6.get("x");
				if(_c6.get("y")!==undefined)bone.y=_c6.get("y");
			}
			return true;
		}
	}
	return false;
}
;
_Q1.prototype._s6=
function()
{
	if(this.__1.skin)
	{
		return this.__1.skin.name;
	}
	return "";
}
;
_Q1.prototype._t6=
function(_O2,_u6)
{
	var _v6=new spine._w6(_O2);
	for(var i=0;i<_u6.length;++i)
	{
		var _x6=this._42._y6(_u6[i]);
		if(_x6===null)
		{
			debug("Skin "+_u6[i]+" not found in skeleton");
		}
		else 
		{
			_v6._z6(_x6);
		}
	}
	return new _A6(_v6);
}
;
_Q1.prototype._B6=
function(_s2)
{
	if((_s2>=0)&&(_s2<this._22.tracks.length)&&(this._22.tracks[_s2])&&(this._22.tracks[_s2]._A2))
	{
		return this._22.tracks[_s2]._A2.name;
	}
	return "";
}
;
_Q1.prototype._C6=
function(_s2,_D6,_E6)
{
	if((_s2>=0)&&(_s2<this._22.tracks.length))
	{
		if(_D6)
		{
			this._22._F6(_s2,_E6);
		}
		else 
		{
			this._22._G6(_s2);
		}
	}
}
;
_Q1.prototype._H6=
function(_I6)
{
	var _A2=this._42._R2(_I6);
	if(_A2)
	{
		return _A2.duration;
	}
	return 0.0;
}
;
_Q1.prototype._J6=
function(_I6)
{
	var _A2=this._42._R2(_I6);
	if(_A2)
	{
		var _t2=_u2?_u2._v2():30;
		if(_w2)
		{
			_t2=_y2._z2();
		}
		if(_t2<=0)return 0;
		var _G4=_A2.duration*_t2;
		return ~~(_G4+0.5);
	}
	return 0.0;
}
;
_Q1.prototype._K6=
function(_I6,_L6)
{
	var _A2=this._42._R2(_I6);
	if(_A2==null)
	{
		return null;
	}
	var i;
	var _M6=null;
	for(i=0;i<_A2._K4.length;i++)
	{
		var _N6=_A2._K4[i];
		if(_N6 instanceof spine._O6)
		{
			_M6=_N6;
			break;
		}
	}
	if(_M6==null)
	{
		return null;
	}
	var _t2;
	if(_w2)
	{
		_t2=_y2._z2();
	}
	else 
	{
		_t2=_u2?_u2._v2():30;
	}
	var _P6=[];
	for(i=0;i<_M6.events.length;i++)
	{
		var _Q6=_M6.events[i];
		if(_Q6.data!=null)
		{
			var _R6=_Q6.data;
			if(_R6.name==_L6)
			{
				var time=_Q6.time;
				_P6.push(_t2*time);
			}
		}
	}
	if(_P6.length==0)
	{
		return null;
	}
	return _P6;
}
;
_Q1.prototype._S6=
function(_53)
{
	var slot=this.__1._73(_53);
	if(slot!==null&&slot!==undefined)
	{
		if(slot.attachment)
		{
			return slot.attachment.name;
		}
	}
	return "";
}
;
_Q1.prototype._T6=
function(_U6)
{
	for(var _u5=0;_u5<this.__1.slots.length;_u5++)
	{
		var _V6=this.__1.slots[_u5];
		var map=ds_map_create();
		ds_map_add(map,"name",_V6.data.name);
		ds_map_add(map,"bone",_V6.data._W6.name);
		ds_map_add(map,"attachment",_V6.attachment?_V6.attachment.name:"(none)");
		ds_list_add(_U6,map);
	}
}
;
/*@constructor */
function _A6(_T2)
{
	this.__type="[SkeletonSkin]";
	this._W2=_T2;
}
var _e5=null;
var _X6=false;
var _Y6=-1;
var _Z6=null;
var __6=[0.0,0.0,0.0,0.0];
var _07=0;
var _17=1;
var _27=2;
var _37=3;
var _47=4;
var _57=5;
var _67=6;
var _77=7;

function _87(_97)
{
	_e5=_97;
}
;

function _a7()
{
	this.width=null;
	this.height=null;
}

function _S3()
{
	this.name=null;
	this._T3=new _a7();
	this._b7=
function()
	{
		return this._T3;
	}
	;
	this._U3=
function(_M3,_O3)
	{
	}
	;
	this._V3=
function(_P3,_R3)
	{
	}
	;
	this.dispose=
function()
	{
	}
	;
	this._L3=null;
	this.width=null;
	this.height=null;
}
/*@constructor */
function _c7()
{
	this._d7=[];
	this._e7=null;
	this._42=null;
	this._f7=null;
	this._g7=null;
	this._h7=false;
	if(_i7)
	{
		this._j7=this._k7;
		this._l7=this._m7;
	}
	else 
	{
		this._j7=this._n7;
		this._l7=this._o7;
	}
}
;
_c7.prototype._p7=
function(_O2,_q7,_r7,_s7)
{
	this._d7[_O2]=
	{
		_t7:[],_u7:0,_v7:32,texture:_G3[_s7],x:0,y:0,w:_q7,h:_r7	}
	;
}
;
_c7.prototype._w7=
function(_x7,_y7,_z7,_A7,_B7,_C7,_r2)
{
	var _D7=_B7;
	var _E7=_C7;
	var _F7=0;
	var self=this;
	var _G7=
function(_H7,_I7)
	{
		var _J7=new _S3();
		_J7.name=_H7;
		_J7.width=_J7._T3.width=_E7[_F7].width;
		_J7.height=_J7._T3.height=_E7[_F7].height;
		if(_I7!=undefined)
		{
			_J7._L3=_I7.tp;
			self._d7[_J7.name]=_I7;
		}
		else 
		{
			var _K7=_L7(_M7+_x7+_H7);
			_J7._L3=_K7;
			_G3[_K7].onload=
function(e)
			{
				_J7._T3=e._N7;
				var target=e.target||e.srcElement;
				self._p7(_J7.name,target.width,target.height,_K7);
				if(_r2._O7!=undefined)
				{
					if(_r2._O7==true)
					{
						var _P7=self._d7[_J7.name];
						_Q7(_P7);
						if(_P7.texture._R7)
						{
							_S7(_P7.texture._R7);
						}
					}
				}
			}
			;
			_G3[_K7].onerror=
function(e)
			{
				var target=e.target||e.srcElement;
				debug("ImageError: "+target.src);
			}
			;
			_G3[_K7].URL=_H7;
		}
		if(_F7<(_D7-1))_F7++;
		return _J7;
	}
	;
	this._f7=new spine._94(_A7);
	var _T7=0;
	if(_r2._D3!=undefined)_T7=_r2._D3.length;
	for(var i=0;i<this._f7._a4.length;i++)
	{
		var _J3=this._f7._a4[i];
		_J3._U7(_G7(_J3.name,(i<_T7)?_r2._D3[i]:undefined));
	}
	this._e7=new spine._V7(new spine._d4(this._f7));
	this._42=this._e7._W7(_z7);
}
;
_c7.prototype._X7=
function()
{
	if(this._f7)
	{
		if(this._f7._a4)
		{
			return this._f7._a4.length;
		}
	}
	return 0;
}
;
_c7.prototype._Y7=
function(_K2)
{
	if(this._f7)
	{
		if(this._f7._a4)
		{
			if(this._f7._a4.length>_K2)
			{
				if(this._f7._a4[_K2].texture)
				{
					if(this._f7._a4[_K2].texture._L3)
					{
						return this._f7._a4[_K2].texture._L3;
					}
				}
			}
		}
	}
	return -1;
}
;
_c7.prototype._Z7=
function(__7,_T2,frame,x,y,_08,_18,angle,_n3,alpha)
{
	if(this._42===null||this._42===undefined)return;
	var _28=new _Q1(this);
	_28._n2(__7);
	_28._o2(_T2);
	_28._q4(frame,x,y,_08,_18,angle);
	var _R4=_28._S4();
	this._38(_28.__1,_n3,alpha,_28._X1,_R4[0],_R4[1]);
}
;
_c7.prototype._48=
function(__7,_T2,_a5,x,y,_08,_18,angle,_n3,alpha)
{
	if(this._42===null||this._42===undefined)return;
	var _28=new _Q1(this);
	_28._n2(__7);
	_28._o2(_T2);
	_28._95(_a5,x,y,_08,_18,angle);
	var _R4=_28._S4();
	this._38(_28.__1,_n3,alpha,_28._X1,_R4[0],_R4[1]);
}
;
_c7.prototype._58=
function(frame,x,y,_08,_18,angle,_n3,alpha)
{
	if(!_e5||!_e5._68())
	{
		this._Z7(null,null,frame,x,y,_08,_18,angle,_n3,alpha);
	}
	else 
	{
		var _78=_e5._68();
		_78._q4(frame,x,y,_08,_18,angle,_e5);
		var _R4=_78._S4();
		this._38(_78.__1,_n3,alpha,_78._X1,_R4[0],_R4[1]);
		if(_78._V1)
		{
			this._88(_78._02);
		}
	}
}
;
_c7.prototype._98=
function(_a8,__7,_T2,frame,x,y,_08,_18,angle,_b8,_c8,_U6)
{
	ds_list_clear(_U6);
	var _d8=false;
	var _78=null;
	if((_a8===undefined)||(_a8===null)||(_a8._68()===null))
	{
		_78=new _Q1(this);
		_d8=true;
		_78._n2(__7);
		_78._o2(_T2);
	}
	else 
	{
		_78=_a8._68();
		if((__7!==undefined)&&(__7!==null))
		{
			_78._n2(__7);
		}
		if((_T2!==undefined)&&(_T2!==null))
		{
			_78._o2(_T2);
		}
	}
	_78._q4(frame,x,y,_08,_18,angle,_a8);
	var _e8=[];
	var _f8=0;
	for(var i=0,
_u5=_78.__1.slots.length;i<_u5;i++)
	{
		var slot=_78.__1.drawOrder[i];
		if(!slot.attachment)continue;
		var _g8=false;
		if(slot.attachment instanceof spine._h8)
		{
			_g8=this._i8(slot,_b8,_c8);
		}
		else if(slot.attachment instanceof spine._j8)
		{
			_g8=this._k8(slot,_b8,_c8);
		}
		else if(slot.attachment instanceof spine._l8)
		{
			_g8=this._m8(slot,_b8,_c8);
		}
		if(_g8)
		{
			_e8[_f8]=slot;
			_f8++;
		}
	}
	if(_f8>0)
	{
		for(var i=(_f8-1);i>=0;i--)
		{
			ds_list_add(_U6,_e8[i].data.name);
		}
	}
}
;
_c7.prototype._n8=
function(__7,_o8,x,y,_08,_18,angle,color,_t3)
{
	var _28=new _Q1(this);
	_28._n2(__7);
	_28._q4(_o8,x,y,_08,_18,angle,null,_t3);
	this._88(_28._02);
}
;
_c7.prototype._38=
function(_p8,color,alpha,_q8,_r8,_s8)
{
	var _g4=(color&0xff)/255.0,_h4=((color&0xff00)>>8)/255.0,_i4=((color&0xff0000)>>16)/255.0;
	if(_i7)
	{
		this._t8(_p8,_g4,_h4,_i4,alpha,_q8,_r8,_s8);
	}
	else 
	{
		this._u8(_p8,_i4,_h4,_g4,alpha,_q8,_r8,_s8);
	}
}
;
_c7.prototype._u8=
function(_p8,_v8,_w8,_x8,_y8,_z8,_A8,_B8)
{
	var _C8=[0,1,2,2,3,0];
	var vertices=[];
	var _D8=new spine._j3(1.0,1.0,1.0,1.0);
	var _E8=false;
	for(var i=0,_u5=_p8.slots.length;
i<_u5;i++)
	{
		var slot=_p8.drawOrder[i];
		if(!slot.attachment)continue;
		var _f3=(_v8*255);
		var _g3=(_w8*255);
		var _h3=(_x8*255);
		var _i3=(_y8*255);
		if((slot.skeleton!=undefined)&&(slot.skeleton._f3!=undefined))
		{
			_f3*=slot.skeleton._f3;
			_g3*=slot.skeleton._g3;
			_h3*=slot.skeleton._h3;
			_i3*=slot.skeleton._i3;
		}
		if(slot.color!=undefined)
		{
			_f3*=slot.color._f3;
			_g3*=slot.color._g3;
			_h3*=slot.color._h3;
			_i3*=slot.color._i3;
		}
		if(slot.attachment.color!=undefined)
		{
			_f3*=slot.attachment.color._f3;
			_g3*=slot.attachment.color._g3;
			_h3*=slot.attachment.color._h3;
			_i3*=slot.attachment.color._i3;
		}
		var _n3;
		_n3=(_i3<<24)|(_f3<<16)|(_g3<<8)|(_h3<<0);
		var _F8=null;
		var uvs=null;
		var _G8=null;
		var _H8=2;
		var _I8=0;
		var _J8=0;
		var _K8=0;
		var _L8=null;
		var _K7=null;
		if(slot.attachment instanceof spine._h8)
		{
			var _W3=slot.attachment;
			if((this._g7!=null)&&(this._g7._M8()))
			{
				_W3._N8(slot.bone,vertices,0,2);
				_F8=vertices;
				uvs=_W3.uvs;
				_G8=_C8;
				_J8=4;
				_K8=6;
				_K7=_G3[_W3._W3._O8._J3.texture._L3];
				if(!_K7.complete)continue;
				if(_n3!=_P8)
				{
					if(!this._d7[_W3._W3._O8._J3.name])
					{
						var _J3=_W3._W3._O8._J3;
						this._p7(_J3.name,_J3.width,_J3.height,_J3._L3);
					}
					_K7=_Q8(this._d7[_W3._W3._O8._J3.name],_n3);
				}
				var _R8=_W3._W3._O8._J3;
				_L8=this._d7[_R8.name];
			}
			else 
			{
				this._n7(slot,_n3,_i3/255.0,_z8,_A8,_B8);
			}
		}
		else if(slot.attachment instanceof spine._j8)
		{
			var _S8=slot.attachment;
			_S8._N8(slot,0,_S8._T8,vertices,0,2);
			_F8=vertices;
			uvs=_S8.uvs;
			_G8=_S8.triangles;
			_J8=_S8._T8;
			_K8=_S8.triangles.length;
			_K7=_G3[_S8._W3._O8._J3.texture._L3];
			if(!_K7.complete)continue;
			if(_n3!=_P8)
			{
				if(!this._d7[_S8._W3._O8._J3.name])
				{
					var _J3=_S8._W3._O8._J3;
					this._p7(_J3.name,_J3.width,_J3.height,_S8._W3._O8._J3._L3);
				}
				_K7=_Q8(this._d7[_S8._W3._O8._J3.name],_n3);
			}
			_L8=this._d7[_S8._W3._O8._J3.name];
		}
		else if(slot.attachment instanceof spine._U8)
		{
			if(this._g7==null)
			{
				this._g7=new spine._V8();
			}
			this._g7._W8(slot,slot.attachment);
			continue;
		}
		if((_J8>0)&&(_K7!=null))
		{
			if((this._g7!=null)&&(this._g7._M8()))
			{
				this._g7._X8(vertices,_J8*2,_G8,_K8,uvs,_D8,_D8,_E8);
				_F8=this._g7._Y8;
				uvs=this._g7._Y8;
				_G8=this._g7._Z8;
				_H8=8;
				_I8=6;
				_J8=_F8.length/_H8;
				_K8=_G8.length;
			}
			for(var _Z3=0;_Z3<_K8/3;_Z3++)
			{
				var __8=_Z3*3;
				var _09=_G8[__8++]*_H8,_19=_G8[__8++]*_H8,_29=_G8[__8++]*_H8;
				var _39=[];
				_39[0]=
				{
				}
				;
				_39[0].x=_F8[_09];
				_39[0]._Y3=uvs[_I8+_09];
				_09++;
				_39[0].y=_F8[_09];
				_39[0]._Z3=uvs[_I8+_09];
				_39[1]=
				{
				}
				;
				_39[1].x=_F8[_19];
				_39[1]._Y3=uvs[_I8+_19];
				_19++;
				_39[1].y=_F8[_19];
				_39[1]._Z3=uvs[_I8+_19];
				_39[2]=
				{
				}
				;
				_39[2].x=_F8[_29];
				_39[2]._Y3=uvs[_I8+_29];
				_29++;
				_39[2].y=_F8[_29];
				_39[2]._Z3=uvs[_I8+_29];
				for(var pi=0;pi<3;++pi)
				{
					var _15=_25([_39[pi].x,_39[pi].y],[_A8,_B8],_z8);
					_39[pi].x=_15[0];
					_39[pi].y=_15[1];
				}
				this._49(_59,_K7,_39[0].x,_39[0].y,_39[1].x,_39[1].y,_39[2].x,_39[2].y,_39[0]._Y3*_L8.w,_39[0]._Z3*_L8.h,_39[1]._Y3*_L8.w,_39[1]._Z3*_L8.h,_39[2]._Y3*_L8.w,_39[2]._Z3*_L8.h);
			}
		}
		if(this._g7!=null)
		{
			this._g7._69(slot);
		}
	}
	if(this._g7!=null)
	{
		this._g7._79();
	}
}
;

function _89(_99,_a9,_b9)
{
	if(_a9==false)
	{
		switch(_99)
		{
			case spine._c9.Normal:_b9.src=_d9._e9;
			_b9._f9=_d9._g9;
			break;
			case spine._c9.Additive:_b9.src=_d9._e9;
			_b9._f9=_d9._h9;
			break;
			case spine._c9.Multiply:_b9.src=_d9._i9;
			_b9._f9=_d9._g9;
			break;
			case spine._c9.Screen:_b9.src=_d9._h9;
			_b9._f9=_d9._j9;
			break;
			default :_b9.src=_d9._e9;
			_b9._f9=_d9._g9;
			break;
		}
	}
	else 
	{
		switch(_99)
		{
			case spine._c9.Normal:_b9.src=_d9._h9;
			_b9._f9=_d9._g9;
			break;
			case spine._c9.Additive:_b9.src=_d9._h9;
			_b9._f9=_d9._h9;
			break;
			case spine._c9.Multiply:_b9.src=_d9._i9;
			_b9._f9=_d9._g9;
			break;
			case spine._c9.Screen:_b9.src=_d9._h9;
			_b9._f9=_d9._j9;
			break;
			default :_b9.src=_d9._e9;
			_b9._f9=_d9._g9;
			break;
		}
	}
}
_c7.prototype._t8=
function(_p8,_v8,_w8,_x8,_y8,_z8,_A8,_B8)
{
	var _C8=[0,1,2,2,3,0];
	var vertices=[];
	var _D8=new spine._j3(1.0,1.0,1.0,1.0);
	var _E8=false;
	var _k9,_l9,_m9,_n9;
	var _o9;
	if(_X6==true)
	{
		_k9=_i7._p9._q9(_d9._r9);
		_l9=_i7._p9._q9(_d9._s9);
		_m9=_i7._p9._q9(_d9._t9);
		_n9=_i7._p9._q9(_d9._u9);
		_o9=_i7._p9._q9(_d9._v9);
	}
	var _w9=new spine._j3(0.0,0.0,0.0,0.0);
	var _x9=false;
	if(_y9!=_Y6)
	{
		_Y6=_y9;
		_x9=true;
		if(_Y6!=-1)
		{
			_Z6=shader_get_uniform(_Y6,"gm_SpineTintBlackColour");
		}
	}
	for(var i=0,_u5=_p8.slots.length;i<_u5;i++)
	{
		var slot=_p8.drawOrder[i];
		if(!slot.attachment)continue;
		var _f3=(_v8*255);
		var _g3=(_w8*255);
		var _h3=(_x8*255);
		var _i3=(_y8*255);
		if((slot.skeleton!=undefined)&&(slot.skeleton._f3!=undefined))
		{
			_f3*=slot.skeleton._f3;
			_g3*=slot.skeleton._g3;
			_h3*=slot.skeleton._h3;
			_i3*=slot.skeleton._i3;
		}
		if(slot.color!=undefined)
		{
			_f3*=slot.color._f3;
			_g3*=slot.color._g3;
			_h3*=slot.color._h3;
			_i3*=slot.color._i3;
		}
		if(slot.attachment.color!=undefined)
		{
			_f3*=slot.attachment.color._f3;
			_g3*=slot.attachment.color._g3;
			_h3*=slot.attachment.color._h3;
			_i3*=slot.attachment.color._i3;
		}
		var _n3;
		_n3=(_i3<<24)|(_f3<<0)|(_g3<<8)|(_h3<<16);
		if(_Y6!=-1)
		{
			if((_Z6!=undefined)&&(_Z6!=-1))
			{
				var _z9;
				if((slot._A9!=undefined)&&(slot._A9!=null))
				{
					_z9=slot._A9;
				}
				else 
				{
					_z9=_w9;
				}
				var _B9=[_z9._f3*_v8,_z9._g3*_w8,_z9._h3*_x8,_y8];
				if((_x9)||((__6[0]!=_B9[0])||(__6[1]!=_B9[1])||(__6[2]!=_B9[2])||(__6[3]!=_B9[3])))
				{
					__6=_B9;
					shader_set_uniform_f_array(_Z6,__6);
					_x9=false;
				}
			}
		}
		var _F8=null;
		var uvs=null;
		var _G8=null;
		var _H8=2;
		var _I8=0;
		var _J8=0;
		var _K8=0;
		var _K7=null;
		if(slot.attachment instanceof spine._h8)
		{
			var _W3=slot.attachment;
			_W3._N8(slot.bone,vertices,0,2);
			_F8=vertices;
			uvs=_W3.uvs;
			_G8=_C8;
			_J8=4;
			_K8=6;
			_K7=_G3[_W3._W3._O8._J3.texture._L3];
		}
		else if(slot.attachment instanceof spine._j8)
		{
			var _S8=slot.attachment;
			_S8._N8(slot,0,_S8._T8,vertices,0,2);
			_F8=vertices;
			uvs=_S8.uvs;
			_G8=_S8.triangles;
			_J8=_S8._T8;
			_K8=_S8.triangles.length;
			_K7=_G3[_S8._W3._O8._J3.texture._L3];
		}
		else if(slot.attachment instanceof spine._U8)
		{
			if(this._g7==null)
			{
				this._g7=new spine._V8();
			}
			this._g7._W8(slot,slot.attachment);
			continue;
		}
		if((_J8>0)&&(_K7!=null))
		{
			if(!_K7.complete)continue;
			if(!_K7._R7)_Q7(
			{
				texture:_K7			}
			);
			if((this._g7!=null)&&(this._g7._M8()))
			{
				this._g7._X8(vertices,_J8*2,_G8,_K8,uvs,_D8,_D8,_E8);
				_F8=this._g7._Y8;
				uvs=this._g7._Y8;
				_G8=this._g7._Z8;
				_H8=8;
				_I8=6;
				_J8=_F8.length/_H8;
				_K8=_G8.length;
			}
			if(_X6==true)
			{
				var _C9=slot.data._D9;
				var _E9=new Object();
				_89(_C9,this._h7,_E9);
				_i7._p9._F9(_d9._r9,_E9.src);
				_i7._p9._F9(_d9._s9,_E9._f9);
				_i7._p9._F9(_d9._t9,_E9.src);
				_i7._p9._F9(_d9._u9,_E9._f9);
			}
			var _G9=_i7._H9(_d9._I9,_K7._R7,_i7._J9,_K8);
			var _K9=_G9._L9()>>2;
			var index=_K9*_G9._M9;
			_G9._M9+=_K8;
			var _N9=_G9._O9;
			var _P9=_G9._Q9;
			var _R9=_G9._S9;
			var _T9=index;
			for(var _Z3=0;_Z3<_K8;_Z3++,_T9+=_K9)
			{
				var index=_G8[_Z3];
				var _U9=_F8[(index*_H8)+0];
				var _V9=_F8[(index*_H8)+1];
				var _W9=_25([_U9,_V9],[_A8,_B8],_z8);
				_N9[_T9+0]=_W9[0];
				_N9[_T9+1]=_W9[1];
				_N9[_T9+2]=_X9;
				_P9[_T9+0]=_n3;
				_R9[_T9+0]=uvs[(index*_H8)+_I8+0];
				_R9[_T9+1]=uvs[(index*_H8)+_I8+1];
			}
		}
		if(this._g7!=null)
		{
			this._g7._69(slot);
		}
	}
	if(this._g7!=null)
	{
		this._g7._79();
	}
	if(_X6==true)
	{
		_i7._p9._F9(_d9._r9,_k9);
		_i7._p9._F9(_d9._s9,_l9);
		_i7._p9._F9(_d9._t9,_m9);
		_i7._p9._F9(_d9._u9,_n9);
		_i7._p9._F9(_d9._v9,_o9);
	}
}
;
_c7.prototype._88=
function(_Y9)
{
	draw_line(_Y9._55,_Y9._75,_Y9._55,_Y9._85);
	draw_line(_Y9._55,_Y9._85,_Y9._65,_Y9._85);
	draw_line(_Y9._65,_Y9._85,_Y9._65,_Y9._75);
	draw_line(_Y9._65,_Y9._75,_Y9._55,_Y9._75);
	for(var _u5=0;_u5<_Y9._Z4.length;_u5++)
	{
		var _v5=_Y9._Z4[_u5];
		var size=_v5.length/2;
		for(var _w5=0;_w5<size;_w5++)
		{
			var _x5,_y5,_z5,_A5;
			_x5=_v5[(_w5*2)+0];
			_y5=_v5[(_w5*2)+1];
			if(_w5==(size-1))
			{
				_z5=_v5[0];
				_A5=_v5[1];
			}
			else 
			{
				_z5=_v5[((_w5+1)*2)+0];
				_A5=_v5[((_w5+1)*2)+1];
			}
			draw_line(_x5,_y5,_z5,_A5);
		}
	}
}
;
_c7.prototype._n7=
function(slot,_n3,alpha,_q8,originX,originY)
{
	var _W3=slot.attachment,vertices=[],uvs;
	var _Z9=0;
	var __9=0;
	if(slot.skeleton)
	{
		_Z9=slot.skeleton.x;
		__9=slot.skeleton.y;
	}
	else if(slot.bone.skeleton)
	{
		_Z9=slot.bone.skeleton.x;
		__9=slot.bone.skeleton.y;
	}
	_W3._N8(slot.bone,vertices,0,2);
	uvs=_W3.uvs;
	var _39=[];
	_39[0]=
	{
	}
	;
	_39[0].x=vertices[_27];
	_39[0].y=vertices[_37];
	_39[0]._Y3=uvs[_27];
	_39[0]._Z3=uvs[_37];
	_39[1]=
	{
	}
	;
	_39[1].x=vertices[_47];
	_39[1].y=vertices[_57];
	_39[1]._Y3=uvs[_47];
	_39[1]._Z3=uvs[_57];
	_39[2]=
	{
	}
	;
	_39[2].x=vertices[_67];
	_39[2].y=vertices[_77];
	_39[2]._Y3=uvs[_67];
	_39[2]._Z3=uvs[_77];
	for(var i=0;i<3;++i)
	{
		var _15=_25([_39[i].x,_39[i].y],[originX,originY],_q8);
		;
		_39[i].x=_15[0];
		_39[i].y=_15[1];
	}
	_59.globalAlpha=alpha;
	var _R8=_W3._W3._O8._J3;
	var _K7=_G3[_R8.texture._L3];
	if(!_K7.complete)return;
	if(_n3!=_P8)
	{
		if(!this._d7[_W3._W3._O8._J3.name])
		{
			var _J3=_W3._W3._O8._J3;
			this._p7(_J3.name,_J3.width,_J3.height,_J3._L3);
		}
		_K7=_Q8(this._d7[_W3._W3._O8._J3.name],_n3);
	}
	var _L8=this._d7[_R8.name];
	this._0a(_59,_K7,_39[0].x,_39[0].y,_39[1].x,_39[1].y,_39[2].x,_39[2].y,_39[0]._Y3*_L8.w,_39[0]._Z3*_L8.h,_39[1]._Y3*_L8.w,_39[1]._Z3*_L8.h,_39[2]._Y3*_L8.w,_39[2]._Z3*_L8.h);
}
;
_c7.prototype._o7=
function(slot,_n3,alpha)
{
	var _S8=slot.attachment,vertices=[],uvs;
	_S8._N8(slot,0,_S8._T8,vertices,0,2);
	uvs=_S8.uvs;
	var _R8=_S8._W3._O8._J3;
	var _K7=_G3[_S8._W3._O8._J3.texture._L3];
	if(!_K7.complete)return;
	if(_n3!=_P8)
	{
		if(!this._d7[_S8._W3._O8._J3.name])
		{
			var _J3=_S8._W3._O8._J3;
			this._p7(_J3.name,_J3.width,_J3.height,_S8._W3._O8._J3._L3);
		}
		_K7=_Q8(this._d7[_S8._W3._O8._J3.name],_n3);
	}
	for(var _u5=0;_u5<_S8.triangles.length/3;
_u5++)
	{
		var __8=_u5*3;
		var _09=_S8.triangles[__8++]*2,_19=_S8.triangles[__8++]*2,_29=_S8.triangles[__8++]*2;
		var _39=[];
		_39[0]=
		{
		}
		;
		_39[0].x=vertices[_09];
		_39[0]._Y3=uvs[_09++];
		_39[0].y=vertices[_09];
		_39[0]._Z3=uvs[_09];
		_39[1]=
		{
		}
		;
		_39[1].x=vertices[_19];
		_39[1]._Y3=uvs[_19++];
		_39[1].y=vertices[_19];
		_39[1]._Z3=uvs[_19];
		_39[2]=
		{
		}
		;
		_39[2].x=vertices[_29];
		_39[2]._Y3=uvs[_29++];
		_39[2].y=vertices[_29];
		_39[2]._Z3=uvs[_29];
		var _L8=this._d7[_S8._W3._O8._J3.name];
		this._49(_59,_K7,_39[0].x,_39[0].y,_39[1].x,_39[1].y,_39[2].x,_39[2].y,_39[0]._Y3*_L8.w,_39[0]._Z3*_L8.h,_39[1]._Y3*_L8.w,_39[1]._Z3*_L8.h,_39[2]._Y3*_L8.w,_39[2]._Z3*_L8.h);
	}
}
;
_c7.prototype._1a=
function(slot,_n3,alpha)
{
	var _S8=slot.attachment,vertices=[];
	var _Z9=0;
	var __9=0;
	if(slot.skeleton)
	{
		_Z9=slot.skeleton.x;
		__9=slot.skeleton.y;
	}
	else if(slot.bone.skeleton)
	{
		_Z9=slot.bone.skeleton.x;
		__9=slot.bone.skeleton.y;
	}
	_S8._N8(_Z9,__9,slot,vertices);
	var _J3=_S8._L3._J3;
	var _K7=_G3[_J3._L3];
	if(_n3!=_P8)
	{
		if(!this._d7[_J3.name])
		{
			this._p7(_J3.name,_J3.width,_J3.height,_J3._L3);
		}
		_K7=_Q8(this._d7[_J3.name],_n3);
	}
	for(var _u5=0;_u5<_S8.triangles.length/3;_u5++)
	{
		var _09=_S8.triangles[(_u5*3)+0],_19=_S8.triangles[(_u5*3)+1],_29=_S8.triangles[(_u5*3)+2];
		var _39=[];
		_39[0]=
		{
		}
		;
		_39[0].x=vertices[(_09*2)+0];
		_39[0].y=vertices[(_09*2)+1];
		_39[0]._Y3=_S8.uvs[(_09*2)+0];
		_39[0]._Z3=_S8.uvs[(_09*2)+1];
		_39[1]=
		{
		}
		;
		_39[1].x=vertices[(_19*2)+0];
		_39[1].y=vertices[(_19*2)+1];
		_39[1]._Y3=_S8.uvs[(_19*2)+0];
		_39[1]._Z3=_S8.uvs[(_19*2)+1];
		_39[2]=
		{
		}
		;
		_39[2].x=vertices[(_29*2)+0];
		_39[2].y=vertices[(_29*2)+1];
		_39[2]._Y3=_S8.uvs[(_29*2)+0];
		_39[2]._Z3=_S8.uvs[(_29*2)+1];
		var _L8=this._d7[_J3.name];
		this._49(_59,_K7,_39[0].x,_39[0].y,_39[1].x,_39[1].y,_39[2].x,_39[2].y,_39[0]._Y3*_L8.w,_39[0]._Z3*_L8.h,_39[1]._Y3*_L8.w,_39[1]._Z3*_L8.h,_39[2]._Y3*_L8.w,_39[2]._Z3*_L8.h);
	}
}
;
_c7.prototype._49=
function(_2a,_3a,_4a,_5a,_x5,_y5,_z5,_A5,_6a,_7a,_8a,_9a,_aa,_ba)
{
	_2a.save();
	_2a.beginPath();
	_2a.moveTo(_4a,_5a);
	_2a.lineTo(_x5,_y5);
	_2a.lineTo(_z5,_A5);
	_2a.closePath();
	_2a.clip();
	var _ca=_6a*(_ba-_9a)-_8a*_ba+_aa*_9a+(_8a-_aa)*_7a;
	if(_ca==0)
	{
		return;
	}
	var _da=-(_7a*(_z5-_x5)-_9a*_z5+_ba*_x5+(_9a-_ba)*_4a)/_ca;
	var _ea=(_9a*_A5+_7a*(_y5-_A5)-_ba*_y5+(_ba-_9a)*_5a)/_ca;
	var _fa=(_6a*(_z5-_x5)-_8a*_z5+_aa*_x5+(_8a-_aa)*_4a)/_ca;
	var _ga=-(_8a*_A5+_6a*(_y5-_A5)-_aa*_y5+(_aa-_8a)*_5a)/_ca;
	var _ha=(_6a*(_ba*_x5-_9a*_z5)+_7a*(_8a*_z5-_aa*_x5)+(_aa*_9a-_8a*_ba)*_4a)/_ca;
	var _ia=(_6a*(_ba*_y5-_9a*_A5)+_7a*(_8a*_A5-_aa*_y5)+(_aa*_9a-_8a*_ba)*_5a)/_ca;
	_2a.transform(_da,_ea,_fa,_ga,_ha,_ia);
	_2a.drawImage(_3a,0,0);
	_2a.restore();
}
;
_c7.prototype._0a=
function(_2a,_3a,_4a,_5a,_x5,_y5,_z5,_A5,_6a,_7a,_8a,_9a,_aa,_ba)
{
	_2a.save();
	var _ja,_ka;
	_ja=_4a+(_z5-_x5);
	_ka=_5a+(_A5-_y5);
	_2a.beginPath();
	_2a.moveTo(_4a,_5a);
	_2a.lineTo(_x5,_y5);
	_2a.lineTo(_z5,_A5);
	_2a.lineTo(_ja,_ka);
	_2a.closePath();
	_2a.clip();
	var _ca=_6a*(_ba-_9a)-_8a*_ba+_aa*_9a+(_8a-_aa)*_7a;
	if(_ca==0)
	{
		return;
	}
	var _da=-(_7a*(_z5-_x5)-_9a*_z5+_ba*_x5+(_9a-_ba)*_4a)/_ca;
	var _ea=(_9a*_A5+_7a*(_y5-_A5)-_ba*_y5+(_ba-_9a)*_5a)/_ca;
	var _fa=(_6a*(_z5-_x5)-_8a*_z5+_aa*_x5+(_8a-_aa)*_4a)/_ca;
	var _ga=-(_8a*_A5+_6a*(_y5-_A5)-_aa*_y5+(_aa-_8a)*_5a)/_ca;
	var _ha=(_6a*(_ba*_x5-_9a*_z5)+_7a*(_8a*_z5-_aa*_x5)+(_aa*_9a-_8a*_ba)*_4a)/_ca;
	var _ia=(_6a*(_ba*_y5-_9a*_A5)+_7a*(_8a*_A5-_aa*_y5)+(_aa*_9a-_8a*_ba)*_5a)/_ca;
	_2a.transform(_da,_ea,_fa,_ga,_ha,_ia);
	_2a.drawImage(_3a,0,0);
	_2a.restore();
}
;
_c7.prototype._k7=
function(slot,_n3,alpha,_q8)
{
	var _W3=slot.attachment,vertices=[],uvs;
	var _Z9=0;
	var __9=0;
	if(slot.skeleton)
	{
		_Z9=slot.skeleton.x;
		__9=slot.skeleton.y;
	}
	else if(slot.bone.skeleton)
	{
		_Z9=slot.bone.skeleton.x;
		__9=slot.bone.skeleton.y;
	}
	_W3._N8(slot.bone,vertices,0,2);
	uvs=_W3.uvs;
	var _K7=_G3[_W3._W3._O8.texture._L3];
	if(!_K7.complete)return;
	if(!_K7._R7)_Q7(
	{
		texture:_K7	}
	);
	var _J8=6;
	var _G9=_i7._H9(_d9._I9,_K7._R7,_i7._J9,_J8);
	var _K9=_G9._L9()>>2;
	var index=_K9*_G9._M9;
	_G9._M9+=_J8;
	var _N9=_G9._O9;
	var _P9=_G9._Q9;
	var _R9=_G9._S9;
	var _T9=index;
	var _la=_T9+_K9;
	var _04=_la+_K9;
	var _ma=_04+_K9;
	var _na=_ma+_K9;
	var _oa=_na+_K9;
	_N9[_T9+0]=_N9[_oa+0]=vertices[_27];
	_N9[_T9+1]=_N9[_oa+1]=vertices[_37];
	_N9[_la+0]=vertices[_47];
	_N9[_la+1]=vertices[_57];
	_N9[_04+0]=_N9[_ma+0]=vertices[_67];
	_N9[_04+1]=_N9[_ma+1]=vertices[_77];
	_N9[_na+0]=vertices[_07];
	_N9[_na+1]=vertices[_17];
	_N9[_T9+2]=_N9[_la+2]=_N9[_04+2]=_N9[_ma+2]=_N9[_na+2]=_N9[_oa+2]=_X9;
	_P9[_T9]=_P9[_la]=_P9[_04]=_P9[_ma]=_P9[_na]=_P9[_oa]=_n3;
	_R9[_T9+0]=_R9[_oa+0]=uvs[_27];
	_R9[_T9+1]=_R9[_oa+1]=uvs[_37];
	_R9[_la+0]=uvs[_47];
	_R9[_la+1]=uvs[_57];
	_R9[_04+0]=_R9[_ma+0]=uvs[_67];
	_R9[_04+1]=_R9[_ma+1]=uvs[_77];
	_R9[_na+0]=uvs[_07];
	_R9[_na+1]=uvs[_17];
}
;
_c7.prototype._m7=
function(slot,_n3,alpha)
{
	var _S8=slot.attachment,vertices=[],uvs;
	var _Z9=0;
	var __9=0;
	if(slot.skeleton)
	{
		_Z9=slot.skeleton.x;
		__9=slot.skeleton.y;
	}
	else if(slot.bone.skeleton)
	{
		_Z9=slot.bone.skeleton.x;
		__9=slot.bone.skeleton.y;
	}
	_S8._N8(slot,0,_S8._T8,vertices,0,2);
	uvs=_S8.uvs;
	var _K7=_G3[_S8._W3._O8.texture._L3];
	if(!_K7.complete)return;
	if(!_K7._R7)_Q7(
	{
		texture:_K7	}
	);
	var _J8=_S8.triangles.length;
	var _G9=_i7._H9(_d9._I9,_K7._R7,_i7._J9,_J8);
	var _K9=_G9._L9()>>2;
	var index=_K9*_G9._M9;
	_G9._M9+=_J8;
	var _N9=_G9._O9;
	var _P9=_G9._Q9;
	var _R9=_G9._S9;
	var _T9=index;
	for(var _u5=0;_u5<_J8;
_u5++,_T9+=_K9)
	{
		var _09=_S8.triangles[_u5];
		_N9[_T9+0]=vertices[(_09*2)+0];
		_N9[_T9+1]=vertices[(_09*2)+1];
		_N9[_T9+2]=_X9;
		_P9[_T9+0]=_P9[_T9+1]=_n3;
		_R9[_T9+0]=uvs[(_09*2)+0];
		_R9[_T9+1]=uvs[(_09*2)+1];
	}
}
;
_c7.prototype._i8=
function(slot,_r4,_s4)
{
	var _W3=slot.attachment,vertices=[];
	_W3._N8(slot.bone,vertices,0,2);
	var _pa,_qa,_ra,_sa;
	var _ta;
	_pa=_r4-vertices[_07];
	_qa=_s4-vertices[_17];
	_ra=vertices[_27]-vertices[_07];
	_sa=vertices[_37]-vertices[_17];
	_ta=(_pa*_sa)-(_qa*_ra);
	if(_ta>=0)return false;
	_pa=_r4-vertices[_47];
	_qa=_s4-vertices[_57];
	_ra=vertices[_67]-vertices[_47];
	_sa=vertices[_77]-vertices[_57];
	_ta=(_pa*_sa)-(_qa*_ra);
	if(_ta>=0)return false;
	_pa=_r4-vertices[_27];
	_qa=_s4-vertices[_37];
	_ra=vertices[_47]-vertices[_27];
	_sa=vertices[_57]-vertices[_37];
	_ta=(_pa*_sa)-(_qa*_ra);
	if(_ta>=0)return false;
	_pa=_r4-vertices[_67];
	_qa=_s4-vertices[_77];
	_ra=vertices[_07]-vertices[_67];
	_sa=vertices[_17]-vertices[_77];
	_ta=(_pa*_sa)-(_qa*_ra);
	if(_ta>=0)return false;
	return true;
}
;
_c7.prototype._k8=
function(slot,_r4,_s4)
{
	var _S8=slot.attachment,vertices=[];
	_S8._N8(slot,0,_S8._T8,vertices,0,2);
	var _pa,_qa,_ra,_sa;
	var _ta;
	var _K8=_S8.triangles.length;
	for(var _u5=0;_u5<_K8;_u5+=3)
	{
		var _09=_S8.triangles[_u5+0];
		var _19=_S8.triangles[_u5+1];
		var _29=_S8.triangles[_u5+2];
		var _ua=vertices[(_09*2)+0];
		var _va=vertices[(_09*2)+1];
		var _wa=vertices[(_19*2)+0];
		var _xa=vertices[(_19*2)+1];
		var _ya=vertices[(_29*2)+0];
		var _za=vertices[(_29*2)+1];
		_pa=_r4-_ua;
		_qa=_s4-_va;
		_ra=_wa-_ua;
		_sa=_xa-_va;
		_ta=(_pa*_sa)-(_qa*_ra);
		if(_ta>=0)continue;
		_pa=_r4-_wa;
		_qa=_s4-_xa;
		_ra=_ya-_wa;
		_sa=_za-_xa;
		_ta=(_pa*_sa)-(_qa*_ra);
		if(_ta>=0)continue;
		_pa=_r4-_ya;
		_qa=_s4-_za;
		_ra=_ua-_ya;
		_sa=_va-_za;
		_ta=(_pa*_sa)-(_qa*_ra);
		if(_ta>=0)continue;
		return true;
	}
	return false;
}
;
_c7.prototype._m8=
function(slot,_r4,_s4)
{
	var _Aa=slot.attachment,vertices=[];
	_Aa._N8(slot,0,_Aa._T8,vertices,0,2);
	var _pa,_qa,_ra,_sa;
	var _ta;
	var _Ba=0;
	for(var _u5=0;_u5<((_Aa._T8)/2)-1;_u5++)
	{
		var _ua=vertices[_Ba+0];
		var _va=vertices[_Ba+1];
		_Ba+=2;
		var _wa=vertices[_Ba+0];
		var _xa=vertices[_Ba+1];
		_pa=_r4-_ua;
		_qa=_s4-_va;
		_ra=_wa-_ua;
		_sa=_xa-_va;
		_ta=(_pa*_sa)-(_qa*_ra);
		if(_ta<=0)
		{
			return false;
		}
	}
	var _ua=vertices[_Ba+0];
	var _va=vertices[_Ba+1];
	var _wa=vertices[0];
	var _xa=vertices[1];
	_pa=_r4-_ua;
	_qa=_s4-_va;
	_ra=_wa-_ua;
	_sa=_xa-_va;
	_ta=(_pa*_sa)-(_qa*_ra);
	if(_ta<=0)
	{
		return false;
	}
	return true;
}
;
_c7.prototype._Ca=
function(_U6)
{
	for(var _u5=0;_u5<this._42.animations.length;_u5++)
	{
		ds_list_add(_U6,this._42.animations[_u5].name);
	}
}
;
_c7.prototype._Da=
function(_U6)
{
	for(var _u5=0;_u5<this._42.skins.length;_u5++)
	{
		ds_list_add(_U6,this._42.skins[_u5].name);
	}
}
;
_c7.prototype._Ea=
function(_U6)
{
	for(var _u5=0;_u5<this._42.bones.length;_u5++)
	{
		ds_list_add(_U6,this._42.bones[_u5].name);
	}
}
;
_c7.prototype._Fa=
function(_U6)
{
	for(var _u5=0;_u5<this._42.slots.length;_u5++)
	{
		ds_list_add(_U6,this._42.slots[_u5].name);
	}
}
;
_c7.prototype._T6=
function(_U6)
{
	for(var _u5=0;_u5<this._42.slots.length;_u5++)
	{
		var _V6=this._42.slots[_u5];
		var map=ds_map_create();
		ds_map_add(map,"name",_V6.name);
		ds_map_add(map,"bone",_V6._W6.name);
		ds_map_add(map,"attachment",_V6._Ga?_V6._Ga:"(none)");
		ds_list_add(_U6,map);
	}
}
;
_c7.prototype._Ha=
function(_53)
{
	var _V6=this._42._73(_53);
	if(_V6===null)
	{
		return [];
	}
	var _Ia=[];
	for(var _a3=0;_a3<this._42.skins.length;_a3++)
	{
		var skin=this._42.skins[_a3];
		var _Ja=[];
		skin._Ka(_V6.index,_Ja);
		for(var i=0;i<_Ja.length;++i)
		{
			_Ia.push(_Ja[i].name);
		}
	}
	_Ia=_Ia.filter(
function(value,index,_La)
	{
		return _La.indexOf(value)===index;
	}
	);
	return _Ia;
}
;
var _Ma=1,_Na=2,_Oa=3,_Pa=4,_Qa=5,_Ra=6,_Sa=7;

function _Ta(_Ua)
{
	switch(_Ua)
	{
		case _Ma:return _d9._Va;
		case _Na:return _d9._Wa;
		case _Oa:return _d9._Xa;
		case _Pa:return _d9._I9;
		case _Qa:return _d9._Ya;
		case _Ra:return _d9._Za;
		case _Sa:return _d9._I9;
	}
	return -1;
}
var draw_primitive_begin,draw_primitive_begin_texture,draw_vertex,draw_vertex_color,draw_vertex_colour,draw_vertex_texture,draw_vertex_texture_color,draw_vertex_texture_colour,draw_primitive_end;
(()=>
{
	let __a=(_O2)=>()=>_0b(_O2);
	draw_primitive_begin=__a("draw_primitive_begin");
	draw_primitive_begin_texture=__a("draw_primitive_begin_texture");
	draw_vertex=__a("draw_vertex");
	draw_vertex_color=__a("draw_vertex_color");
	draw_vertex_colour=draw_vertex_color;
	draw_vertex_texture=__a("draw_vertex_texture");
	draw_vertex_texture_color=__a("draw_vertex_texture_color");
	draw_vertex_texture_colour=draw_vertex_texture_color;
	draw_primitive_end=__a("draw_primitive_end");
}
)();
var _1b=0,_2b=-1,_3b=null,_4b=null;

function _5b()
{
	draw_primitive_begin=_6b;
	draw_primitive_begin_texture=_7b;
	draw_vertex=_8b;
	draw_vertex_color=_9b;
	draw_vertex_colour=_9b;
	draw_vertex_texture=_ab;
	draw_vertex_texture_color=_bb;
	draw_vertex_texture_colour=_bb;
	draw_primitive_end=_cb;
}

function _db()
{
	_1b=0;
	_2b=-1;
	_3b=null;
	_4b=null;
}

function _6b(_eb)
{
	_7b(yyGetInt32(_eb),-1);
}

function _7b(_eb,_s7)
{
	_1b=yyGetInt32(_eb);
	_2b=null;
	_3b=null;
	if(typeof(_s7)=="object")
	{
		_2b=_s7._fb;
		_3b=_s7._gb;
	}
	else if((_s7!=-1)&&_G3[yyGetInt32(_s7)])
	{
		_2b=_G3[yyGetInt32(_s7)];
	}
	if(_2b&&!_2b._R7)
	{
		_Q7(
		{
			texture:_2b		}
		);
	}
	_4b=new _hb(_ib,_i7._jb(_i7._J9),false);
}

function _8b(_r4,_s4)
{
	var _K9=_4b._L9()>>2;
	var index=_4b._M9*_K9;
	_4b._kb(1);
	_4b._O9[index+0]=yyGetReal(_r4);
	_4b._O9[index+1]=yyGetReal(_s4);
	_4b._O9[index+2]=_X9;
	_4b._S9[index+0]=0;
	_4b._S9[index+1]=0;
	_4b._Q9[index]=((_lb*255.0)<<24)|(_mb&0x00ffffff);
}

function _9b(_r4,_s4,_nb,_y8)
{
	var _K9=_4b._L9()>>2;
	var index=_4b._M9*_K9;
	_4b._kb(1);
	_4b._O9[index+0]=yyGetReal(_r4);
	_4b._O9[index+1]=yyGetReal(_s4);
	_4b._O9[index+2]=_X9;
	_4b._S9[index+0]=0;
	_4b._S9[index+1]=0;
	_4b._Q9[index]=((yyGetReal(_y8)*255.0)<<24)|_ob(yyGetInt32(_nb));
}

function _ab(_r4,_s4,_pb,_qb)
{
	var _K9=_4b._L9()>>2;
	var index=_4b._M9*_K9;
	_4b._kb(1);
	_4b._O9[index+0]=yyGetReal(_r4);
	_4b._O9[index+1]=yyGetReal(_s4);
	_4b._O9[index+2]=_X9;
	var _rb=_sb(yyGetReal(_pb),yyGetReal(_qb));
	_4b._S9[index+0]=_rb._Y3;
	_4b._S9[index+1]=_rb._Z3;
	_4b._Q9[index]=((_lb*255.0)<<24)|(_mb&0x00ffffff);
}

function _bb(_r4,_s4,_pb,_qb,_nb,_y8)
{
	var _K9=_4b._L9()>>2;
	var index=_4b._M9*_K9;
	_4b._kb(1);
	_4b._O9[index+0]=yyGetReal(_r4);
	_4b._O9[index+1]=yyGetReal(_s4);
	_4b._O9[index+2]=_X9;
	var _rb=_sb(yyGetReal(_pb),yyGetReal(_qb));
	_4b._S9[index+0]=_rb._Y3;
	_4b._S9[index+1]=_rb._Z3;
	_4b._Q9[index]=((yyGetReal(_y8)*255.0)<<24)|_ob(yyGetInt32(_nb));
}

function _cb()
{
	var _tb=_Ta(_1b);
	if(_tb==-1)
	{
		return;
	}
	var _ub=_4b._vb.subarray(0,_4b._M9*_4b._L9());
	var _wb=_2b?_2b._R7:null;
	var _G9=_i7._H9(_tb,_wb,_i7._J9,_4b._M9);
	_G9._vb.set(_ub,_G9._M9*_G9._L9());
	_G9._M9+=_4b._M9;
}

function _sb(_pb,_qb)
{
	if(_3b&&_2b)
	{
		return(
		{
			_Y3:(_3b.x+(_pb*_3b.CropWidth))/_2b._xb,_Z3:(_3b.y+(_qb*_3b.CropHeight))/_2b._yb		}
		);
	}
	else 
	{
		return(
		{
			_Y3:_pb,_Z3:_qb		}
		);
	}
}
;
/*@constructor */
function _zb(_Ab)
{
	var _Bb=null,_Cb=null,_Db=null,_Eb=false,_Fb=null,_Gb;
	var _Hb=0,_Ib=0,_Jb=0,_Kb=0;
	var _Lb=this;
	(
function()
	{
		_Bb=new ArrayBuffer(_Ab);
		_Cb=new DataView(_Bb);
	}
	)();

	function _Mb(_Nb,_Ob)
	{
		var _Pb=false;
		var _Qb=_Fb._Rb;
		for(var i=0;i<_Qb.length;i++)
		{
			var _Sb=_Qb[i];
			if(((_Nb==-1)||(_Sb._Tb==_Nb))&&(_Sb.type==_Ob))
			{
				_Pb=true;
				if((_Sb._Ub&_Hb)===0)
				{
					var _Vb=(_Kb+_Sb.offset);
					_Hb|=_Sb._Ub;
					if(_Fb._Wb===_Hb)
					{
						_Hb=0;
						_Ib++;
						_Kb+=_Fb._Xb;
						if((_Kb+_Fb._Xb)>=_Bb.byteLength)
						{
							_Lb._Yb(_Bb.byteLength*2);
						}
					}
					return _Vb;
				}
			}
		}
		if(_Pb)
		{
			debug("VERTEX BUILDER: element already written, must write the whole vertex first\n\n",true);
			return -1;
		}
		debug("VERTEX BUILDER: Vertex format does not contain selected type.\n\n",true);
		return -1;
	}
	;
	/*@this {yyVBufferBuilder} */this._Yb=
function(_Ab)
	{
		if(_Bb.byteLength!=_Ab)
		{
			var _Zb=new ArrayBuffer(_Ab);
			var __b=new Int8Array(_Bb);
			var _0c=new Int8Array(_Zb);
			_0c.set(__b);
			_Bb=_Zb;
			_Cb=new DataView(_Bb);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._1c=
function(_2c)
	{
		_Hb=0;
		_Ib=0;
		_Jb=0;
		_Kb=0;
		_Gb=_2c;
		_Fb=_i7._jb(_2c);
		if(_Fb._Xb>_Bb.byteLength)
		{
			this._Yb(_Fb._Xb*36);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._3c=
function()
	{
	}
	;
	this._4c=
function()
	{
		return _Gb;
	}
	;
	this._5c=
function(_6c)
	{
		_Gb=_6c;
		_Fb=_i7._jb(_6c);
	}
	;
	this._7c=
function()
	{
		return _i7._jb(_Gb);
	}
	;
	/*@this {yyVBufferBuilder} */this._8c=
function(x,y)
	{
		var _Vb=_Mb(_d9._9c,_d9._ac);
		if(_Vb>=0)
		{
			_Cb.setFloat32(_Vb,x,true);
			_Cb.setFloat32(_Vb+4,y,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._bc=
function(x,y,z)
	{
		var _Vb=_Mb(_d9._9c,_d9._cc);
		if(_Vb>=0)
		{
			_Cb.setFloat32(_Vb,x,true);
			_Cb.setFloat32(_Vb+4,y,true);
			_Cb.setFloat32(_Vb+8,z,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._dc=
function(_ec,_y8)
	{
		var _Vb=_Mb(_d9._fc,_d9._gc);
		if(_Vb>=0)
		{
			var _hc=((_y8*255.0)<<24)|_ob(_ec);
			_Cb.setUint32(_Vb,_hc,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._ic=
function(_jc)
	{
		var _Vb=_Mb(_d9._fc,_d9._gc);
		if(_Vb>=0)
		{
			var _n3=((_jc&0xff)<<24)|((_jc&0xff00)<<8)|((_jc&0xff0000)>>8)|((_jc&0xff000000)>>24);
			_Cb.setUint32(_Vb,_n3,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._kc=
function(_lc)
	{
		var _Vb=_Mb(_d9._fc,_d9._gc);
		if(_Vb>=0)
		{
			var _n3=(_lc&0xff000000)|((_lc&0xff)<<16)|(_lc&0xff00)|((_lc&0xff0000)>>16);
			_Cb.setUint32(_Vb,_n3,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._mc=
function(_Y3,_Z3)
	{
		var _Vb=_Mb(_d9._nc,_d9._ac);
		if(_Vb>=0)
		{
			_Cb.setFloat32(_Vb,_Y3,true);
			_Cb.setFloat32(_Vb+4,_Z3,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._oc=
function(x,y,z)
	{
		var _Vb=_Mb(_d9._pc,_d9._cc);
		if(_Vb>=0)
		{
			_Cb.setFloat32(_Vb,x,true);
			_Cb.setFloat32(_Vb+4,y,true);
			_Cb.setFloat32(_Vb+8,z,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._qc=
function(x)
	{
		var _Vb=_Mb(-1,_d9._rc);
		if(_Vb>=0)
		{
			_Cb.setFloat32(_Vb,x,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._sc=
function(x,y)
	{
		var _Vb=_Mb(-1,_d9._ac);
		if(_Vb>=0)
		{
			_Cb.setFloat32(_Vb,x,true);
			_Cb.setFloat32(_Vb+4,y,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._tc=
function(x,y,z)
	{
		var _Vb=_Mb(-1,_d9._cc);
		if(_Vb>=0)
		{
			_Cb.setFloat32(_Vb,x,true);
			_Cb.setFloat32(_Vb+4,y,true);
			_Cb.setFloat32(_Vb+8,z,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._uc=
function(x,y,z,w)
	{
		var _Vb=_Mb(-1,_d9._vc);
		if(_Vb>=0)
		{
			_Cb.setFloat32(_Vb,x,true);
			_Cb.setFloat32(_Vb+4,y,true);
			_Cb.setFloat32(_Vb+8,z,true);
			_Cb.setFloat32(_Vb+12,w,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._wc=
function(x,y,z,w)
	{
		var _Vb=_Mb(-1,_d9._xc);
		if(_Vb>=0)
		{
			_Cb.setUint8(_Vb,x,true);
			_Cb.setUint8(_Vb+1,y,true);
			_Cb.setUint8(_Vb+2,z,true);
			_Cb.setUint8(_Vb+3,w,true);
		}
	}
	;
	/*@this {yyVBufferBuilder} */this._yc=
function()
	{
		var _zc=new _hb(_Ib,_Fb,false);
		var _Ac=_Ib*_Fb._Xb;
		var _Bc=new Int8Array(_Bb,0,_Ac);
		_zc._vb.set(_Bc);
		_zc._M9+=_Ib;
		_zc._yc();
		_Db=_zc;
		_Eb=true;
		_Bb=null;
		_Cb=null;
	}
	;
	/*@this {yyVBufferBuilder} */this._Cc=
function(_Dc,_Ec,_Fc,_Gc)
	{
		if(_Fc===undefined)_Fc=0;
		if(_Gc===undefined)_Gc=-1;
		if(_Fc<0)
		{
			_I3("vertex_submit_ext: offset cannot be a negative number!");
			return;
		}
		var vertexCount=(_Gc<0)?_Ib:_Gc;
		if(_Fc+vertexCount>_Ib)
		{
			vertexCount=_Ib-_Fc;
		}
		if(vertexCount<=0)
		{
			return;
		}
		if(_Eb)
		{
			if(_Ec==-1)
			{
				_i7._Hc(_Dc,null,_Db,_Fc,vertexCount);
			}
			else 
			{
				if(_Ec&&!_Ec._fb._R7)
				{
					_Q7(_Ec._gb);
					if(!_Ic(_Ec._fb._R7))
					{
						_I3("vertex_submit: trying to use an invalid texture");
						return;
					}
				}
				_i7._Hc(_Dc,_Ec._fb._R7,_Db,_Fc,vertexCount);
			}
		}
		else 
		{
			var _G9;
			if(_Ec==-1)
			{
				_G9=_i7._H9(_Dc,null,_Gb,vertexCount);
			}
			else 
			{
				if(_Ec&&!_Ec._fb._R7)
				{
					_Q7(_Ec._gb);
					if(!_Ic(_Ec._fb._R7))
					{
						_I3("vertex_submit: trying to use an invalid texture");
						return;
					}
				}
				_G9=_i7._H9(_Dc,_Ec._fb._R7,_Gb,vertexCount);
			}
			var _Jc=_G9._M9*_Fb._Xb;
			var _Bc=new Int8Array(_Bb,_Fc*_Fb._Xb,vertexCount*_Fb._Xb);
			_G9._vb.set(_Bc,_Jc);
			_G9._M9+=vertexCount;
		}
	}
	;
	this._Kc=
function(_Lc)
	{
		_Ib=_Lc;
		_Jb=0;
		_Kb=_Lc*_Fb._Xb;
	}
	;
	this._Mc=
function()
	{
		return _Ib;
	}
	;
	this._Nc=
function()
	{
		return _Bb;
	}
	;
	this._Oc=
function()
	{
		return _Eb;
	}
	;
}
var _Pc=null;
var _Qc=[];
/*@constructor */
function _Rc()
{
	var _Sc=0,_Tc=0.5;
	var _Uc;
	var _Vc=[];
	var _Wc=[];
	var _Xc=[];
	var _Yc=_Sc;
	var _Zc=_Tc;
	Object.defineProperties(this,
	{
		__c:
		{
			get :
function()
			{
				return _Yc;
			}
			,set :
function(_0d)
			{
				_Yc=_0d;
			}
		}
		,_1d:
		{
			get :
function()
			{
				return _Zc;
			}
			,set :
function(_0d)
			{
				_Zc=_0d;
			}
		}
	}
	);
	/*@this {yyGamePad} */this._2d=
function(_3d)
	{
		_Uc=_3d.id;
		_Wc=_Vc.slice();
		_Xc=_3d.axes.slice();
		var _4d=_3d.buttons;
		if(_4d)
		{
			for(var _h3 in _4d)
			{
				if(!_4d.hasOwnProperty(_h3))continue;
				if(typeof(_4d[_h3])==="object")
				{
					_Vc[_h3]=_4d[_h3].value;
				}
				else 
				{
					_Vc[_h3]=_4d[_h3];
				}
			}
		}
	}
	;
	/*@this {yyGamePad} */this._5d=
function()
	{
		return _Uc||"";
	}
	;
	/*@this {yyGamePad} */this._6d=
function()
	{
		if(_Vc)
		{
			return _Vc.length;
		}
		return 0;
	}
	;
	/*@this {yyGamePad} */this._7d=
function(_8d)
	{
		var _9d=_Vc[_8d];
		var _ad=_Wc[_8d];
		if((_9d!==undefined)&&(_ad!==undefined))
		{
			return((_9d>=_Zc)&&(_ad<_Zc));
		}
		return false;
	}
	;
	/*@this {yyGamePad} */this._bd=
function(_8d)
	{
		var _9d=_Vc[_8d];
		var _ad=_Wc[_8d];
		if((_9d!==undefined)&&(_ad!==undefined))
		{
			return((_9d<_Zc)&&(_ad>=_Zc));
		}
		return false;
	}
	;
	/*@this {yyGamePad} */this._cd=
function(_8d)
	{
		var _9d;
		if(typeof(_Vc[_8d])==="object")
		{
			_9d=_Vc[_8d].value;
		}
		else 
		{
			_9d=_Vc[_8d];
		}
		if(_9d!==undefined)
		{
			return(_9d>=_Zc);
		}
		return false;
	}
	;
	/*@this {yyGamePad} */this._dd=
function(_8d)
	{
		var _9d;
		if(typeof(_Vc[_8d])==="object")
		{
			_9d=_Vc[_8d].value;
		}
		else 
		{
			_9d=_Vc[_8d];
		}
		return _9d||0.0;
	}
	;
	/*@this {yyGamePad} */this._ed=
function()
	{
		if(_Xc)
		{
			return _Xc.length;
		}
		return 0;
	}
	;
	/*@this {yyGamePad} */this._fd=
function(_gd,_hd)
	{
		var _id=_Xc[_gd]||0;
		if(_Yc>0.0)
		{
			var _jd=Math.abs(_id);
			if(_jd<_Yc)
			{
				_id=0.0;
			}
			else 
			{
				var sign=(_id>=0)?1.0:-1.0;
				_id=((_jd-_Yc)/(_hd-_Yc))*sign;
			}
		}
		return _id;
	}
	;
}
/*@constructor */
function _kd()
{
	var _ld=1.0,_md=1.0;
	var _nd=0,_od=1;
	var _pd=0x8000,_qd=0x8001,_rd=0x8002,_sd=0x8003,_td=0x8004,_ud=0x8005,_vd=0x8006,_wd=0x8007,_xd=0x8008,_yd=0x8009,_zd=0x800A,_Ad=0x800B,_Bd=0x800C,_Cd=0x800D,_Dd=0x800E,_Ed=0x800F,_Fd=0x8010,_Gd=0x8011,_Hd=0x8012,_Id=0x8013,_Jd=0x8014;
	var _Kd=0,_Ld=1,_Md=2,_Nd=3,_Od=4,_Pd=5,_Qd=6,_Rd=7,_Sd=8,_Td=9,_Ud=10,_Vd=11,_Wd=12,_Xd=13,_Yd=14,_Zd=15;
	var __d=0,_0e=1,_1e=2,_2e=3;

	function _3e()
	{
		var api=null;
		try
		{
			api=_4e();
		}
		catch(err)
		{
			console.log("Failed to initialize the Gamepad API: "+err);
		}
		return(api!==null);
	}

	function _4e()
	{
		if(navigator["getGamepads"])
		{
			return navigator["getGamepads"]();
		}
		if(navigator["webkitGetGamepads"])
		{
			return navigator["webkitGetGamepads"]();
		}
		if(navigator["webkitGamepads"])
		{
			return navigator["webkitGamepads"]();
		}
		return null;
	}
	var _5e=_3e()?_od:_nd;
	var _6e=[];

	function _7e()
	{
		var gamepads=_4e();
		if(gamepads!==null)
		{
			var _8e=0;
			for(_8e=0;_8e<gamepads.length;++_8e)
			{
				var _9e=gamepads[_8e];
				if(!_9e&&_6e[_8e])
				{
					_6e[_8e]=undefined;
					var _ae=_be._ce(undefined,undefined,_de,undefined);
					_ae.event_type="gamepad lost";
					_ae._ee=_8e;
					_ae._fe=0;
					_ae._ge=true;
				}
				else 
				{
					if(_9e&&!_6e[_8e])
					{
						_6e[_8e]=new _Rc();
						if(_Qc[_8e]!==undefined)
						{
							_6e[_8e].__c=_Qc[_8e];
						}
						var _ae=_be._ce(undefined,undefined,_de,undefined);
						_ae.event_type="gamepad discovered";
						_ae._ee=_8e;
						_ae._fe=0;
						_ae._ge=true;
					}
					if(_6e[_8e])
					{
						_6e[_8e]._2d(_9e);
					}
				}
			}
		}
	}

	function _he(_8d)
	{
		if(_8d<_pd)
		{
			return _8d;
		}
		switch(_8d)
		{
			case _qd:return _Kd;
			case _rd:return _Ld;
			case _sd:return _Md;
			case _td:return _Nd;
			case _ud:return _Od;
			case _vd:return _Pd;
			case _wd:return _Qd;
			case _xd:return _Rd;
			case _yd:return _Sd;
			case _zd:return _Td;
			case _Ad:return _Ud;
			case _Bd:return _Vd;
			case _Cd:return _Wd;
			case _Dd:return _Xd;
			case _Ed:return _Yd;
			case _Fd:return _Zd;
		}
		return 0;
	}

	function _ie(_gd)
	{
		if(_gd<_pd)
		{
			return _gd;
		}
		switch(_gd)
		{
			case _Gd:return __d;
			case _Hd:return _0e;
			case _Id:return _1e;
			case _Jd:return _2e;
		}
		return 0;
	}

	function _kd()
	{
	}
	/*@this {yyGamepadManager} */this._je=
function()
	{
		return _6e.length;
	}
	;
	/*@this {yyGamepadManager} */this._ke=
function(_le)
	{
		var _me=_6e[_le];
		if(_me)
		{
			return _me._5d();
		}
		return "";
	}
	;
	/*@this {yyGamepadManager} */this._ne=
function()
	{
		return(_5e!==_nd);
	}
	;
	/*@this {yyGamepadManager} */this._1d=
function(_le)
	{
		var _me=_6e[_le];
		if(_me)
		{
			return _me._1d;
		}
		return 0.0;
	}
	;
	/*@this {yyGamepadManager} */this._oe=
function(_le,_pe)
	{
		var _me=_6e[_le];
		if(_me)
		{
			if((_pe>=0.0)&&(_pe<=_ld))
			{
				_me._1d=_pe;
			}
		}
	}
	;
	/*@this {yyGamepadManager} */this.__c=
function(_le)
	{
		var _me=_6e[_le];
		if(_me)
		{
			return _me.__c;
		}
		else if(_Qc[_le]!==undefined)
		{
			return _Qc[_le];
		}
		return 0.0;
	}
	;
	/*@this {yyGamepadManager} */this._qe=
function(_le,_re)
	{
		_Qc[_le]=_re;
		var _me=_6e[_le];
		if(_me)
		{
			if((_re>=0.0)&&(_re<=_md))
			{
				_me.__c=_re;
			}
		}
	}
	;
	/*@this {yyGamepadManager} */this._se=
function()
	{
		_6e=[];
	}
	;
	/*@this {yyGamepadManager} */this._te=
function()
	{
		switch(_5e)
		{
			case _od:_7e();
			break;
			case _nd:default :return;
		}
	}
	;
	/*@this {yyGamepadManager} */this._ue=
function(_le)
	{
		if(_6e[_le]!==null&&_6e[_le]!==undefined)
		{
			return true;
		}
		return false;
	}
	;
	/*@this {yyGamepadManager} */this._6d=
function(_le)
	{
		var _me=_6e[_le];
		if(_me)
		{
			return _me._6d();
		}
		return 0;
	}
	;
	/*@this {yyGamepadManager} */this._ed=
function(_le)
	{
		var _me=_6e[_le];
		if(_me)
		{
			return _me._ed();
		}
		return 0;
	}
	;
	/*@this {yyGamepadManager} */this._cd=
function(_le,_8d)
	{
		var _me=_6e[_le];
		if(_me)
		{
			return _me._cd(_he(_8d),_me._1d);
		}
		return false;
	}
	;
	/*@this {yyGamepadManager} */this._7d=
function(_le,_8d)
	{
		var _me=_6e[_le];
		if(_me)
		{
			return _me._7d(_he(_8d),_me._1d);
		}
		return false;
	}
	;
	/*@this {yyGamepadManager} */this._bd=
function(_le,_8d)
	{
		var _me=_6e[_le];
		if(_me)
		{
			return _me._bd(_he(_8d),_me._1d);
		}
		return false;
	}
	;
	/*@this {yyGamepadManager} */this._dd=
function(_le,_8d)
	{
		var _me=_6e[_le];
		if(_me)
		{
			return _me._dd(_he(_8d));
		}
		return 0;
	}
	;
	/*@this {yyGamepadManager} */this._fd=
function(_le,_gd)
	{
		var _me=_6e[_le];
		if(_me)
		{
			return _me._fd(_ie(_gd),_md);
		}
		return 0;
	}
	;
}
;
var _ve=[];
var _we="None";
var _xe=0;
var _ye=0;
/*@constructor */
function _ze()
{
	this.x=0;
	this.y=0;
	this._cd=0;
	this._7d=0;
	this._bd=0;
	this._Ae=0;
}
;
_ze.prototype._se=
function()
{
	this._cd=0;
	this._7d=0;
	this._bd=0;
	this._Ae=0;
}
;
_ze.prototype._Be=
function(_r4,_s4)
{
	if(_u2)
	{
		var _Ce;
		if(!_u2._De)
		{
			_Ce=_Ee;
		}
		else 
		{
			_Ce=_u2._Fe;
		}
		for(var _Z3=0;_Z3<_Ce.length;_Z3++)
		{
			var _Ge=_Ce[_Z3];
			if(_Ge.visible)
			{
				_He(canvas,_Ie);
				if(((_r4-_Ie.left)>=_Ge._Je)&&((_r4-_Ie.left)<_Ge._Ke)&&((_s4-_Ie.top)>=_Ge._Le)&&((_s4-_Ie.top)<_Ge._Me))
				{
					this.x=_Ge._Ne(_r4,_s4);
					this.y=_Ge._Oe(_r4,_s4);
					return;
				}
			}
		}
	}
	this.x=_r4;
	this.y=_s4;
}
;
/*@constructor */
function _Pe(_Qe,_r4,_s4)
{
	this.id=_Qe;
	this.x=_r4;
	this.y=_s4;
}

function _Re(_Se)
{
	for(var i=0;i<_ve.length;i++)
	{
		if(_ve[i]===_Se)
		{
			return i;
		}
	}
	return -1;
}

function _Te(_Se)
{
	var _Ue=-1;
	for(var i=0;i<_ve.length;i++)
	{
		if((_ve[i]===_Se)||(_ve[i]===-1))
		{
			_Ue=i;
			break;
		}
	}
	if(_Ue==-1)
	{
		_Ue=_ve.length;
	}
	_ve[_Ue]=_Se;
	_Ve[_Ue]=new _ze();
	return _Ue;
}

function _We(event)
{
	for(var _Xe=0;_Xe<event.changedTouches.length;_Xe++)
	{
		var _Ye=event.changedTouches[_Xe];
		var type="";
		var _Ue=-1;
		_we=event.type;
		switch(event.type)
		{
			case "touchstart":_Ue=_Te(_Ye["identifier"]);
			break;
			case "touchend":_Ue=_Re(_Ye["identifier"]);
			_ve[_Ue]=-1;
			break;
			case "touchcancel":_Ue=_Re(_Ye["identifier"]);
			_ve[_Ue]=-1;
			break;
			case "touchmove":_Ue=_Re(_Ye["identifier"]);
			break;
			default :return;
		}
		var _Ze;
		var __e;
		_Ze=_Ye.clientX;
		__e=_Ye.clientY;
		if(_Ue==0)
		{
			if(_0f!=null)
			{
				_1f=_Ze;
				_2f=__e;
			}
			switch(event.type)
			{
				case "touchstart":_3f=1;
				break;
				case "touchmove":_3f=1;
				break;
				case "touchcancel":case "touchend":_3f=0;
				break;
			}
		}
		_Ve[_Ue]._Be(_Ze,__e);
		_4f[_Ue].x=_Ze;
		_4f[_Ue].y=__e;
		switch(event.type)
		{
			case "touchstart":_Ve[_Ue]._cd=1;
			_4f[_Ue]._5f=_6f|_7f|_8f;
			break;
			case "touchcancel":case "touchend":_Ve[_Ue]._cd=0;
			_4f[_Ue]._5f=0;
			break;
			case "touchmove":default :break;
		}
		event.preventDefault();
	}
}

function _9f(e)
{
	var _af=(window["wallpaperMediaIntegration"]||window["wallpaperRegisterAudioListener"]);
	var _Ue=-1;
	var type="";
	var button=0;
	var buttons=0;
	switch(e.type)
	{
		case 'mousemove':_Ue=0;
		button=e.button;
		buttons=e.buttons;
		break;
		case 'touchstart':case 'touchmove':case 'touchend':_We(e);
		break;
		case 'pointerdown':case 'MSPointerDown':_Ue=_Te(e["pointerId"]);
		type="start";
		button=e.button;
		buttons=e.buttons;
		break;
		case 'pointermove':case 'MSPointerMove':case 'pointerover':_Ue=_Re(e["pointerId"]);
		if(_af&&(_Ue==-1))
		{
			_9f(
			{
				"type":'pointerdown',"pointerId":e["pointerId"],"button":1,"buttons":1,"clientX":e.clientX,"clientY":e.clientY,"preventDefault":
function()
				{
				}
			}
			);
			_Ue=_Re(e["pointerId"]);
		}
		button=e.button;
		buttons=e.buttons;
		type="move";
		break;
		case 'pointerup':case 'MSPointerUp':case 'pointercancel':case 'MSPointerCancel':case 'pointerout':case 'MSPointerOut':_Ue=_Re(e["pointerId"]);
		if(_af&&(_Ue==-1))
		{
			_9f(
			{
				"type":'pointerdown',"pointerId":e["pointerId"],"button":1,"buttons":1,"clientX":e.clientX,"clientY":e.clientY,"preventDefault":
function()
				{
				}
			}
			);
			_Ue=_Re(e["pointerId"]);
		}
		type="end";
		button=e.button;
		buttons=e.buttons;
		_ve[_Ue]=-1;
		break;
	}
	if(_Ue>=0)
	{
		var _Ze=e.clientX;
		var __e=e.clientY;
		if(_Ue==0)
		{
			if(_0f!=null)
			{
				_1f=_Ze;
				_2f=__e;
			}
			switch(type)
			{
				case "start":case "move":
				{
					_bf=0;
					if(e.pointerType=="mouse")
					{
						_bf=button;
					}
					if(button!=-1)
					{
						if(_bf==2)_bf=1;
						else if(_bf==1)_bf=2;
						_cf=_bf;
						_df=_bf;
						_3f=buttons;
					}
				}
				break;
				case "end":_3f=0;
				break;
			}
		}
		_Ve[_Ue]._Be(_Ze,__e);
		_4f[_Ue].x=_Ze;
		_4f[_Ue].y=__e;
		switch(type)
		{
			case "start":_Ve[_Ue]._cd=1;
			_4f[_Ue]._5f=_6f|_7f|_8f;
			break;
			case "end":_Ve[_Ue]._cd=0;
			_4f[_Ue]._5f=0;
			break;
			case "move":default :break;
		}
	}
	e.preventDefault();
}

function _ef()
{
	if((window.PointerEvent)||(window.navigator.pointerEnabled)||(window.navigator.msPointerEnabled))
	{
		canvas.addEventListener("pointerdown",_9f,false);
		canvas.addEventListener("pointermove",_9f,false);
		canvas.addEventListener("pointerup",_9f,false);
		canvas.addEventListener("pointercancel",_9f,false);
		canvas.addEventListener("pointerover",_9f,false);
		canvas.addEventListener("pointerout",_9f,false);
		canvas.addEventListener("MSPointerDown",_9f,false);
		canvas.addEventListener("MSPointerMove",_9f,false);
		canvas.addEventListener("MSPointerUp",_9f,false);
		canvas.addEventListener("MSPointerCancel",_9f,false);
		canvas.addEventListener("MSPointerOver",_9f,false);
		canvas.addEventListener("MSPointerOut",_9f,false);
	}
	else 
	{
		canvas.ontouchstart=_We;
		canvas.ontouchmove=_We;
		canvas.ontouchend=_We;
		canvas.ontouchcancel=_We;
	}
	canvas.style.touchAction="none";
}
_ff:(
function(window)
{
	if(!Object.defineProperty)
	{
		throw("Font.js requires Object.defineProperty, which this browser does not support.");
	}
	if(!document.createElement("canvas").getContext)
	{
		throw("Font.js requires <canvas> and the Canvas2D API, which this browser does not support.");
	}
	(
function(window)
	{
		try
		{
			var _i3=new Uint8Array(1);
			return;
		}
		catch(e)
		{
		}

		function subarray(start,end)
		{
			return this.slice(start,end);
		}

		function _gf(_La,offset)
		{
			var i,_u5=_La.length;
			if(arguments.length<2)
			{
				offset=0;
			}
			for(i=0;i<_u5;++i,++offset)
			{
				this[offset]=_La[i]&0xFF;
			}
		}

		function _hf(_if)
		{
			var result,i;
			if(typeof _if==="number")
			{
				result=new Array(_if);
				for(i=0;i<_if;++i)
				{
					result[i]=0;
				}
			}
			else 
			{
				result=_if.slice(0);
			}
			result.subarray=subarray;
			result.buffer=result;
			result.byteLength=result.length;
			result.set =_gf;
			if(typeof _if==="object"&&_if.buffer)
			{
				result.buffer=_if.buffer;
			}
			return result;
		}
		window.Uint8Array=_hf;
		window.Uint32Array=_hf;
		window.Int32Array=_hf;
	}
	(window));
	(
function(window)
	{
		if(window.opera)return;
		if("response" in XMLHttpRequest.prototype||"mozResponseArrayBuffer" in XMLHttpRequest.prototype||"mozResponse" in XMLHttpRequest.prototype||"responseArrayBuffer" in XMLHttpRequest.prototype)
		{
			return;
		}
		var getter;
		if(window.VBArray)
		{
			getter=
function()
			{
				return new Uint8Array(new window.VBArray(this.responseBody)._jf());
			}
			;
		}
		else 
		{
			getter=
function()
			{
				return this.responseBody;
			}
			;
		}
		Object.defineProperty(XMLHttpRequest.prototype,"response",
		{
			get:getter		}
		);
	}
	(window));
	if(!window.btoa)
	{
		window.btoa=
function(data)
		{
			var _kf="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
			var _lf,_mf,_nf,_of,_pf,_qf,_rf,_sf,i=0,_tf=0,_uf="",_vf=[];
			if(!data)
			{
				return data;
			}
			do 
			{
				_lf=data.charCodeAt(i++);
				_mf=data.charCodeAt(i++);
				_nf=data.charCodeAt(i++);
				_sf=_lf<<16|_mf<<8|_nf;
				_of=_sf>>18&0x3f;
				_pf=_sf>>12&0x3f;
				_qf=_sf>>6&0x3f;
				_rf=_sf&0x3f;
				_vf[_tf++]=_kf.charAt(_of)+_kf.charAt(_pf)+_kf.charAt(_qf)+_kf.charAt(_rf);
			}
			while(i<data.length);
			_uf=_vf.join('');
			var _f3=data.length%3;
			return(_f3?_uf.slice(0,_f3-3):_uf)+'==='.slice(_f3||3);
		}
		;
	}

	function Font()
	{
		this._wf="fjs"+(999999*Math.random()|0);
	}
	Font.prototype._xf="";
	Font.prototype._yf="";
	Font.prototype.data="";
	Font.prototype._zf="AAEAAAAKAIAAAwAgT1MvMgAAAAAAAACsAAAAWGNtYXAA"+"AAAAAAABBAAAACxnbHlmAAAAAAAAATAAAAAQaGVhZAAAA"+"AAAAAFAAAAAOGhoZWEAAAAAAAABeAAAACRobXR4AAAAAA"+"AAAZwAAAAIbG9jYQAAAAAAAAGkAAAACG1heHAAAAAAAAA"+"BrAAAACBuYW1lAAAAAAAAAcwAAAAgcG9zdAAAAAAAAAHs"+"AAAAEAAEAAEAZAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+"AAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAABAAMAAQA"+"AAAwABAAgAAAABAAEAAEAAABB//8AAABB////wAABAAAA"+"AAABAAAAAAAAAAAAAAAAMQAAAQAAAAAAAAAAAABfDzz1A"+"AAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAEAAg"+"AAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAA"+"AAAAAAAAAAQAAAAAAAAAAAAAAAAAIAAAAAQAAAAIAAQAB"+"AAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAIAHgADAAEEC"+"QABAAAAAAADAAEECQACAAIAAAAAAAEAAAAAAAAAAAAAAA"+"AAAA==";
	Font.prototype._Af=
	{
		_Bf:0,_Cf:0,_Df:0,_Ef:0,_Ff:400	}
	;
	Font.prototype._Gf=false;
	Font.prototype._Hf=false;
	Font.prototype.onload=
function()
	{
	}
	;
	Font.prototype.onerror=
function()
	{
	}
	;
	Font.prototype.canvas=false;
	Font.prototype.context=false;
	Font.prototype.validate=
function(target,_If,_Jf,font,_Kf)
	{
		if(_Kf!==false&&_Kf<0)
		{
			this.onerror("Requested system font '"+this._wf+"' could not be loaded (it may not be installed).");
			return;
		}
		var _Lf=document.defaultView.getComputedStyle(target,'');
		var width=_Lf.getPropertyValue("width").replace("px",'');
		if(width>0)
		{
			document.head.removeChild(_If);
			document.body.removeChild(target);
			this._Hf=true;
			this.onload();
		}
		else 
		{
			setTimeout(
function()
			{
				font.validate(target,_If,_Jf,font,_Kf===false?false:_Kf-50);
			}
			,50);
		}
	}
	;
	Font.prototype._Mf=
function()
	{
		var instance=this;
		var chr=
function(_0d)
		{
			return String.fromCharCode(_0d);
		}
		;
		var _Nf=
function(_0d)
		{
			if(_0d<256)
			{
				return chr(0)+chr(_0d);
			}
			var _Of=_0d>>8;
			var _Pf=_0d&0xFF;
			return chr(_Of)+chr(_Pf);
		}
		;
		var _Qf=
function(_0d)
		{
			if(_0d<0)
			{
				_0d=0xFFFFFFFF+_0d+1;
			}
			return parseInt(_0d,10).toString(16);
		}
		;
		var _Rf=
function(_Of,_Pf)
		{
			return 256*_Of+_Pf;
		}
		;
		var _Sf=
function(_Of,_Pf)
		{
			var _Tf=_Of>>7===1,_0d;
			_Of=_Of&0x7F;
			_0d=256*_Of+_Pf;
			if(!_Tf)
			{
				return _0d;
			}
			return _0d-0x8000;
		}
		;
		var _Uf=
function(_Of,_Pf,_Vf,_Wf)
		{
			return 16777216*_Of+65536*_Pf+256*_Vf+_Wf;
		}
		;
		var error=
function(_Xf)
		{
			instance.onerror(_Xf);
		}
		;
		var _Yf=chr(0)+chr(1)+chr(0)+chr(0);
		var _Zf="OTTO";
		var data=this.data;
		var version=chr(data[0])+chr(data[1])+chr(data[2])+chr(data[3]);
		var __f=(version===_Yf);
		var _0g=(__f?false:version===_Zf);
		if(__f)
		{
			this._yf="truetype";
		}
		else if(_0g)
		{
			this._yf="opentype";
		}
		else 
		{
			error("Error: file at "+this._xf+" cannot be interpreted as OpenType font.");
			return;
		}
		var _1g=_Rf(data[4],data[5]),_2g=12,ptr,end=_2g+16*_1g,tags=
		{
		}
		,_3g;
		for(ptr=_2g;ptr<end;ptr+=16)
		{
			_3g=chr(data[ptr])+chr(data[ptr+1])+chr(data[ptr+2])+chr(data[ptr+3]);
			tags[_3g]=
			{
				name:_3g,_4g:_Uf(data[ptr+4],data[ptr+5],data[ptr+6],data[ptr+7]),offset:_Uf(data[ptr+8],data[ptr+9],data[ptr+10],data[ptr+11]),length:_Uf(data[ptr+12],data[ptr+13],data[ptr+14],data[ptr+15])			}
			;
		}
		var _5g=
function(_3g)
		{
			if(!tags[_3g])
			{
				error("Error: font is missing the required OpenType '"+_3g+"' table.");
				return false;
			}
			return _3g;
		}
		;
		_3g=_5g("head");
		if(_3g===false)
		{
			return;
		}
		ptr=tags[_3g].offset;
		tags[_3g].version=""+data[ptr]+data[ptr+1]+data[ptr+2]+data[ptr+3];
		var _6g=_Rf(data[ptr+18],data[ptr+19]);
		this._Af._Bf=_6g;
		_3g=_5g("hhea");
		if(_3g===false)
		{
			return;
		}
		ptr=tags[_3g].offset;
		tags[_3g].version=""+data[ptr]+data[ptr+1]+data[ptr+2]+data[ptr+3];
		this._Af._Df=_Sf(data[ptr+4],data[ptr+5])/_6g;
		this._Af._Ef=_Sf(data[ptr+6],data[ptr+7])/_6g;
		this._Af._Cf=_Sf(data[ptr+8],data[ptr+9])/_6g;
		_3g=_5g("OS/2");
		if(_3g===false)
		{
			return;
		}
		ptr=tags[_3g].offset;
		tags[_3g].version=""+data[ptr]+data[ptr+1];
		this._Af._Ff=_Rf(data[ptr+4],data[ptr+5]);
		_3g=_5g("cmap");
		if(_3g===false)
		{
			return;
		}
		ptr=tags[_3g].offset;
		tags[_3g].version=""+data[ptr]+data[ptr+1];
		_1g=_Rf(data[ptr+2],data[ptr+3]);
		var _7g,_8g,_9g,_ag,offset,_bg=false;
		for(_7g=0;_7g<_1g;_7g++)
		{
			_8g=ptr+4+_7g*8;
			_9g=_Rf(data[_8g],data[_8g+1]);
			_ag=_Rf(data[_8g+2],data[_8g+3]);
			offset=_Uf(data[_8g+4],data[_8g+5],data[_8g+6],data[_8g+7]);
			if(_9g===3&&_ag===1)
			{
				_bg=offset;
			}
		}
		var _cg="A";
		this._dg=[];
		if(_bg!==false)
		{
			ptr+=_bg;
			version=_Rf(data[ptr],data[ptr+1]);
			if(version===4)
			{
				var _eg=_Rf(data[ptr+6],data[ptr+7])/2;
				var _fg=
function(chr)
				{
					return [0x0009,0x000A,0x000B,0x000C,0x000D,0x0020,0x0085,0x00A0,0x1680,0x180E,0x2000,0x2001,0x2002,0x2003,0x2004,0x2005,0x2006,0x2007,0x2008,0x2009,0x200A,0x2028,0x2029,0x202F,0x205F,0x3000].indexOf(chr)===-1;
				}
				;
				var i=ptr+14,e=ptr+14+2*_eg,_gg=false;
				for(;i<e;i+=2)
				{
					_gg=_Rf(data[i],data[i+1]);
					if(_fg(_gg))
					{
						break;
					}
					_gg=false;
				}
				var _hg=e+2;
				for(;i<e;i+=2,_hg+=2)
				{
					var _ig=_Rf(data[i],data[i+1]);
					var _jg=_Rf(data[_hg],data[_hg+1]);
					if(_ig!=0xffff)
					{
						for(var _u5=_jg;_u5<=_ig;++_u5)
						{
							this._dg.push(_u5);
						}
					}
				}
				if(_gg!==false)
				{
					_cg=String.fromCharCode(_gg);
					var _kg=-(_gg-1)+65536;
					var _lg=btoa(chr(0)+_Nf(_gg)+_Nf(0xFFFF)+_Nf(0)+_Nf(_gg)+_Nf(0xFFFF)+_Nf(_kg)+_Nf(1));
					this._zf=this._zf.substring(0,380)+_lg+this._zf.substring(380+_lg.length);
				}
			}
		}
		this._mg(_cg,false);
	}
	;
	Font.prototype._mg=
function(_cg,_Kf)
	{
		var _ng=this._wf+" testfont";
		var _og=document.createElement("style");
		_og.setAttribute("type","text/css");
		_og.innerHTML="@font-face {\n"+"  font-family: '"+_ng+"';\n"+"  src: url('data:application/x-font-ttf;base64,"+this._zf+"')\n"+"       format('truetype');}";
		document.head.appendChild(_og);
		var _pg=false;
		if(!this._Gf)
		{
			_pg=this._qg();
			document.head.appendChild(_pg);
		}
		var _rg=document.createElement("p");
		_rg.style.cssText="position: absolute; top: 0; left: 0; opacity: 0;";
		_rg.style._wf="'"+this._wf+"', '"+_ng+"'";
		_rg.innerHTML=_cg+_cg+_cg+_cg+_cg+_cg+_cg+_cg+_cg+_cg;
		document.body.appendChild(_rg);
		if(!document.defaultView.getComputedStyle)
		{
			this.onload();
			_sg("Error: document.defaultView.getComputedStyle is not supported by this browser.\n"+"Consequently, Font.onload() cannot be trusted.");
		}
		else 
		{
			var _tg=this._Gf?1000:this._Af._Bf;
			var canvas=document.createElement("canvas");
			canvas.width=_tg;
			canvas.height=_tg;
			this.canvas=canvas;
			var context=canvas.getContext("2d");
			context.font="1em '"+this._wf+"'";
			context.fillStyle="white";
			context.fillRect(-1,-1,_tg+2,_tg+2);
			context.fillStyle="black";
			context.fillText("test text",50,_tg/2);
			this.context=context;
			var _ug=this;
			var _vg=
function()
			{
				_ug.validate(_rg,_og,_pg,_ug,_Kf);
			}
			;
			setTimeout(_vg,50);
		}
	}
	;
	Font.prototype._wg=
function()
	{
		this._Gf=true;
		this._Af=false;
		this._mg("A",1000);
	}
	;
	Font.prototype._xg=
function()
	{
		var font=this;
		if(this._xf.indexOf(".")===-1)
		{
			setTimeout(
function()
			{
				font._wg();
			}
			,10);
			return;
		}
		var _yg=new XMLHttpRequest();
		_yg.open('GET',font._xf,true);
		_yg.responseType="arraybuffer";
		_yg.onload=
function(_zg)
		{
			var _Ag=_yg.response;
			if(_Ag)
			{
				font.data=new Uint8Array(_Ag);
				font._Mf();
			}
			else 
			{
				font.onerror("Error downloading font resource from "+font._xf);
			}
		}
		;
		_yg.send(null);
	}
	;
	Font.prototype._Bg=false;
	Font.prototype._qg=
function()
	{
		if(this._Bg)
		{
			return this._Bg;
		}
		this._Bg=document.createElement("style");
		this._Bg.type="text/css";
		var _Cg="@font-face {\n";
		_Cg+="  font-family: '"+this._wf+"';\n";
		_Cg+="  src: url('"+this._xf+"') format('"+this._yf+"');\n";
		_Cg+="}";
		this._Bg.innerHTML=_Cg;
		return this._Bg;
	}
	;
	Font.prototype.measureText=
function(_Dg,_Eg)
	{
		if(!this._Hf)
		{
			console.log("Error:measureText() was called while the font was not yet loaded");
			return false;
		}
		this.context.font=_Eg+"px '"+this._wf+"'";
		var _Af=this.context.measureText(_Dg);
		_Af.fontsize=_Eg;
		_Af._Df=0;
		_Af._Ef=0;
		_Af._Fg=
		{
			_Gg:0,_Hg:_Af.width,_Ig:0,_Jg:0		}
		;
		_Af.height=0;
		var _Kg=[],_Lg=_Af.width/this._Af._Bf;
		if(_Lg<=1)
		{
			_Kg.push(_Dg);
		}
		else 
		{
			_Kg.push(_Dg);
		}
		var _Mg=_Kg.length,i;
		for(i=0;i<_Mg;i++)
		{
			this._Ng(_Kg[i],_Eg,_Af);
		}
		return _Af;
	}
	;
	Font.prototype._Ng=
function(_Og,_Eg,_Af)
	{
		var _Pg=
function(_Sb,_Qg)
		{
			return document.defaultView.getComputedStyle(_Sb,null).getPropertyValue(_Qg);
		}
		;
		var i,_05,_Rg,_Sg,_Tg;
		var _Ug=document.createElement("div");
		_Ug.style.position="absolute";
		_Ug.style.opacity=0;
		_Ug.style.font=_Eg+"px '"+this._wf+"'";
		var _Vg=10;
		_Ug.innerHTML=_Og;
		for(i=1;i<_Vg;i++)
		{
			_Ug.innerHTML+="<br/>"+_Og;
		}
		document.body.appendChild(_Ug);
		_Af._Cf=1.2*_Eg;
		var _Wg=_Pg(_Ug,"height");
		_Wg=_Wg.replace("px","");
		if(_Wg>=_Eg*_Vg)
		{
			_Af._Cf=(_Wg/_Vg)|0;
		}
		document.body.removeChild(_Ug);
		if(new RegExp('^\s*$').test(_Og))
		{
			return _Af;
		}
		var canvas=this.canvas,_2a=this.context,_tg=this._Gf?1000:this._Af._Bf,w=_tg,h=_tg,_Xg=_tg/2,padding=50,_Yg=(_tg-_Af.width)/2;
		if(_Yg!==(_Yg|0))
		{
			_Yg=_Yg|0;
		}
		_2a.fillStyle="white";
		_2a.fillRect(-padding,-padding,w+2*padding,h+2*padding);
		_2a.fillStyle="black";
		_2a.fillText(_Og,_Yg,_Xg);
		var _Zg=(_Af.width+padding)|0,__g=4*_Eg,_0h=_Yg-padding/2,_1h=_Xg-__g/2,_2h=_2a.getImageData(_0h,_1h,_Zg,__g).data;
		i=0;
		_05=0;
		_Rg=_Zg*4;
		_Sg=_2h.length;
		_Tg=__g/2;
		while(++i<_Sg&&_2h[i]===255) 
		{
		}
		var _Df=(i/_Rg)|0;
		i=_Sg-1;
		while(--i>0&&_2h[i]===255) 
		{
		}
		var _Ef=(i/_Rg)|0;
		for(i=0,_05=0;_05<_Zg&&_2h[i]===255;)
		{
			i+=_Rg;
			if(i>=_Sg)
			{
				_05++;
				i=(i-_Sg)+4;
			}
		}
		var _Gg=_05;
		var step=1;
		for(i=_Sg-3,_05=0;_05<_Zg&&_2h[i]===255;)
		{
			i-=_Rg;
			if(i<0)
			{
				_05++;
				i=(_Sg-3)-(step++)*4;
			}
		}
		var _Hg=_Zg-_05;
		_Af._Df=(_Tg-_Df);
		_Af._Ef=(_Ef-_Tg);
		_Af._Fg=
		{
			_Gg:_Gg-(padding/2),_Hg:_Hg-(padding/2),_Ig:-_Af._Ef,_Jg:_Af._Df		}
		;
		_Af.height=1+(_Ef-_Df);
		return _Af;
	}
	;
	Object.defineProperty(Font.prototype,"src",
	{
		set:
function(_xf)
		{
			this._xf=_xf;
			this._xg();
		}
	}
	);
	window.Font=Font;
}
(window));
_ff:var _3h,_4h,_5h,_6h,_7h,_8h,_9h;

function ds_set_precision(_ah)
{
	_bh=yyGetReal(_ah);
}
/*@constructor */
function _ch()
{
	this.width=0;
	this.height=0;
	this.body=[];
}
/*@constructor */
function _dh(_eh,_fh)
{
	this._gh=[];
	this._xb=_eh;
	this._yb=_fh;
	var _K5=_eh*_fh;
	for(var i=0;i<_K5;i++)
	{
		this._gh[i]=0;
	}
}
_dh.prototype._hh=
function(_ih)
{
	this._xb=_ih._xb;
	this._yb=_ih._yb;
	this._gh=_ih._gh.slice();
}
;

function ds_grid_create(_eh,_fh)
{
	_eh=yyGetInt32(_eh);
	_fh=yyGetInt32(_fh);
	if(_eh<0||_fh<0)
	{
		_I3("Error: Invalid ds_grid size: ("+_eh+","+_fh+")");
	}
	var _jh=new _dh(_eh,_fh);
	var id=_kh._ce(_jh);
	return id;
}

function ds_grid_destroy(_Qe)
{
	_kh._lh(yyGetInt32(_Qe));
}

function ds_grid_copy(_Qe,_mh)
{
	var _nh=_kh._F4(yyGetInt32(_Qe));
	if(!_nh)
	{
		_I3("Error: invalid dest ds_grid(copy)");
		return;
	}
	var _oh=_kh._F4(yyGetInt32(_mh));
	if(!_oh)
	{
		_I3("Error: invalid source ds_grid(copy)");
		return;
	}
	_nh._hh(_oh);
}

function ds_grid_resize(_Qe,_eh,_fh)
{
	_eh=yyGetInt32(_eh);
	_fh=yyGetInt32(_fh);
	_Qe=yyGetInt32(_Qe);
	if(_eh<0||_fh<0)
	{
		_I3("Error: Can't resize grid to ("+string(_eh)+","+string(_fh)+")");
		return;
	}
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid dest ds_grid(copy)");
		return;
	}
	var _ph=new _dh(_eh,_fh);
	var i=_kh._ce(_ph);
	ds_grid_set_grid_region(i,_Qe,0,0,_jh._xb-1,_jh._yb-1,0,0);
	_kh._lh(i);
	_kh.Set(_Qe,_ph);
}

function ds_grid_width(_Qe)
{
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_width)");
		return;
	}
	return _jh._xb;
}

function ds_grid_height(_Qe)
{
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_height)");
		return;
	}
	return _jh._yb;
}

function ds_grid_clear(_Qe,_C2)
{
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_height)");
		return;
	}
	for(var i=0;i<_jh._gh.length;i++)
	{
		_jh._gh[i]=_C2;
	}
}
var ds_grid_set=_qh;

function _qh(_Qe,_r4,_s4,_C2)
{
	_Qe=yyGetInt32(_Qe);
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_set)");
		return;
	}
	if(_r4<0||_r4>=_jh._xb||_s4<0||_s4>=_jh._yb)
	{
		_I3("Error: grid out of bounds(set) - GridID: "+_Qe+"  size["+_jh._xb+","+_jh._yb+"]  at  ("+_r4+","+_s4+")");
		return;
	}
	_jh._gh[_r4+(_s4*_jh._xb)]=_C2;
}

function _rh(_Qe,_r4,_s4,_C2)
{
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if((_r4<0)||(_r4>=_jh._xb)||(_s4<0)||(_s4>=_jh._yb))
	{
		return;
	}
	_jh._gh[_r4+(_s4*_jh._xb)]=_C2;
}
var ds_grid_set_pre=_sh;

function _sh(_Qe,_r4,_s4,_C2)
{
	_Qe=yyGetInt32(_Qe);
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_set)");
		return _C2;
	}
	if(_r4<0||_r4>=_jh._xb||_s4<0||_s4>=_jh._yb)
	{
		_I3("Error: grid out of bounds(set) - GridID: "+_Qe+"  size["+_jh._xb+","+_jh._yb+"]  at  ("+_r4+","+_s4+")");
		return _C2;
	}
	_jh._gh[_r4+(_s4*_jh._xb)]=_C2;
	return _C2;
}

function _th(_Qe,_r4,_s4,_C2)
{
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if((_r4<0)||(_r4>=_jh._xb)||(_s4<0)||(_s4>=_jh._yb))
	{
		return _C2;
	}
	_jh._gh[_r4+(_s4*_jh._xb)]=_C2;
	return _C2;
}
var ds_grid_set_post=_uh;

function _uh(_Qe,_r4,_s4,_C2)
{
	_Qe=yyGetInt32(_Qe);
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_set)");
		return _C2;
	}
	if(_r4<0||_r4>=_jh._xb||_s4<0||_s4>=_jh._yb)
	{
		_I3("Error: grid out of bounds(set) - GridID: "+_Qe+"  size["+_jh._xb+","+_jh._yb+"]  at  ("+_r4+","+_s4+")");
		return _C2;
	}
	var _r3=_jh._gh[_r4+(_s4*_jh._xb)];
	_jh._gh[_r4+(_s4*_jh._xb)]=_C2;
	return _r3;
}

function _vh(_Qe,_r4,_s4,_C2)
{
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if((_r4<0)||(_r4>=_jh._xb)||(_s4<0)||(_s4>=_jh._yb))
	{
		return _C2;
	}
	var _r3=_jh._gh[_r4+(_s4*_jh._xb)];
	_jh._gh[_r4+(_s4*_jh._xb)]=_C2;
	return _r3;
}

function ds_grid_add(_Qe,_r4,_s4,_C2)
{
	_Qe=yyGetInt32(_Qe);
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_add)");
		return;
	}
	if(_r4<0||_r4>=_jh._xb||_s4<0||_s4>=_jh._yb)
	{
		_I3("Error: grid out of bounds(ds_grid_add): "+_Qe+" ("+_r4+","+_s4+")");
		return;
	}
	var index=_r4+(_s4*_jh._xb);
	var _wh=_jh._gh[index];
	var _xh=typeof(_wh);
	var _yh=typeof(_C2);
	if(_xh==_yh&&(_xh=="number"||_xh=="string"))
	{
		_jh._gh[index]+=_C2;
	}
	else if(_xh!="object"||_yh!="object")
	{
		_jh._gh[index]=_C2;
	}
	else if(_xh!="string"&&_yh!="string")
	{
		_jh._gh[index]=yyGetReal(_wh)+yyGetReal(_C2);
	}
	else _jh._gh[index]=_C2;
}

function ds_grid_multiply(_Qe,_r4,_s4,_C2)
{
	_Qe=yyGetInt32(_Qe);
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_multiply)");
		return;
	}
	if(_r4<0||_r4>=_jh._xb||_s4<0||_s4>=_jh._yb)
	{
		_I3("Error: grid out of bounds(ds_grid_multiply): "+_Qe+" ("+_r4+","+_s4+")");
		return;
	}
	var index=_r4+(_s4*_jh._xb);
	var _wh=_jh._gh[index];
	var _xh=typeof(_wh);
	if(typeof(_C2)=="string"||_xh=="string")return;
	_jh._gh[index]=yyGetReal(_wh)*yyGetReal(_C2);
}

function ds_grid_set_region(_Qe,_X5,_Y5,_p5,_q5,_C2)
{
	_Qe=yyGetInt32(_Qe);
	_X5=yyGetInt32(_X5);
	_Y5=yyGetInt32(_Y5);
	_p5=yyGetInt32(_p5);
	_q5=yyGetInt32(_q5);
	if(_X5>_p5)
	{
		var _K5=_X5;
		_X5=_p5;
		_p5=_K5;
	}
	if(_Y5>_q5)
	{
		var _K5=_Y5;
		_Y5=_q5;
		_q5=_K5;
	}
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_set_region)");
		return;
	}
	var _zh=_I5(0,_J5(_Y5,_q5));
	var _Ah=_J5(_jh._yb-1,_I5(_Y5,_q5));
	var _Bh=_I5(0,_J5(_X5,_p5));
	var _Ch=_J5(_jh._xb-1,_I5(_X5,_p5));
	for(var y=_zh;y<=_Ah;y++)
	{
		for(var x=_Bh;x<=_Ch;x++)
		{
			var index=(y*_jh._xb)+x;
			_jh._gh[index]=_C2;
		}
	}
}

function ds_grid_add_region(_Qe,_X5,_Y5,_p5,_q5,_C2)
{
	_Qe=yyGetInt32(_Qe);
	_X5=yyGetInt32(_X5);
	_Y5=yyGetInt32(_Y5);
	_p5=yyGetInt32(_p5);
	_q5=yyGetInt32(_q5);
	if(_X5>_p5)
	{
		var _K5=_X5;
		_X5=_p5;
		_p5=_K5;
	}
	if(_Y5>_q5)
	{
		var _K5=_Y5;
		_Y5=_q5;
		_q5=_K5;
	}
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_add_region)");
		return;
	}
	if((_X5<0||_X5>=_jh._xb||_Y5<0||_Y5>=_jh._yb)||(_p5<0||_p5>=_jh._xb||_q5<0||_q5>=_jh._yb))
	{
		_I3("Error: region out of bounds(ds_grid_add_region): "+_Qe);
	}
	for(var y=_Y5;y<=_q5;y++)
	{
		var index=(y*_jh._xb)+_X5;
		for(var x=_X5;x<=_p5;x++)
		{
			var _wh=_jh._gh[index];
			var _xh=typeof(_wh);
			var _yh=typeof(_C2);
			if(_xh==_yh&&(_xh=="number"||_xh=="string"))
			{
				_jh._gh[index]+=_C2;
			}
			else if(_xh!="object"||_yh!="object")
			{
				_jh._gh[index]=_C2;
			}
			else if(_xh!="string"&&_yh!="string")
			{
				_jh._gh[index]=yyGetReal(_wh)+yyGetReal(_C2);
			}
			else _jh._gh[index]=_C2;
			index++;
		}
	}
}

function ds_grid_multiply_region(_Qe,_X5,_Y5,_p5,_q5,_C2)
{
	_Qe=yyGetInt32(_Qe);
	_X5=yyGetInt32(_X5);
	_Y5=yyGetInt32(_Y5);
	_p5=yyGetInt32(_p5);
	_q5=yyGetInt32(_q5);
	if(_X5>_p5)
	{
		var _K5=_X5;
		_X5=_p5;
		_p5=_K5;
	}
	if(_Y5>_q5)
	{
		var _K5=_Y5;
		_Y5=_q5;
		_q5=_K5;
	}
	var _jh=_kh._F4(_Qe);
	if(_jh==null||_jh==undefined)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_multiply_region)");
		return;
	}
	if((_X5<0||_X5>=_jh._xb||_Y5<0||_Y5>=_jh._yb)||(_p5<0||_p5>=_jh._xb||_q5<0||_q5>=_jh._yb))
	{
		_I3("Error: region out of bounds(ds_grid_multiply_region): "+_Qe);
	}
	for(var y=_Y5;y<=_q5;y++)
	{
		var index=(y*_jh._xb)+_X5;
		for(var x=_X5;x<=_p5;x++)
		{
			var _wh=_jh._gh[index];
			var _xh=typeof(_wh);
			if(typeof(_C2)=="string"||_xh=="string")continue;
			_jh._gh[index]=yyGetReal(_wh)*yyGetReal(_C2);
			index++;
		}
	}
}

function ds_grid_set_disk(_Qe,_r4,_s4,_Dh,_C2)
{
	_Qe=yyGetInt32(_Qe);
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_Dh=yyGetReal(_Dh);
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_set_disk)");
		return;
	}
	var _x5=0;
	var _y5=0;
	var _z5=0;
	var _A5=0;
	var i=0;
	var _05=0;
	_x5=~~(_I5(0.0,Math.floor(_r4-_Dh)));
	_z5=~~(_J5(_jh._xb-1,Math.ceil(_r4+_Dh)));
	_y5=~~(_I5(0,Math.floor(_s4-_Dh)));
	_A5=~~(_J5(_jh._yb-1,Math.ceil(_s4+_Dh)));
	_Dh=_Dh*_Dh;
	var w=_jh._xb;
	for(i=_x5;i<=_z5;i++)
	{
		var _Eh=(i-_r4)*(i-_r4);
		for(_05=_y5;
_05<=_A5;_05++)
		{
			var _Fh=_05-_s4;
			if(_Eh+(_Fh*_Fh)<=_Dh)
			{
				if(i>=0&&i<_jh._xb&&_05>=0&&_05<_jh._yb)
				{
					_jh._gh[i+(_05*w)]=_C2;
				}
			}
		}
	}
}

function ds_grid_add_disk(_Qe,_r4,_s4,_Dh,_C2)
{
	_Qe=yyGetInt32(_Qe);
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_Dh=yyGetReal(_Dh);
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_set_disk)");
		return;
	}
	var _x5=0;
	var _y5=0;
	var _z5=0;
	var _A5=0;
	var i=0;
	var _05=0;
	_x5=~~(_I5(0.0,Math.floor(_r4-_Dh)));
	_z5=~~(_J5(_jh._xb-1,Math.ceil(_r4+_Dh)));
	_y5=~~(_I5(0,Math.floor(_s4-_Dh)));
	_A5=~~(_J5(_jh._yb-1,Math.ceil(_s4+_Dh)));
	_Dh=_Dh*_Dh;
	var w=_jh._xb;
	for(i=_x5;i<=_z5;i++)
	{
		var _Eh=(i-_r4)*(i-_r4);
		for(_05=_y5;_05<=_A5;_05++)
		{
			var _Fh=_05-_s4;
			if(_Eh+(_Fh*_Fh)<=_Dh)
			{
				if(i>=0&&i<_jh._xb&&_05>=0&&_05<_jh._yb)
				{
					var index=i+(_05*w);
					var _wh=_jh._gh[index];
					var _xh=typeof(_wh);
					var _yh=typeof(_C2);
					if(_xh==_yh&&(_xh=="number"||_xh=="string"))
					{
						_jh._gh[index]+=_C2;
					}
					else if(_xh!="object"||_yh!="object")
					{
						_jh._gh[index]=_C2;
					}
					else if(_xh!="string"&&_yh!="string")
					{
						_jh._gh[index]=yyGetReal(_wh)+yyGetReal(_C2);
					}
					else _jh._gh[index]=_C2;
				}
			}
		}
	}
}

function ds_grid_multiply_disk(_Qe,_r4,_s4,_Dh,_C2)
{
	_Qe=yyGetInt32(_Qe);
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_Dh=yyGetReal(_Dh);
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_set_disk)");
		return;
	}
	var _x5=0;
	var _y5=0;
	var _z5=0;
	var _A5=0;
	var i=0;
	var _05=0;
	_x5=~~(_I5(0.0,Math.floor(_r4-_Dh)));
	_z5=~~(_J5(_jh._xb-1,Math.ceil(_r4+_Dh)));
	_y5=~~(_I5(0,Math.floor(_s4-_Dh)));
	_A5=~~(_J5(_jh._yb-1,Math.ceil(_s4+_Dh)));
	_Dh=_Dh*_Dh;
	var w=_jh._xb;
	for(i=_x5;i<=_z5;i++)
	{
		var _Eh=(i-_r4)*(i-_r4);
		for(_05=_y5;_05<=_A5;_05++)
		{
			var _Fh=_05-_s4;
			if(_Eh+(_Fh*_Fh)<=_Dh)
			{
				if(i>=0&&i<_jh._xb&&_05>=0&&_05<_jh._yb)
				{
					var index=i+(_05*w);
					var _wh=_jh._gh[index];
					var _xh=typeof(_wh);
					if(typeof(_C2)=="string"||_xh=="string")continue;
					_jh._gh[index]=yyGetReal(_wh)*yyGetReal(_C2);
				}
			}
		}
	}
}

function _Gh(_Qe,_mh,_X5,_Y5,_p5,_q5,_Hh,_Ih,_Jh)
{
	_Qe=yyGetInt32(_Qe);
	_X5=yyGetInt32(_X5);
	_Y5=yyGetInt32(_Y5);
	_p5=yyGetInt32(_p5);
	_q5=yyGetInt32(_q5);
	_Hh=yyGetInt32(_Hh);
	_Ih=yyGetInt32(_Ih);
	if(_X5>_p5)
	{
		var _K5=_X5;
		_X5=_p5;
		_p5=_K5;
	}
	if(_Y5>_q5)
	{
		var _K5=_Y5;
		_Y5=_q5;
		_q5=_K5;
	}
	var _oh=_kh._F4(_mh);
	if(!_oh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_set_grid_region)");
		return;
	}
	var _nh=_kh._F4(_Qe);
	if(!_nh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_set_grid_region)");
		return;
	}
	var _Kh=_X5+(_oh._xb*_Y5);
	var _Lh=_Hh+(_nh._xb*_Ih);
	if(_Kh>=_Lh)
	{
		for(var y=_Y5;y<=_q5;y++)
		{
			var _Mh=_Hh;
			var index=(y*_oh._xb)+_X5;
			for(var x=_X5;x<=_p5;x++)
			{
				if((x>=0&&x<_oh._xb&&y>=0&&y<_oh._yb)&&(_Mh>=0&&_Mh<_nh._xb&&_Ih>=0&&_Ih<_nh._yb))
				{
					_Jh(_nh,(_Mh+(_Ih*_nh._xb)),_oh,index);
				}
				index++;
				_Mh++;
			}
			_Ih++;
		}
	}
	else 
	{
		_Ih+=_q5-_Y5;
		_Hh+=_p5-_X5;
		for(var y=_q5;y>=_Y5;y--)
		{
			var _Mh=_Hh;
			var index=(y*_oh._xb)+_p5;
			for(var x=_p5;x>=_X5;x--)
			{
				if((x>=0&&x<_oh._xb&&y>=0&&y<_oh._yb)&&(_Mh>=0&&_Mh<_nh._xb&&_Ih>=0&&_Ih<_nh._yb))
				{
					_Jh(_nh,(_Mh+(_Ih*_nh._xb)),_oh,index);
				}
				index--;
				_Mh--;
			}
			_Ih--;
		}
	}
}

function ds_grid_set_grid_region(_Qe,_mh,_X5,_Y5,_p5,_q5,_Hh,_Ih)
{
	_Gh(_Qe,_mh,_X5,_Y5,_p5,_q5,_Hh,_Ih,
function _Nh(_Oh,_Ph,_Qh,_K2)
	{
		_Oh._gh[_Ph]=_Qh._gh[_K2];
	}
	);
}

function ds_grid_add_grid_region(_Qe,_mh,_X5,_Y5,_p5,_q5,_Hh,_Ih)
{
	_Gh(_Qe,_mh,_X5,_Y5,_p5,_q5,_Hh,_Ih,
function _Nh(_Oh,_Ph,_Qh,_K2)
	{
		var _wh=_Oh._gh[_Ph];
		var _xh=typeof(_wh);
		var _Rh=_Qh._gh[_K2];
		var _yh=typeof(_Rh);
		if(_xh==_yh&&(_xh=="number"||_xh=="string"))
		{
			_Oh._gh[_Ph]+=_Rh;
		}
		else if(_xh!="object"||_yh!="object")
		{
			_Oh._gh[_Ph]=_Rh;
		}
		else if(_xh!="string"&&_yh!="string")
		{
			_Oh._gh[_Ph]=yyGetReal(_wh)+yyGetReal(_Rh);
		}
		else _Oh._gh[_Ph]=_Rh;
	}
	);
}

function ds_grid_multiply_grid_region(_Qe,_mh,_X5,_Y5,_p5,_q5,_Hh,_Ih,_C2)
{
	_Gh(_Qe,_mh,_X5,_Y5,_p5,_q5,_Hh,_Ih,
function _Nh(_Oh,_Ph,_Qh,_K2)
	{
		var _wh=_Oh._gh[_Ph];
		var _Rh=_Qh._gh[_K2];
		if(typeof(_wh)=="string"||typeof(_Rh)=="string")return;
		_Oh._gh[_Ph]=yyGetReal(_wh)*yyGetReal(_Rh);
	}
	);
}
var ds_grid_get=_Sh;

function _Sh(_Qe,_r4,_s4)
{
	_Qe=yyGetInt32(_Qe);
	var _jh=_kh._F4(_Qe),x=yyGetInt32(_r4),y=yyGetInt32(_s4);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_get)");
		return undefined;
	}
	if(x<0||x>=_jh._xb||y<0||y>=_jh._yb)
	{
		_I3("Error: grid out of bounds(get) - GridID: "+_Qe+"  size["+_jh._xb+","+_jh._yb+"]  at  ("+x+","+y+")");
		return undefined;
	}
	return _jh._gh[x+(y*_jh._xb)];
}

function _Th(_Qe,_r4,_s4)
{
	var _jh=_kh._F4(_Qe);
	return _jh._gh[~~_r4+(~~_s4*_jh._xb)];
}

function _Uh(_Qe,_X5,_Y5,_p5,_q5)
{
	_Qe=yyGetInt32(_Qe);
	_X5=yyGetInt32(_X5);
	_Y5=yyGetInt32(_Y5);
	_p5=yyGetInt32(_p5);
	_q5=yyGetInt32(_q5);
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_get_sum)");
		return 0;
	}
	if(_X5>_p5)
	{
		var _K5=_X5;
		_X5=_p5;
		_p5=_K5;
	}
	if(_X5<0)_X5=0;
	if(_X5>=_jh._xb)_X5=_jh._xb-1;
	if(_p5<0)_p5=0;
	if(_p5>=_jh._xb)_p5=_jh._xb-1;
	if(_Y5>_q5)
	{
		var _K5=_Y5;
		_Y5=_q5;
		_q5=_K5;
	}
	if(_Y5<0)_Y5=0;
	if(_Y5>=_jh._yb)_Y5=_jh._yb-1;
	if(_q5<0)_q5=0;
	if(_q5>=_jh._yb)_q5=_jh._yb-1;
	_4h=_3h=_5h=_6h=0;
	var first=true;
	var _u7=0;
	for(var y=_Y5;y<=_q5;y++)
	{
		var index=(y*_jh._xb)+_X5;
		for(var x=_X5;x<=_p5;x++)
		{
			var _Z3=_jh._gh[index];
			if(first)
			{
				_3h=_4h=_Z3;
				first=false;
			}
			else 
			{
				if(_3h>_Z3)_3h=_Z3;
				if(_4h<_Z3)_4h=_Z3;
			}
			if(typeof _Z3!=="string")
			{
				_5h+=_Z3;
			}
			_u7++;
			index++;
		}
	}
	_6h=_5h/_u7;
}

function ds_grid_get_sum(_Qe,_X5,_Y5,_p5,_q5)
{
	_Uh(_Qe,_X5,_Y5,_p5,_q5);
	return _5h;
}

function ds_grid_get_max(_Qe,_X5,_Y5,_p5,_q5)
{
	_Uh(_Qe,_X5,_Y5,_p5,_q5);
	return _4h;
}

function ds_grid_get_min(_Qe,_X5,_Y5,_p5,_q5)
{
	_Uh(_Qe,_X5,_Y5,_p5,_q5);
	return _3h;
}

function ds_grid_get_mean(_Qe,_X5,_Y5,_p5,_q5)
{
	_Uh(_Qe,_X5,_Y5,_p5,_q5);
	return _6h;
}

function _Vh(_Qe,_r4,_s4,_Dh)
{
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_set_disk)");
		return;
	}
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_Dh=yyGetReal(_Dh);
	var _x5=0;
	var _y5=0;
	var _z5=0;
	var _A5=0;
	var i=0;
	var _05=0;
	_x5=~~(_I5(0.0,Math.floor(_r4-_Dh)));
	_z5=~~(_J5(_jh._xb-1,Math.ceil(_r4+_Dh)));
	_y5=~~(_I5(0,Math.floor(_s4-_Dh)));
	_A5=~~(_J5(_jh._yb-1,Math.ceil(_s4+_Dh)));
	var first=true;
	var _u7=0;
	_4h=_3h=_5h=0;
	_Dh=_Dh*_Dh;
	var w=_jh._xb;
	for(i=_x5;i<=_z5;i++)
	{
		var _Eh=(i-_r4)*(i-_r4);
		for(_05=_y5;_05<=_A5;_05++)
		{
			var _Fh=_05-_s4;
			if(_Eh+(_Fh*_Fh)<=_Dh)
			{
				if(i>=0&&i<_jh._xb&&_05>=0&&_05<_jh._yb)
				{
					var _Z3=_jh._gh[i+(_05*w)];
					if(first)
					{
						_3h=_4h=_Z3;
						first=false;
					}
					else 
					{
						if(_3h>_Z3)_3h=_Z3;
						if(_4h<_Z3)_4h=_Z3;
					}
					if(typeof _Z3!=="string")
					{
						_5h+=_Z3;
					}
					_u7++;
				}
			}
		}
	}
	_6h=_5h/_u7;
}

function ds_grid_get_disk_sum(_Qe,_r4,_s4,_Dh)
{
	_Vh(_Qe,_r4,_s4,_Dh);
	return _5h;
}

function ds_grid_get_disk_max(_Qe,_r4,_s4,_Dh)
{
	_Vh(_Qe,_r4,_s4,_Dh);
	return _4h;
}

function ds_grid_get_disk_min(_Qe,_r4,_s4,_Dh)
{
	_Vh(_Qe,_r4,_s4,_Dh);
	return _3h;
}

function ds_grid_get_disk_mean(_Qe,_r4,_s4,_Dh)
{
	_Vh(_Qe,_r4,_s4,_Dh);
	return _6h;
}

function _Wh(_Qe,_X5,_Y5,_p5,_q5,_C2)
{
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_get_sum)");
		return 0;
	}
	_X5=yyGetInt32(_X5);
	_Y5=yyGetInt32(_Y5);
	_p5=yyGetInt32(_p5);
	_q5=yyGetInt32(_q5);
	if(_X5>_p5)
	{
		var _K5=_X5;
		_X5=_p5;
		_p5=_K5;
	}
	if(_X5<0)_X5=0;
	if(_X5>=_jh._xb)_X5=_jh._xb-1;
	if(_p5<0)_p5=0;
	if(_p5>=_jh._xb)_p5=_jh._xb-1;
	if(_Y5>_q5)
	{
		var _K5=_Y5;
		_Y5=_q5;
		_q5=_K5;
	}
	if(_Y5<0)_Y5=0;
	if(_Y5>=_jh._yb)_Y5=_jh._yb-1;
	if(_q5<0)_q5=0;
	if(_q5>=_jh._yb)_q5=_jh._yb-1;
	_7h=false;
	_8h=-1;
	_9h=-1;
	for(var y=_Y5;y<=_q5;y++)
	{
		var index=(y*_jh._xb)+_X5;
		for(var x=_X5;x<=_p5;x++)
		{
			var _Z3=_jh._gh[index];
			if((typeof(_C2)=="number"&&typeof(_Z3)=="number"))
			{
				if(_bh>abs(_C2-_Z3))
				{
					_7h=true;
					_8h=x;
					_9h=y;
					return true;
				}
			}
			else 
			{
				if(_C2==_Z3)
				{
					_7h=true;
					_8h=x;
					_9h=y;
					return true;
				}
			}
			index++;
		}
	}
	return false;
}

function ds_grid_value_exists(_Qe,_X5,_Y5,_p5,_q5,_C2)
{
	_Wh(_Qe,_X5,_Y5,_p5,_q5,_C2);
	return _7h;
}

function ds_grid_value_x(_Qe,_X5,_Y5,_p5,_q5,_C2)
{
	_Wh(_Qe,_X5,_Y5,_p5,_q5,_C2);
	return _8h;
}

function ds_grid_value_y(_Qe,_X5,_Y5,_p5,_q5,_C2)
{
	_Wh(_Qe,_X5,_Y5,_p5,_q5,_C2);
	return _9h;
}

function _Xh(_Qe,_r4,_s4,_Dh,_C2)
{
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_set_disk)");
		return;
	}
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_Dh=yyGetReal(_Dh);
	var _x5=0;
	var _y5=0;
	var _z5=0;
	var _A5=0;
	var i=0;
	var _05=0;
	_x5=~~(_I5(0.0,Math.floor(_r4-_Dh)));
	_z5=~~(_J5(_jh._xb-1,Math.ceil(_r4+_Dh)));
	_y5=~~(_I5(0,Math.floor(_s4-_Dh)));
	_A5=~~(_J5(_jh._yb-1,Math.ceil(_s4+_Dh)));
	_8h=_9h=-1;
	_7h=false;
	_Dh=_Dh*_Dh;
	var w=_jh._xb;
	for(i=_x5;i<=_z5;i++)
	{
		var _Eh=(i-_r4)*(i-_r4);
		for(_05=_y5;_05<=_A5;_05++)
		{
			var _Fh=_05-_s4;
			if(_Eh+(_Fh*_Fh)<=_Dh)
			{
				if(i>=0&&i<_jh._xb&&_05>=0&&_05<_jh._yb)
				{
					var _Z3=_jh._gh[i+(_05*w)];
					if((typeof(_C2)=="number"&&typeof(_Z3)=="number"))
					{
						if(_bh>abs(_C2-_Z3))
						{
							_8h=i;
							_9h=_05;
							_7h=true;
							return;
						}
					}
					else 
					{
						if(_Z3==_C2)
						{
							_8h=i;
							_9h=_05;
							_7h=true;
							return;
						}
					}
				}
			}
		}
	}
}

function ds_grid_value_disk_exists(_Qe,_r4,_s4,_Dh,_C2)
{
	_Xh(_Qe,_r4,_s4,_Dh,_C2);
	return _7h;
}

function ds_grid_value_disk_x(_Qe,_r4,_s4,_Dh,_C2)
{
	_Xh(_Qe,_r4,_s4,_Dh,_C2);
	return _8h;
}

function ds_grid_value_disk_y(_Qe,_r4,_s4,_Dh,_C2)
{
	_Xh(_Qe,_r4,_s4,_Dh,_C2);
	return _9h;
}

function ds_grid_shuffle(_Qe)
{
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if(_jh==null||_jh==undefined)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_shuffle)");
		return;
	}
	_jh._gh.sort(
function()
	{
		return 0.5-Math.random();
	}
	);
}

function ds_grid_write(_Qe)
{
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_write)");
		return;
	}
	var width=_jh._xb;
	var height=_jh._yb;
	var _Yh=buffer_create(16384,_Zh,1);
	buffer_write(_Yh,__h,603);
	buffer_write(_Yh,__h,width);
	buffer_write(_Yh,__h,height);
	for(var x=0;x<=width-1;x++)
	{
		for(y=0;y<=height-1;y++)
		{
			var _0d=_jh._gh[x+(y*width)];
			_0i(_Yh,_0d);
		}
	}
	var _1i=_2i(_Yh);
	buffer_delete(_Yh);
	return _1i;
}

function ds_grid_read(_Qe,_3i)
{
	if(!_3i)
	{
		_I3("Error: no string provided (ds_grid_read)");
		return false;
	}
	var _jh=_kh._F4(yyGetInt32(_Qe));
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_read)");
		return false;
	}
	if(_3i[0]=="{")
	{
		try
		{
			var _4i=JSON.parse(_3i);
			if((_4i!=null)&&(_4i!=undefined)&&(typeof(_4i.body)=="object")&&(typeof(_4i.width)=="number")&&(typeof(_4i.height)=="number"))
			{
				_jh._xb=_4i.width;
				_jh._yb=_4i.height;
				_jh._gh=_4i.body;
			}
		}
		catch(_5i)
		{
			_I3("Error: reading ds_grid JSON");
			return false;
		}
		return true;
	}
	else 
	{
		var _Yh=_6i(_3i);
		if(_Yh<0)return false;
		buffer_seek(_Yh,_7i,0);
		var id=buffer_read(_Yh,_8i);
		var version;
		if(id==602)
		{
			version=3;
		}
		else if(id==603)
		{
			version=0;
		}
		else 
		{
			_I3("Error: unrecognised format - resave the grid to update/fix issues. (ds_grid_read)");
			return false;
		}
		var w=buffer_read(_Yh,_8i);
		var h=buffer_read(_Yh,_8i);
		_jh._xb=w;
		_jh._yb=h;
		_jh._gh=[];
		var _K5=w*h;
		for(var i=0;i<_K5;i++)
		{
			_jh._gh[i]=0;
		}
		for(i=0;i<=w-1;i++)
		{
			for(_05=0;_05<=h-1;_05++)
			{
				var _0d=_9i(_Yh,version);
				_jh._gh[i+(_05*w)]=_0d;
			}
		}
		buffer_delete(_Yh);
		return true;
	}
}

function ds_grid_sort(_Qe,_ai,_bi)
{
	_Qe=yyGetInt32(_Qe);
	_ai=yyGetInt32(_ai);
	_bi=yyGetBool(_bi);
	var _jh=_kh._F4(_Qe);
	if(!_jh)
	{
		_I3("Error: invalid ds_grid ID (ds_grid_read)");
		return;
	}
	var _ci=[];
	for(var y=0;y<_jh._yb;y++)
	{
		_ci[y]=ds_grid_get(_Qe,_ai,y);
	}
	var _di=_bi?1:-1;
	_ci.sort(
function(_i3,_h3)
	{
		return yyCompareVal(_i3,_h3,g_GMLMathEpsilon)*_di;
	}
	);
	var _ei=[];
	var _fi=[];
	for(var y=0;y<_ci.length;y++)
	{
		_fi[y]=false;
	}
	for(var y=0;y<_ci.length;y++)
	{
		var _gi=_ci[y];
		for(var _05=0;_05<_ci.length;_05++)
		{
			var _hi=_bi?_05:(_ci.length-1-_05);
			if(_fi[_hi])
			{
				continue;
			}
			var _ii=ds_grid_get(_Qe,_ai,_hi);
			if(_ii==_gi)
			{
				for(var x=0;
x<_jh._xb;x++)
				{
					_ei[x+(_jh._xb*y)]=ds_grid_get(_Qe,x,_hi);
				}
				_fi[_hi]=true;
				break;
			}
		}
	}
	_jh._gh=_ei;
}

function ds_grid_to_mp_grid(_ih,_ji,_ki)
{
	var _jh=_kh._F4(yyGetInt32(_ih));
	var _li=_mi._F4(yyGetInt32(_ji));
	if(_li==null||_jh==null)
	{
		_I3("ds_grid_to_mp_grid :: Invalid source or destination grid");
		return;
	}
	var w=_li._ni;
	var h=_li._oi;
	var _pi=_jh._xb;
	var _qi=_jh._yb;
	if(w!=_pi||h!=_qi)
	{
		_I3("ds_grid_to_mp_grid :: Grid sizes do not match");
		return;
	}
	if(_ki==undefined)
	{
		for(var y=0;y<h;++y)
		{
			for(var x=0;x<w;++x)
			{
				var _0d=yyGetReal(_jh._gh[x+(y*_jh._xb)]);
				_li._ri[(x*_li._oi)+y]=_0d===0?0:-1;
			}
		}
	}
	else 
	{
		_si=_ti(_ki,2);
		_ui="boundObject" in _si?_si._vi:
		{
		}
		;
		for(var y=0;y<h;++y)
		{
			for(var x=0;x<w;++x)
			{
				var _0d=_jh._gh[x+(y*_jh._xb)];
				var _ta=yyGetBool(_si(_ui,_ui,_0d,x,y));
				_li._ri[(x*_li._oi)+y]=_ta?-1:0;
			}
		}
	}
}

function ds_list_create()
{
	var _H5=new _wi();
	_H5._xi=true;
	return _yi._ce(_H5);
}

function ds_list_destroy(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	var _zi=_yi._F4(_Qe);
	if(_zi)
	{
		_zi._se();
		_yi._lh(_Qe);
	}
}

function ds_list_clear(_Qe)
{
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)
	{
		_Ai._se();
		return;
	}
	_I3("Error: invalid ds_list ID (ds_list_clear)");
}

function ds_list_copy(_Qe,_mh)
{
	_Qe=yyGetInt32(_Qe);
	var _Bi=_yi._F4(_Qe);
	if(!_Bi)
	{
		_I3("Error: invalid DEST ds_list ID (ds_list_copy)");
		return;
	}
	var _Ci=_yi._F4(yyGetInt32(_mh));
	if(!_Ci)
	{
		_I3("Error: invalid SOURCE ds_list ID (ds_list_copy)");
		return;
	}
	_Bi._hh(_Ci);
	_yi.Set(_Qe,_Bi);
}

function ds_list_size(_Qe)
{
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)return _Ai.length;
	return 0;
}

function ds_list_empty(_Qe)
{
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)
	{
		if(_Ai.length!==0)return false;
		else return true;
	}
	_I3("Error: invalid ds_list ID (ds_list_empty)");
	return true;
}

function ds_list_add()
{
	var _Di=arguments;
	var _Ei=arguments.length;
	var _Ai=_yi._F4(_Di[0]);
	if(!_Ai)
	{
		_I3("Error: invalid ds_list ID (ds_list_add)");
		return;
	}
	for(var i=1;i<_Ei;i++)
	{
		_Ai._ce(_Di[i]);
	}
	return;
}

function _Fi(_Qe,_C2)
{
	return ds_list_add(yyGetInt32(_Qe),new _Gi(_Hi,_C2));
}

function _Ii(_Qe,_C2)
{
	return ds_list_add(yyGetInt32(_Qe),new _Gi(_Ji,_C2));
}

function ds_list_set(_Qe,_K2,_C2)
{
	if(isNaN(_K2))_I3("Error: index must be a number");
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)
	{
		_Ai._Ki(yyGetInt32(_K2),_C2);
	}
	else 
	{
		_I3("Error: invalid ds_list ID (ds_list_set)");
	}
}

function ds_list_set_pre(_Qe,_K2,_C2)
{
	if(isNaN(_K2))_I3("Error: index must be a number");
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)
	{
		_Ai._Ki(yyGetInt32(_K2),_C2);
	}
	else 
	{
		_I3("Error: invalid ds_list ID (ds_list_set)");
	}
	return _C2;
}

function ds_list_set_post(_Qe,_K2,_C2)
{
	if(isNaN(_K2))_I3("Error: index must be a number");
	var _r3=_C2;
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)
	{
		_r3=_Ai._Ki(yyGetInt32(_K2),_C2);
	}
	else 
	{
		_I3("Error: invalid ds_list ID (ds_list_set)");
	}
	return _r3;
}

function ds_list_insert(_Qe,_Li,_C2)
{
	if(isNaN(_Li))_I3("Error: index must be a number");
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)
	{
		return _Ai._Mi(yyGetInt32(_Li),_C2);
	}
	_I3("Error: invalid ds_list ID (ds_list_insert)");
	return -1;
}

function _Ni(_Qe,_Li,_C2)
{
	return ds_list_insert(yyGetInt32(_Qe),yyGetInt32(_Li),new _Gi(_Hi,_C2));
}

function _Oi(_Qe,_Li,_C2)
{
	return ds_list_insert(yyGetInt32(_Qe),yyGetInt32(_Li),new _Gi(_Ji,_C2));
}

function ds_list_replace(_Qe,_Li,_C2)
{
	if(isNaN(_Li))_I3("Error: index must be a number");
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)
	{
		return _Ai._Pi(yyGetInt32(_Li),_C2);
	}
	_I3("Error: invalid ds_list ID (ds_list_replace)");
	return -1;
}

function ds_list_delete(_Qe,_Li)
{
	if(isNaN(_Li))_I3("Error: index must be a number");
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)
	{
		return _Ai._lh(yyGetInt32(_Li));
	}
}

function ds_list_find_index(_Qe,_C2)
{
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)
	{
		var _r3=-1;
		for(var _H5=0;_H5<_Ai._Qi.length;_H5++)
		{
			var _i3=_Ai._Qi[_H5];
			if(((typeof(_i3)=="object")&&(_i3.Object==_C2))||(_i3==_C2))
			{
				_r3=_H5;
				break;
			}
		}
		return _r3;
	}
	_I3("Error: invalid ds_list ID (ds_list_find_index)");
	return -1;
}

function ds_list_find_value(_Qe,_Li)
{
	if(isNaN(_Li))_I3("Error: index must be a number");
	var _Z3,_Ri=_Si(_Li),_Ai=_yi._F4(_Si(yyGetInt32(_Qe)));
	if(_Ai)
	{
		_Z3=_Ai._Qi[_Ri];
		if(typeof(_Z3)==="object"&&_Z3.Object!==undefined)
		{
			return _Z3.Object;
		}
		else return _Z3;
	}
	_I3("Error: invalid ds_list ID (ds_list_find_value)");
	return undefined;
}

function ds_list_is_list(_Qe,_Li)
{
	if(isNaN(_Li))_I3("Error: index must be a number");
	var _Z3,_Ri=_Si(_Li),_Ai=_yi._F4(_Si(yyGetInt32(_Qe)));
	if(_Ai)
	{
		_Z3=_Ai._Qi[_Ri];
		if(typeof(_Z3)==="object"&&_Z3.Object!==undefined)
		{
			return _Z3._Ti==_Ji;
		}
		else return false;
	}
	_I3("Error: invalid ds_list ID (ds_list_find_value)");
	return undefined;
}

function ds_list_is_map(_Qe,_Li)
{
	if(isNaN(_Li))_I3("Error: index must be a number");
	var _Z3,_Ri=_Si(_Li),_Ai=_yi._F4(_Si(yyGetInt32(_Qe)));
	if(_Ai)
	{
		_Z3=_Ai._Qi[_Ri];
		if(typeof(_Z3)==="object"&&_Z3.Object!==undefined)
		{
			return _Z3._Ti==_Hi;
		}
		else return false;
	}
	_I3("Error: invalid ds_list ID (ds_list_find_value)");
	return undefined;
}

function ds_list_sort(_Qe,_Ui)
{
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)
	{
		var _di=yyGetBool(_Ui)?1:-1;
		_Ai._Qi.sort(
function(_i3,_h3)
		{
			return yyCompareVal(_i3,_h3,g_GMLMathEpsilon)*_di;
		}
		);
		return 0;
	}
	_I3("Error: invalid ds_list ID (ds_list_sort)");
	return 0;
}

function ds_list_shuffle(_Qe)
{
	var _Ai=_yi._F4(yyGetInt32(_Qe));
	if(_Ai)
	{
		_Ai._Vi();
		return 0;
	}
	_I3("Error: invalid ds_list ID (ds_list_shuffle)");
	return 0;
}

function ds_list_write(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	var _Ai=_yi._F4(_Qe);
	if(!_Ai)
	{
		_I3("Error: invalid ds_list ID (ds_list_write)");
		return "";
	}
	var _Sg=_Ai.length;
	var _Yh=buffer_create(16384,_Zh,1);
	buffer_write(_Yh,__h,303);
	buffer_write(_Yh,__h,_Sg);
	for(var i=0;i<_Sg;i++)
	{
		var _0d=ds_list_find_value(_Qe,i);
		_0i(_Yh,_0d);
	}
	var _1i=_2i(_Yh);
	buffer_delete(_Yh);
	return _1i;
}

function ds_list_read(_Qe,_3i)
{
	if(_3i===undefined||_3i=="")
	{
		return false;
	}
	_Qe=yyGetInt32(_Qe);
	var _Ai=_yi._F4(_Qe);
	if(!_Ai)
	{
		_I3("Error: invalid ds_list ID (ds_list_read)");
		return false;
	}
	if(_3i[0]=="{")
	{
		try
		{
			var _zi=JSON.parse(_3i);
			_Ai._Qi=_zi;
			_Ai.length=_zi.length;
			_Ai._u7=_zi.length;
		}
		catch(err)
		{
			_I3("Error: reading ds_list file.");
			return false;
		}
	}
	else 
	{
		var _Yh=_6i(_3i);
		if(_Yh<0)return false;
		buffer_seek(_Yh,_7i,0);
		var id=buffer_read(_Yh,_8i);
		var version;
		if(id==302)
		{
			version=3;
		}
		else if(id==303)
		{
			version=0;
		}
		else 
		{
			_I3("Error: unrecognised format - resave the list to update/fix issues. (ds_list_read)");
			return false;
		}
		var _Sg=buffer_read(_Yh,_8i);
		_Ai._se();
		for(var i=0;i<_Sg;i++)
		{
			var _0d=_9i(_Yh,version);
			ds_list_add(_Qe,_0d);
		}
		buffer_delete(_Yh);
	}
	return true;
}

function ds_list_mark_as_map(_Qe,_Li)
{
	_Qe=yyGetInt32(_Qe);
	_Li=yyGetInt32(_Li);
	var _0d=ds_list_find_value(_Qe,_Li);
	if(_0d!=undefined)
	{
		ds_list_replace(_Qe,_Li,new _Gi(_Hi,_0d));
	}
}

function ds_list_mark_as_list(_Qe,_Li)
{
	_Qe=yyGetInt32(_Qe);
	_Li=yyGetInt32(_Li);
	var _0d=ds_list_find_value(_Qe,_Li);
	if(_0d!=undefined)
	{
		ds_list_replace(_Qe,_Li,new _Gi(_Ji,_0d));
	}
}
var _Hi=1,_Ji=2;

function _Wi()
{
}
_Wi.prototype._Qe=0;
_Wi.prototype._Xi=
function()
{
	return(++_Wi.prototype._Qe).toString();
}
;
/*@constructor */
function _Gi(_Ob,_ui)
{
	this._Ti=_Ob;
	this.Object=_ui;
}
const hasOwnProperty=Object.prototype.hasOwnProperty;
const _Yi=(string)=>
{
	let hash=0;
	string=string.toString();
	for(let i=0;i<string.length;i++)
	{
		hash=(((hash<<5)-hash)+string.charCodeAt(i))&0xFFFFFFFF;
	}
	return hash;
}
;
const _Zi=(__i)=>
{
	if(typeof __i.getTime=='function')
	{
		return __i.getTime();
	}
	let _0j=[];
	for(let _Qg in __i)
	{
		if(hasOwnProperty.call(__i,_Qg))
		{
			_0j.push(_Qg);
		}
	}
	_0j.sort();
	let result=0;
	for(let _Qg in _0j)
	{
		result+=_Yi(_Qg+_1j(__i[_Qg]));
	}
	return result;
}
;
const _1j=(value)=>
{
	const type=value==undefined?undefined:typeof value;
	return _2j[type]?_2j[type](value)+_Yi(type):0;
}
;
const _2j=
{
	string:_Yi,_3j:_Yi,_4j:_Yi,_5j:_Zi}
;

function _6j(_qb)
{
	var _r3=_qb;
	switch(typeof(_qb))
	{
		case "object":if(_qb.id!==undefined)
		{
			_r3=_qb.id;
		}
		else 
		{
			_r3=_1j(_qb);
		}
		break;
		default :break;
	}
	return _r3;
}

function ds_map_create()
{
	var _c6=new Map();
	var id=_d6._ce(_c6);
	return id;
}

function ds_map_destroy(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	var _c6=_d6._F4(_Qe);
	if(_c6)
	{
		_7j(_c6);
		_d6._lh(_Qe);
	}
}

function ds_map_clear(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	var _c6=_d6._F4(_Qe);
	if(_c6)
	{
		_7j(_c6);
	}
}

function _7j(_8j)
{
	_8j.forEach(
function(_Z3,key,_8j)
	{
		if(_Z3!=null&&_Z3.Object!==undefined)switch(_Z3._Ti)
		{
			case _Hi:ds_map_destroy(_Z3.Object);
			break;
			case _Ji:ds_list_destroy(_Z3.Object);
			break;
		}
	}
	);
	_8j.clear();
	if(_8j._9j)_8j._9j.clear();
}

function ds_map_copy(_ji,_mh)
{
	_ji=yyGetInt32(_ji);
	var _Bi=_d6._F4(_ji);
	var _Ci=_d6._F4(yyGetInt32(_mh));
	if(_Bi&&_Ci)
	{
		_Bi=new Map();
		_Ci.forEach(
function(_Z3,key,_Ci)
		{
			_Bi.set(key,_Z3);
		}
		);
		_d6.Set(_ji,_Bi);
	}
}

function ds_map_size(_Qe)
{
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		return _c6.size;
	}
	return 0;
}

function ds_map_empty(_Qe)
{
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		return _c6.size==0;
	}
	return false;
}

function ds_map_replace(_Qe,_aj,_C2)
{
	_aj=_6j(_aj);
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)_c6.set(_aj,_C2);
}

function ds_map_replace_map(_Qe,_aj,_C2)
{
	ds_map_replace(_Qe,_aj,new _Gi(_Hi,_C2));
}

function ds_map_replace_list(_Qe,_aj,_C2)
{
	ds_map_replace(_Qe,_aj,new _Gi(_Ji,_C2));
}

function ds_map_delete(_Qe,_aj)
{
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		_aj=_6j(_aj);
		_c6.delete(_aj);
		if(_c6._9j&&_c6._9j.has(_aj))_c6._9j.delete(_aj);
	}
}

function ds_map_exists(_Qe,_aj)
{
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		_aj=_6j(_aj);
		return _c6.has(_aj);
	}
	return false;
}

function ds_map_add(_Qe,_aj,_C2)
{
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		var _bj=_aj;
		_aj=_6j(_aj);
		if(_aj!==_bj)
		{
			if(_c6._9j==undefined)
			{
				_c6._9j=new Map();
			}
			_c6._9j.set(_aj,_bj);
		}
		_c6.set(_aj,_C2)	}
}

function ds_map_add_map(_Qe,_aj,_C2)
{
	ds_map_add(yyGetInt32(_Qe),_aj,new _Gi(_Hi,_C2));
}

function ds_map_add_list(_Qe,_aj,_C2)
{
	ds_map_add(yyGetInt32(_Qe),_aj,new _Gi(_Ji,_C2));
}

function ds_map_set(_Qe,_aj,_C2)
{
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		var _bj=_aj;
		_aj=_6j(_aj);
		if(_aj!==_bj)
		{
			if(_c6._9j==undefined)
			{
				_c6._9j=new Map();
			}
			_c6._9j.set(_aj,_bj);
		}
		_c6.set(_aj,_C2);
	}
}

function ds_map_set_pre(_Qe,_aj,_C2)
{
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		var _bj=_aj;
		_aj=_6j(_aj);
		if(_aj!==_bj)
		{
			if(_c6._9j==undefined)
			{
				_c6._9j=new Map();
			}
			_c6._9j.set(_aj,_bj);
		}
		_c6.set(_aj,_C2);
		;
	}
	return _C2;
}

function ds_map_set_post(_Qe,_aj,_C2)
{
	var _r3=_C2;
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		var _bj=_aj;
		_aj=_6j(_aj);
		if(_aj!==_bj)
		{
			if(_c6._9j==undefined)
			{
				_c6._9j=new Map();
			}
			_c6._9j.set(_aj,_bj);
		}
		_r3=_c6.get(_aj);
		_c6.set(_aj,_C2);
	}
	return _r3;
}

function ds_map_find_value(_Qe,_aj)
{
	if(Number.isNaN(_aj))return undefined;
	if((_Qe==undefined)||Number.isNaN(_Qe))
	{
		_I3("Error: "+_Qe+" is not a valid map reference");
		return undefined;
	}
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		_aj=_6j(_aj);
		var _cj=_c6.get(_aj);
		if(typeof(_cj)==="object"&&(_cj!=null)&&_cj.Object!==undefined)
		{
			return _cj.Object;
		}
		else return _cj;
	}
	return undefined;
}

function ds_map_values_to_array(_Qe,_dj)
{
	if((_Qe==undefined)||Number.isNaN(_Qe))
	{
		_I3("Error: "+_Qe+" is not a valid map reference");
		return undefined;
	}
	var _r3;
	if(arguments.length>=2)
	{
		_r3=_dj;
	}
	else 
	{
		_r3=[];
	}
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		for(const [_i3,_cj] of _c6)
		{
			if(typeof(_cj)==="object"&&(_cj!=null)&&_cj.Object!==undefined)
			{
				_r3.push(_cj.Object);
			}
			else _r3.push(_cj);
		}
	}
	return _r3;
}

function ds_map_keys_to_array(_Qe,_dj)
{
	if((_Qe==undefined)||Number.isNaN(_Qe))
	{
		_I3("Error: "+_Qe+" is not a valid map reference");
		return undefined;
	}
	var _r3;
	if(arguments.length>=2)
	{
		_r3=_dj;
	}
	else 
	{
		_r3=[];
	}
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		for(const [key,
_i3] of _c6)
		{
			var _Z3=key;
			if(_c6._9j&&_c6._9j.has(key))_Z3=_c6._9j.get(key);
			_r3.push(_Z3);
		}
	}
	return _r3;
}

function ds_map_is_map(_Qe,_aj)
{
	if(Number.isNaN(_aj))return undefined;
	if((_Qe==undefined)||Number.isNaN(_Qe))
	{
		_I3("Error: "+_Qe+" is not a valid map reference");
		return undefined;
	}
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		_aj=_6j(_aj);
		var _cj=_c6.get(_aj);
		if(typeof(_cj)==="object"&&(_cj!=null)&&_cj.Object!==undefined)
		{
			return _cj._Ti===_Hi;
		}
		else return false;
	}
	return undefined;
}

function ds_map_is_list(_Qe,_aj)
{
	if(Number.isNaN(_aj))return undefined;
	if((_Qe==undefined)||Number.isNaN(_Qe))
	{
		_I3("Error: "+_Qe+" is not a valid map reference");
		return undefined;
	}
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6)
	{
		_aj=_6j(_aj);
		var _cj=_c6.get(_aj);
		if(typeof(_cj)==="object"&&(_cj!=null)&&_cj.Object!==undefined)
		{
			return _cj._Ti===_Ji;
		}
		else return false;
	}
	return undefined;
}

function ds_map_find_previous(_Qe,_aj)
{
	_aj=_6j(_aj);
	var _ej=undefined;
	var _c6=_d6._F4(yyGetInt32(_Qe));
	for(const [key,_fj] of _c6)
	{
		if(key==_aj)
		{
			return _ej;
		}
		_ej=key;
	}
	return undefined;
}

function ds_map_find_next(_Qe,_aj)
{
	_aj=_6j(_aj);
	var _gj=false;
	var _c6=_d6._F4(yyGetInt32(_Qe));
	for(const [key,_fj] of _c6)
	{
		if(_gj)
		{
			return key;
		}
		if(key==_aj)
		{
			_gj=true;
		}
	}
	return undefined;
}

function ds_map_find_first(_Qe)
{
	var _c6=_d6._F4(yyGetInt32(_Qe));
	for(const [key,_fj] of _c6)
	{
		return key;
	}
	return undefined;
}

function ds_map_find_last(_Qe)
{
	var _ej=undefined;
	var _c6=_d6._F4(yyGetInt32(_Qe));
	for(const [key,_fj] of _c6)
	{
		_ej=key;
	}
	return _ej;
}

function ds_map_write(_Qe)
{
	var _c6=_d6._F4(yyGetInt32(_Qe));
	if(_c6==null)
	{
		_I3("Error: invalid ds_map ID (ds_map_write)");
		return "";
	}
	var _Yh=buffer_create(16384,_Zh,1);
	buffer_write(_Yh,__h,403);
	var _hj=_c6.size;
	buffer_write(_Yh,__h,_hj);
	for(const [key,_0d] of _c6)
	{
		var _ij=key;
		if(_c6._9j&&_c6._9j.has(key))_ij=_c6._9j.get(key);
		_0i(_Yh,_ij);
		var _Z3=_0d;
		if(typeof(_0d)==="object"&&(_0d!=null)&&_0d.Object!==undefined)_Z3=_0d.Object;
		_0i(_Yh,_Z3);
	}
	var _1i=_2i(_Yh);
	buffer_delete(_Yh);
	return _1i;
}

function ds_map_read(_Qe,_3i)
{
	_Qe=yyGetInt32(_Qe);
	var _c6=_d6._F4(_Qe);
	if(_c6==null)
	{
		_I3("Error: invalid ds_map ID (ds_map_read)");
		return false;
	}
	if(_3i[0]=="{")
	{
		try
		{
			if(null!=_3i)
			{
				_c6=JSON.parse(_3i);
				_d6.Set(_Qe,_c6);
			}
			else 
			{
				_d6.Set(_Qe,'');
			}
		}
		catch(_5i)
		{
			_I3("Error: reading ds_map JSON.");
			return false;
		}
	}
	else 
	{
		ds_map_clear(_Qe);
		var _Yh=_6i(_3i);
		if(_Yh<0)return false;
		buffer_seek(_Yh,_7i,0);
		var id=buffer_read(_Yh,_8i);
		var version;
		if(id==402)
		{
			version=3;
		}
		else if(id==403)
		{
			version=0;
		}
		else 
		{
			_I3("Error: unrecognised format - resave the map to update/fix issues. (ds_map_read)");
			return false;
		}
		var _u7=buffer_read(_Yh,_8i);
		while(_u7>0) 
		{
			var key=_9i(_Yh,version);
			var value=_9i(_Yh,version);
			ds_map_add(_Qe,key,value);
			_u7--;
		}
		buffer_delete(_Yh);
	}
	return true;
}

function ds_map_secure_save(_Qe,_jj)
{
	if(_jj!=null)
	{
		var _kj=_lj();
		var json=json_encode(yyGetInt32(_Qe));
		var _mj=base64_encode(json);
		_nj(yyGetString(_jj),_kj+_mj);
	}
}

function ds_map_secure_load_buffer(_oj)
{
	return -1;
}

function ds_map_secure_save_buffer(_a6,_oj)
{
	return -1;
}

function ds_map_secure_load(_jj)
{
	var _pj=-1;
	try
	{
		var _qj=_lj();
		var data=_rj(yyGetString(_jj),true);
		var _sj=data.substring(0,_qj.length);
		var _mj=data.substring(_qj.length,data.length);
		if(_sj==_qj)
		{
			var json=base64_decode(_mj);
			return json_decode(json);
		}
	}
	catch(e)
	{
		debug(e.message);
	}
	return -1;
}

function _tj()
{
	var id=0xF35065da3bb79cac7;
	return id.toString();
}

function _lj()
{
	var _kj=_tj();
	var _uj=sha1_string_utf8(_kj.split("").reverse().join(""));
	return sha1_string_utf8(_uj);
}
/*@constructor */
function _vj(_wj,_ui)
{
	this.sub=_wj;
	this.data=_ui;
}
/*@constructor */
function _xj(_wj,_ui)
{
	this.depth=_wj;
	this._yj=_ui;
}

function ds_priority_create()
{
	var _Ai=new _zj();
	return _Aj._ce(_Ai);
}

function ds_priority_destroy(_Qe)
{
	_Aj._lh(yyGetInt32(_Qe));
}

function ds_priority_clear(_Qe)
{
	var _Bj=_Aj._F4(yyGetInt32(_Qe));
	if(_Bj==null||_Bj==undefined)
	{
		_I3("Error: invalid dest priority queue ds_priority_clear()");
		return;
	}
	_Bj._se();
}

function ds_priority_copy(_Qe,_mh)
{
	_Qe=yyGetInt32(_Qe);
	var _Cj=_Aj._F4(_Qe);
	if(_Cj==null||_Cj==undefined)
	{
		_I3("Error: invalid dest priority queue ds_priority_copy()");
		return;
	}
	var _Dj=_Aj._F4(yyGetInt32(_mh));
	if(_Dj==null||_Dj==undefined)
	{
		_I3("Error: invalid source priority queue ds_priority_copy()");
		return;
	}
	_Cj._hh(_Dj);
	_Aj.Set(_Qe,_Cj);
}

function ds_priority_size(_Qe)
{
	var _Bj=_Aj._F4(yyGetInt32(_Qe));
	if(_Bj==null||_Bj==undefined)
	{
		_I3("Error: invalid priority queue ds_priority_size()");
		return 0;
	}
	return _Bj.length;
}

function ds_priority_empty(_Qe)
{
	if(ds_priority_size(yyGetInt32(_Qe))==0)return true;
	else return false;
}

function ds_priority_add(_Qe,_C2,_Ej)
{
	var _Bj=_Aj._F4(yyGetInt32(_Qe));
	if(_Bj==null||_Bj==undefined)
	{
		_I3("Error: invalid priority queue ds_priority_add()");
		return;
	}
	var _Fj=new _xj(_Ej,_C2);
	_Bj._ce(_Fj);
}

function ds_priority_change_priority(_Qe,_C2,_Ej)
{
	var _Bj=_Aj._F4(yyGetInt32(_Qe));
	if(_Bj==null||_Bj==undefined)
	{
		_I3("Error: invalid priority queue ds_priority_change_priority()");
		return;
	}
	var i=0;
	while(i<_Bj.length) 
	{
		var _Gj=_Bj._F4(i);
		if(_Gj!=null)
		{
			var _Z3=_Gj._yj;
			if(typeof(_C2)=="number"&&typeof(_Z3)=="number")
			{
				if(_bh>abs(_Z3-_C2))
				{
					_Bj._Hj(_Gj);
					_Gj.depth=_Ej;
					_Bj._ce(_Gj);
					return;
				}
			}
			else 
			{
				if(_Z3==_C2)
				{
					_Bj._Hj(_Gj);
					_Gj.depth=_Ej;
					_Bj._ce(_Gj);
					return;
				}
			}
		}
		i++;
	}
}

function ds_priority_find_priority(_Qe,_C2)
{
	var _Bj=_Aj._F4(yyGetInt32(_Qe));
	if(_Bj==null||_Bj==undefined)
	{
		_I3("Error: invalid priority queue ds_priority_find_priority()");
		return undefined;
	}
	var i=0;
	while(i<_Bj.length) 
	{
		var _Gj=_Bj._F4(i);
		if(_Gj!=null)
		{
			var _Z3=_Gj._yj;
			if(((typeof(_C2)=="number")||(_C2 instanceof Long))&&((typeof(_Z3)=="number")||(_Z3 instanceof Long)))
			{
				var _Ij=yyGetReal(_C2);
				var _Jj=yyGetReal(_Z3);
				if(_bh>abs(_Jj-_Ij))return _Gj.depth;
			}
			else 
			{
				if(_Z3==_C2)return _Gj.depth;
			}
		}
		i++;
	}
	return undefined;
}

function ds_priority_delete_value(_Qe,_C2)
{
	var _Bj=_Aj._F4(yyGetInt32(_Qe));
	if(_Bj==null||_Bj==undefined)
	{
		_I3("Error: invalid priority queue ds_priority_delete_value()");
		return;
	}
	var i=0;
	while(i<_Bj.length) 
	{
		var _Gj=_Bj._F4(i);
		if(_Gj!=null)
		{
			var _Z3=_Gj._yj;
			if(typeof(_C2)=="number"&&typeof(_Z3)=="number")
			{
				if(_bh>abs(_Z3-_C2))
				{
					_Bj._Hj(_Gj);
					return;
				}
			}
			else 
			{
				if(_Z3==_C2)
				{
					_Bj._Hj(_Gj);
				}
			}
		}
		i++;
	}
	return;
}

function ds_priority_delete_min(_Qe)
{
	var _Bj=_Aj._F4(yyGetInt32(_Qe));
	if(_Bj==null||_Bj==undefined)
	{
		_I3("Error: invalid priority queue ds_priority_delete_min()");
		return;
	}
	if(_Bj.length<=0)return 0;
	var _Gj=_Bj._F4(0);
	_Bj._Hj(_Gj);
	return _Gj._yj;
}

function ds_priority_find_min(_Qe)
{
	var _Bj=_Aj._F4(yyGetInt32(_Qe));
	if(_Bj==null||_Bj==undefined)
	{
		_I3("Error: invalid priority queue ds_priority_find_min()");
		return undefined;
	}
	if(_Bj.length<=0)return undefined;
	var _Gj=_Bj._F4(0);
	return _Gj._yj;
}

function ds_priority_delete_max(_Qe)
{
	var _Bj=_Aj._F4(yyGetInt32(_Qe));
	if(_Bj==null||_Bj==undefined)
	{
		_I3("Error: invalid priority queue ds_priority_delete_max()");
		return;
	}
	if(_Bj.length<=0)return 0;
	var _Gj=_Bj._F4(_Bj.length-1);
	_Bj._Hj(_Gj);
	return _Gj._yj;
}

function ds_priority_find_max(_Qe)
{
	var _Bj=_Aj._F4(yyGetInt32(_Qe));
	if(_Bj==null||_Bj==undefined)
	{
		_I3("Error: invalid priority queue ds_priority_find_max()");
		return undefined;
	}
	if(_Bj.length<=0)return undefined;
	var _Gj=_Bj._F4(_Bj.length-1);
	return _Gj._yj;
}

function ds_priority_write(_Qe)
{
	var _Ai=_Aj._F4(yyGetInt32(_Qe));
	if(_Ai==null)
	{
		_I3("Error: invalid ds_priority ID (ds_priority_write)");
		return "";
	}
	var _Kj=[];
	var _0d=[];
	for(var index=0;index<_Ai._Qi.length;index++)
	{
		var _Lj=_Ai._Qi[index];
		if(_Lj)
		{
			_Kj.push(_Lj.depth);
			_0d.push(_Lj._yj);
		}
	}
	var _Sg=_Ai._Qi.length;
	var _Yh=buffer_create(16384,_Zh,1);
	buffer_write(_Yh,__h,503);
	buffer_write(_Yh,__h,_Sg);
	for(var i=0;i<_Sg;i++)
	{
		_0i(_Yh,_Kj[i]);
	}
	for(var i=0;i<_Sg;i++)
	{
		_0i(_Yh,_0d[i]);
	}
	var _1i=_2i(_Yh);
	buffer_delete(_Yh);
	return _1i;
}

function ds_priority_read(_Qe,_3i)
{
	_Qe=yyGetInt32(_Qe);
	var _Mj=_Aj._F4(_Qe);
	if(_Mj==null)
	{
		_I3("Error: invalid ds_priority ID (ds_priority_read)");
		return false;
	}
	if(_3i[0]=="{")
	{
		try
		{
			var _Ai=JSON.parse(_3i);
			_Mj._se();
			for(var index=0;index<_Ai.length;index++)
			{
				var _zi=_Ai[index];
				ds_priority_add(_Qe,_zi.data,_zi.sub);
			}
		}
		catch(_5i)
		{
			_I3("Error: reading ds_priority JSON");
			return false;
		}
	}
	else 
	{
		var _Yh=_6i(_3i);
		if(_Yh<0)return false;
		buffer_seek(_Yh,_7i,0);
		var id=buffer_read(_Yh,_8i);
		var version;
		if(id==502)
		{
			version=3;
		}
		else if(id==503)
		{
			version=0;
		}
		else 
		{
			_I3("Error: unrecognised format - resave the priority list to update/fix issues. (ds_priority_read)");
			return false;
		}
		var _Sg=buffer_read(_Yh,_8i);
		ds_priority_clear(_Qe);
		var _Kj=[];
		var _0d=[];
		for(var i=0;i<_Sg;i++)
		{
			_Kj[i]=_9i(_Yh,version);
		}
		for(var i=0;i<_Sg;i++)
		{
			_0d[i]=_9i(_Yh,version);
		}
		for(var i=0;i<_Sg;i++)
		{
			ds_priority_add(_Qe,_0d[i],_Kj[i]);
		}
		buffer_delete(_Yh);
	}
	return true;
}

function ds_queue_create()
{
	var _1i=[];
	return _Nj._ce(_1i);
}

function ds_queue_destroy(_Qe)
{
	_Nj._lh(yyGetInt32(_Qe));
}

function ds_queue_clear(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	var _1i=_Nj._F4(_Qe);
	if(!_1i)
	{
		_I3("Error: invalid ds_queue ID (ds_queue_clear)");
		return;
	}
	_1i=[];
	_Nj.Set(_Qe,_1i);
}

function ds_queue_copy(_ji,_mh)
{
	_ji=yyGetInt32(_ji);
	var _Bi=_Nj._F4(_ji);
	if(_Bi==null)
	{
		_I3("Error: invalid DEST ds_queue ID (ds_queue_copy)");
		return;
	}
	var _Ci=_Nj._F4(yyGetInt32(_mh));
	if(_Ci==null)
	{
		_I3("Error: invalid SOURCE ds_queue ID (ds_queue_copy)");
		return;
	}
	_Bi=_Ci.slice();
	_Nj.Set(_ji,_Bi);
}

function ds_queue_size(_Qe)
{
	var _1i=_Nj._F4(yyGetInt32(_Qe));
	if(_1i==null)
	{
		_I3("Error: invalid ds_queue ID (ds_queue_size)");
		return 0;
	}
	return _1i.length;
}

function ds_queue_empty(_Qe)
{
	return(ds_queue_size(yyGetInt32(_Qe))==0);
}

function ds_queue_enqueue()
{
	var _Di=arguments;
	var _Ei=arguments.length;
	var _Mj=_Nj._F4(_Di[0]);
	if(!_Mj)
	{
		_I3("Error: invalid ds_queue ID (ds_queue_enqueue)");
		return;
	}
	for(var i=1;i<_Ei;i++)
	{
		_Mj.push(_Di[i]);
	}
	return;
}

function ds_queue_dequeue(_Qe)
{
	var _1i=_Nj._F4(yyGetInt32(_Qe));
	if(_1i==null)
	{
		_I3("Error: invalid ds_queue ID (ds_queue_dequeue)");
		return 0;
	}
	return _1i.shift();
}

function ds_queue_head(_Qe)
{
	var _1i=_Nj._F4(yyGetInt32(_Qe));
	if(_1i==null)
	{
		_I3("Error: invalid ds_queue ID (ds_queue_head)");
		return 0;
	}
	return _1i[0];
}

function ds_queue_tail(_Qe)
{
	var _1i=_Nj._F4(yyGetInt32(_Qe));
	if(_1i==null)
	{
		_I3("Error: invalid ds_queue ID (ds_queue_tail)");
		return 0;
	}
	return _1i[_1i.length-1];
}

function ds_queue_write(_Qe)
{
	var _Mj=_Nj._F4(yyGetInt32(_Qe));
	if(_Mj==null)
	{
		_I3("Error: invalid ds_queue ID (ds_queue_write)");
		return "";
	}
	var _Sg=_Mj.length;
	var _Yh=buffer_create(16384,_Zh,1);
	buffer_write(_Yh,__h,203);
	buffer_write(_Yh,__h,_Sg);
	buffer_write(_Yh,__h,0);
	buffer_write(_Yh,__h,_Sg);
	for(var i=0;i<_Sg;i++)
	{
		var _0d=_Mj[i];
		_0i(_Yh,_0d);
	}
	var _1i=_2i(_Yh);
	buffer_delete(_Yh);
	return _1i;
}

function ds_queue_read(_Qe,_3i)
{
	_Qe=yyGetInt32(_Qe);
	var _Mj=_Nj._F4(_Qe);
	if(_Mj==null)
	{
		_I3("Error: invalid ds_queue ID (ds_queue_read)");
		return false;
	}
	if(_3i=="{")
	{
		try
		{
			_Mj=JSON.parse(_3i);
			_Nj.Set(_Qe,_Mj);
		}
		catch(_5i)
		{
			_I3("Error: reading ds_queue JSON.");
			return false;
		}
	}
	else 
	{
		var _Yh=_6i(_3i);
		if(_Yh<0)return false;
		buffer_seek(_Yh,_7i,0);
		var id=buffer_read(_Yh,_8i);
		var version;
		if(id==202)
		{
			version=3;
		}
		else if(id==203)
		{
			version=0;
		}
		else 
		{
			_I3("Error: unrecognised format - resave the queue to update/fix issues. (ds_queue_read)");
			return false;
		}
		var last=buffer_read(_Yh,_8i);
		var first=buffer_read(_Yh,_8i);
		var _Sg=buffer_read(_Yh,_8i);
		_Mj=[];
		_Nj.Set(_Qe,_Mj);
		for(var i=0;i<last;i++)
		{
			var _0d=_9i(_Yh,version);
			if(first<=0)
			{
				_Mj.push(_0d);
			}
			first--;
		}
		buffer_delete(_Yh);
	}
	return true;
}

function ds_stack_create()
{
	var _1i=[];
	return _Oj._ce(_1i);
}

function ds_stack_destroy(_Qe)
{
	_Oj._lh(yyGetInt32(_Qe));
}

function ds_stack_clear(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	var _1i=_Oj._F4(_Qe);
	if(_1i==null)
	{
		_I3("Error: invalid ds_stack ID (ds_stack_clear)");
		return;
	}
	_1i=[];
	_Oj.Set(_Qe,_1i);
}

function ds_stack_copy(_Qe,_mh)
{
	_Qe=yyGetInt32(_Qe);
	var _Bi=_Oj._F4(_Qe);
	if(_Bi==null)
	{
		_I3("Error: invalid DEST ds_stack ID (ds_stack_clear)");
		return;
	}
	var _Ci=_Oj._F4(yyGetInt32(_mh));
	if(_Ci==null)
	{
		_I3("Error: invalid SOURCE ds_stack ID (ds_stack_clear)");
		return;
	}
	_Bi=_Ci.slice();
	_Oj.Set(_Qe,_Bi);
}

function ds_stack_size(_Qe)
{
	var _1i=_Oj._F4(yyGetInt32(_Qe));
	if(_1i==null)
	{
		_I3("Error: invalid ds_stack ID (ds_stack_size)");
		return 0;
	}
	return _1i.length;
}

function ds_stack_empty(_Qe)
{
	var _1i=_Oj._F4(yyGetInt32(_Qe));
	if(_1i==null)
	{
		_I3("Error: invalid ds_stack ID (ds_stack_empty)");
		return true;
	}
	if(_1i.length==0)return true;
	else return false;
}

function ds_stack_push(_Qe,_C2)
{
	var _Di=arguments;
	var _Ei=arguments.length;
	var stack=_Oj._F4(yyGetInt32(_Qe));
	if(!stack)
	{
		_I3("Error: invalid ds_stack ID (ds_stack_push)");
		return;
	}
	for(var i=1;i<_Ei;i++)
	{
		stack.push(_Di[i]);
	}
}

function ds_stack_pop(_Qe)
{
	var _1i=_Oj._F4(yyGetInt32(_Qe));
	if(_1i==null)
	{
		_I3("Error: invalid ds_stack ID (ds_stack_pop)");
		return undefined;
	}
	return _1i.pop();
}

function ds_stack_top(_Qe)
{
	var _1i=_Oj._F4(yyGetInt32(_Qe));
	if(_1i==null)
	{
		_I3("Error: invalid ds_stack ID (ds_stack_pop)");
		return 0;
	}
	return _1i[_1i.length-1];
}

function ds_stack_write(_Qe)
{
	var _1i=_Oj._F4(yyGetInt32(_Qe));
	if(_1i==null)
	{
		_I3("Error: invalid ds_stack ID (ds_stack_write)");
		return;
	}
	var _Sg=_1i.length;
	var _Yh=buffer_create(16384,_Zh,1);
	buffer_write(_Yh,__h,103);
	buffer_write(_Yh,__h,_Sg);
	for(var i=0;i<_Sg;i++)
	{
		var _0d=_1i[i];
		_0i(_Yh,_0d);
	}
	var _Pj=_2i(_Yh);
	buffer_delete(_Yh);
	return _Pj;
}

function ds_stack_read(_Qe,_3i)
{
	_Qe=yyGetInt32(_Qe);
	var _1i=_Oj._F4(_Qe);
	if(_1i==null)
	{
		_I3("Error: invalid ds_stack ID (ds_stack_read)");
		return false;
	}
	if(_3i[0]=="{")
	{
		try
		{
			_1i=JSON.parse(_3i);
			_Oj.Set(_Qe,_1i);
		}
		catch(_5i)
		{
			_I3("Error: reading ds_stack JSON.");
			return false;
		}
	}
	else 
	{
		var _Yh=_6i(_3i);
		if(_Yh<0)return false;
		buffer_seek(_Yh,_7i,0);
		var id=buffer_read(_Yh,_8i);
		var version;
		if(id==102)
		{
			version=3;
		}
		else if(id==103)
		{
			version=0;
		}
		else 
		{
			_I3("Error: unrecognised format - resave the stack to update/fix issues. (ds_stack_read)");
			return false;
		}
		var _Sg=buffer_read(_Yh,_8i);
		_1i=[];
		_Oj.Set(_Qe,_1i);
		for(var i=0;i<_Sg;i++)
		{
			var _0d=_9i(_Yh,version);
			_1i.push(_0d);
		}
		buffer_delete(_Yh);
	}
	return true;
}
var _Qj=false;

function _Rj(_C2)
{
	var _Sj=null;
	if(typeof(_C2)=="object")
	{
		_Sj=_C2;
	}
	else 
	{
		var _Tj=yyGetInt32(_C2);
		_Sj=_Uj._Vj(_Tj);
	}
	return _Sj;
}

function animcurve_get(_Wj)
{
	if(arguments.length!=1)
	{
		_I3("animcurve_get() - wrong number of arguments");
		return;
	}
	var _Sj=_Rj(_Wj);
	if(_Sj==null)
	{
		_I3("animcurve_get() - specified curve not valid");
	}
	else 
	{
		return _Sj;
	}
	return -1;
}

function animcurve_get_channel_index(_Xj,_Yj)
{
	var result=-1;
	if(arguments.length!=2)
	{
		_I3("animcurve_get_channel_index() - wrong number of arguments");
		return result;
	}
	var _Sj=_Rj(_Xj);
	if(_Sj==null)
	{
		_I3("animcurve_get_channel_index() - specified curve not valid");
		return result;
	}
	var name=yyGetString(_Yj);
	for(var i=0;i<_Sj._Zj;i++)
	{
		var __j=_Sj._0k[i];
		if((__j!=null)&&(__j._1k!=null)&&__j._1k==name)
		{
			result=i;
			break;
		}
	}
	return result;
}

function animcurve_get_channel(_Xj,_2k)
{
	var result=-1;
	if(arguments.length!=2)
	{
		_I3("animcurve_get_channel() - wrong number of arguments");
		return;
	}
	if(typeof(_Xj)!="number"&&typeof(_Xj)!="object")
	{
		_I3("animcurve_get_channel() - first parameter must be either curve ID or curve object");
		return;
	}
	if(typeof(_2k)!="number"&&typeof(_2k)!="string")
	{
		_I3("animcurve_get_channel() - second parameter must be either channel index or channel name");
		return;
	}
	var _Sj=_Rj(_Xj);
	if(_Sj!=null)
	{
		if(typeof(_2k)=="number")
		{
			var _3k=yyGetInt32(_2k);
			if((_3k<0)||(_3k>=_Sj._Zj))
			{
				_I3("animcurve_get_channel() - specified channel index out of range");
				return;
			}
			if(_Sj._0k[_3k]==null)
			{
				_I3("animcurve_get_channel() - specified channel is invalid");
				return;
			}
			result=_Sj._0k[_3k];
		}
		else 
		{
			var name=yyGetString(_2k);
			for(var i=0;
i<_Sj._Zj;i++)
			{
				var __j=_Sj._0k[i];
				if((__j!=null)&&(__j._1k!=null)&&__j._1k==name)
				{
					result=__j;
					break;
				}
			}
		}
	}
	return result;
}

function animcurve_channel_evaluate(_4k,_5k)
{
	if(arguments.length!=2)
	{
		_I3("animcurve_channel_evaluate() - wrong number of arguments");
		return;
	}
	if(_4k==null||!(_4k instanceof _6k))
	{
		_I3("animcurve_channel_evaluate() - first parameter is not valid animation curve channel");
		return;
	}
	return _4k._7k(yyGetReal(_5k));
}

function animcurve_create()
{
	var _Sj=_Uj._8k();
	if(_Sj==null)
	{
		_I3("animcurve_create() - could not create new curve");
	}
	return _Sj;
}

function animcurve_destroy(_Xj)
{
	if(arguments.length!=1)
	{
		_I3("animcurve_destroy() - requires a curve ID or object");
	}
	var _Sj=_Rj(_Xj);
	if(_Sj==null)
	{
		_I3("animcurve_destroy() - specified curve not valid");
	}
	else if(_Sj._9k==true)
	{
		_I3("animcurve_destroy() - can't delete a curve created in the IDE");
	}
	else 
	{
		_Uj._ak(_Sj);
	}
}

function animcurve_exists(_Xj)
{
	if(arguments.length!=1)
	{
		_I3("animcurve_exists() - requires a curve ID or struct");
	}
	var _bk=false;
	if(typeof(_Xj)=="object")
	{
		if(_Xj instanceof _ck)
		{
			if(_Uj._dk(_Xj))
			{
				_bk=true;
			}
		}
	}
	else 
	{
		var _Tj=yyGetInt32(_Xj);
		if(_Uj._Vj(_Tj)!=null)
		{
			_bk=true;
		}
	}
	return _bk?1.0:0.0;
}

function animcurve_channel_new()
{
	return new _6k();
}

function animcurve_point_new()
{
	return new _ek();
}

function _fk(_gk)
{
	var _hk=_ik._jk(_gk);
	if((_hk===null)||(_hk===undefined))
	{
		return false;
	}
	return true;
}

function _kk(_gk)
{
	var _lk=_ik._jk(_gk);
	if(!_lk)return "";
	return _lk.pName;
}

function _mk(_gk)
{
	return _kk(_gk);
}

function _nk(_gk)
{
	var _lk=_ik._jk(_gk);
	if(!_lk)return 0;
	if(_lk._ok===undefined)return 0;
	return _lk._ok.ow;
}

function _pk(_gk)
{
	var _lk=_ik._jk(_gk);
	if(!_lk)return 0;
	if(_lk._ok===undefined)return 0;
	return _lk._ok.oh;
}

function _qk(_r4,_s4,_eh,_fh,_rk,_sk)
{
	var _tk=surface_create(_eh,_fh,_uk);
	var _Bi=_vk._F4(_tk);
	var _wk=_Bi.getContext('2d');
	_wk.drawImage(canvas,-_r4,-_s4);
	if(_rk)
	{
		_xk(_wk,_eh,_fh);
	}
	var _yk=new _zk();
	var _C3=new _Ak();
	_yk._ok=_C3;
	_C3.x=0;
	_C3.y=0;
	_C3.w=_eh;
	_C3.h=_fh;
	_C3.XOffset=0;
	_C3.YOffset=0;
	_C3.CropWidth=_C3.w;
	_C3.CropHeight=_C3.h;
	_C3.ow=_C3.w;
	_C3.oh=_C3.h;
	_C3.tp=_tk;
	_C3.texture=_Bi;
	return _ik._Bk(_yk);
}

function _Ck(_Qe,_r4,_s4,_eh,_fh,_rk,_sk)
{
	var _Ci=_vk._F4(_Qe);
	var _tk=surface_create(_eh,_fh,_uk);
	var _Bi=_vk._F4(_tk);
	var _wk=_Bi.getContext('2d');
	_wk.drawImage(_Ci,-_r4,-_s4);
	if(_rk)
	{
		_xk(_wk,_eh,_fh);
	}
	var _yk=new _zk();
	var _C3=new _Ak();
	_yk._ok=_C3;
	_C3.x=0;
	_C3.y=0;
	_C3.w=_eh;
	_C3.h=_fh;
	_C3.XOffset=0;
	_C3.YOffset=0;
	_C3.CropWidth=_C3.w;
	_C3.CropHeight=_C3.h;
	_C3.ow=_C3.w;
	_C3.oh=_C3.h;
	_C3.tp=_tk;
	_C3.texture=_Bi;
	return _ik._Bk(_yk);
}

function _Dk(_eh,_fh,_nb)
{
	var _Ek=surface_create(_eh,_fh,_uk);
	var _Fk=_vk._F4(_Ek);
	var _wk=_Fk.getContext('2d');
	_wk.globalAlpha=1.0;
	_wk.fillStyle=_Gk(_ob(_nb),1);
	_wk.fillRect(0,0,_eh,_fh);
	var _yk=new _zk();
	var _C3=new _Ak();
	_yk._ok=_C3;
	_C3.x=0;
	_C3.y=0;
	_C3.w=_eh;
	_C3.h=_fh;
	_C3.XOffset=0;
	_C3.YOffset=0;
	_C3.CropWidth=_C3.w;
	_C3.CropHeight=_C3.h;
	_C3.ow=_C3.w;
	_C3.oh=_C3.h;
	_C3.tp=_Ek;
	_C3.texture=_Fk;
	return _ik._Bk(_yk);
}
var _Hk=_Dk;

function _Ik(_eh,_fh,_Jk,_Kk,_eb)
{
	var _Ek=surface_create(_eh,_fh,_uk);
	var _Fk=_vk._F4(_Ek);
	var _wk=_Fk.getContext('2d');
	_wk.globalAlpha=1.0;
	var _Lk;
	if(_eb==0)
	{
		_Lk=_wk.createLinearGradient(0,0,_eh,0);
	}
	else 
	{
		_Lk=_wk.createLinearGradient(0,0,0,_fh);
	}
	_Lk.addColorStop("0",_Gk(_ob(_Jk),1));
	_Lk.addColorStop("1.0",_Gk(_ob(_Kk),1));
	_wk.fillStyle=_Lk;
	_wk.fillRect(0,0,_eh,_fh);
	var _yk=new _zk();
	var _C3=new _Ak();
	_yk._ok=_C3;
	_C3.x=0;
	_C3.y=0;
	_C3.w=_eh;
	_C3.h=_fh;
	_C3.XOffset=0;
	_C3.YOffset=0;
	_C3.CropWidth=_C3.w;
	_C3.CropHeight=_C3.h;
	_C3.ow=_C3.w;
	_C3.oh=_C3.h;
	_C3.tp=_Ek;
	_C3.texture=_Fk;
	return _ik._Bk(_yk);
}

function _Mk(_u3)
{
	return _ik._Nk(_u3);
}

function _Ok(_Pk)
{
	var _lk=_ik._jk(_Pk);
	if(_lk!=null&&_lk!=undefined)
	{
		var _Qk=_Rk(_lk._ok);
		var _yk=new _zk();
		_yk.pName=_lk.pName;
		_yk.transparent=_lk.transparent;
		_yk.smooth=_lk.smooth;
		_yk.preload=_lk.preload;
		_yk._Sk=true;
		var _C3=_yk._ok=new _Ak();
		_C3._Sk(_lk._ok);
		_C3.tp=_Tk(_Qk);
		_C3.texture=_G3[_C3.tp];
		_C3.texture.complete=true;
		_C3.x=0;
		_C3.y=0;
		return _ik._Bk(_yk);
	}
	return -1;
}

function _Uk(_ji,_ih)
{
	var _Bi=_ik._jk(_ji);
	var _Ci=_ik._jk(_ih);
	if(_Bi!=null&&_Bi!=undefined&&_Ci!=null&&_Ci!=undefined)
	{
		var _Qk=_Rk(_Ci._ok);
		var _yk=new _zk();
		_yk.pName=_Ci.pName;
		_yk.transparent=_Ci.transparent;
		_yk.smooth=_Ci.smooth;
		_yk.preload=_Ci.preload;
		_yk._ok=new _Ak();
		_yk._ok._Sk(_Ci._ok);
		_yk._ok.tp=_Tk(_Qk);
		_yk._ok.texture=_G3[_yk._ok.tp];
		_yk._ok.texture.complete=true;
		_yk._ok.x=0;
		_yk._ok.y=0;
		return _ik._Vk(_ji,_yk);
	}
}

function _Wk(_Pk,_r4,_s4)
{
	var _Qk=_ik._jk(_Pk);
	if(!_Qk)return;
	_Xk(_Qk._ok,_r4,_s4,_lb);
}

function _Yk(_Pk,_r4,_s4,_eh,_fh)
{
	var _Qk=_ik._jk(_Pk);
	if(!_Qk)return;
	_Zk(_Qk._ok,_r4,_s4,_eh,_fh,0xffffff,_lb);
}

function __k(_Pk,_r4,_s4)
{
	var _Qk=_ik._jk(_Pk);
	if(!_Qk)return;
	_0l(_Qk._ok,_r4,_s4,1,1,true,true,0xffffff,_lb);
}

function _1l(_Pk,_2l,_3l,_q7,_r7,_r4,_s4)
{
	var _Qk=_ik._jk(_Pk);
	if(!_Qk)return;
	_4l(_Qk._ok,_2l,_3l,_q7,_r7,_r4,_s4,1,1,_5l,_lb);
}

function _6l(_Pk,_r4,_s4,_7l,_8l,_z3,_9l,_y8)
{
	var _Qk=_ik._jk(_Pk);
	if(!_Qk)return;
	var c=_ob(_9l);
	_al(_Qk._ok,0,0,_r4,_s4,_7l,_8l,_z3*Math.PI/180.0,c,c,c,c,_y8);
}

function _bl(_Pk,_r4,_s4,_eh,_fh,_9l,_y8)
{
	var _Qk=_ik._jk(_Pk);
	if(!_Qk)return;
	_9l=_ob(_9l);
	_Zk(_Qk._ok,_r4,_s4,_eh,_fh,_9l,_y8);
}

function _cl(_Pk,_r4,_s4,_7l,_8l,_9l,_y8)
{
	var _Qk=_ik._jk(_Pk);
	if(!_Qk)return;
	_9l=_ob(_9l);
	_0l(_Qk._ok,_r4,_s4,_7l,_8l,true,true,_9l,_y8);
}

function _dl(_Pk,_2l,_3l,_q7,_r7,_r4,_s4,_7l,_8l,_9l,_y8)
{
	var _Qk=_ik._jk(_Pk);
	if(!_Qk)return;
	_9l=_ob(_9l);
	_4l(_Qk._ok,_2l,_3l,_q7,_r7,_r4,_s4,_7l,_8l,_9l,_y8);
}

function _el(_Pk,_2l,_3l,_q7,_r7,_r4,_s4,_7l,_8l,_z3,_fl,_gl,_hl,_il,_y8)
{
	var _lk=_ik._jk(_Pk);
	if(!_lk)return;
	_fl=_ob(_fl);
	_gl=_ob(_gl);
	_hl=_ob(_hl);
	_il=_ob(_il);
	_jl(_lk._ok,_2l,_3l,_q7,_r7,_r4,_s4,_7l,_8l,_z3*Math.PI/180.0,_fl,_gl,_hl,_il,_y8);
}

function _kl(_u3,_Pk)
{
	var _Bi=_ik._jk(_u3);
	var _Ci=_ik._jk(_Pk);
	if(!_Bi||!_Ci)return;
	if(!_Bi._Sk)
	{
		var _Qk=_Rk(_Bi._ok);
		var _yk=new _zk();
		_Bi._ok.tp=_Tk(_Qk);
		_Bi._ok.texture=_G3[_Ci._ok.tp];
		_Bi._ok.texture.complete=true;
		_Bi._ok.x=0;
		_Bi._ok.y=0;
		_Bi._Sk=true;
	}
	_ll(_Bi._ok,_Ci._ok);
}

function _ml(_jj,_rk,_sk)
{
	var _yk=new _zk();
	_yk.pName="";
	_yk.transparent=_rk;
	_yk.smooth=_sk;
	_yk.preload=true;
	var _nl=_ik._Bk(_yk);
	if(_jj.substring(0,5)=="file:")return -1;
	var _ol=_jj;
	var _T3=_L7(_ol);
	_G3[_T3].onload=_pl;
	_G3[_T3].onerror=_ql;
	_be._ce(_nl,_jj,_rl,_G3[_T3]);
	var _C3=new _Ak();
	_yk._ok=_C3;
	_C3.x=0;
	_C3.y=0;
	_C3.w=0;
	_C3.h=0;
	_C3.XOffset=0;
	_C3.YOffset=0;
	_C3.CropWidth=_C3.w;
	_C3.CropHeight=_C3.h;
	_C3.ow=_C3.w;
	_C3.oh=_C3.h;
	_C3.tp=_T3;
	_C3.texture=_G3[_C3.tp];
	return _nl;
}

function _sl(_u3,_jj,_rk,_sk)
{
	var _yk=_ik._jk(_u3);
	_yk.transparent=_rk;
	_yk.smooth=_sk;
	if(_jj.substring(0,5)=="file:")return -1;
	var _ol=_jj;
	var _tl=_yk._ok.texture._R7;
	var _T3=_L7(_ol);
	_G3[_T3]._R7=_tl;
	_G3[_T3].onload=_pl;
	_G3[_T3].onerror=_ql;
	_be._ce(_u3,_jj,_rl,_G3[_T3]);
	var _C3=_yk._ok;
	_C3.x=0;
	_C3.y=0;
	_C3.w=0;
	_C3.h=0;
	_C3.XOffset=0;
	_C3.YOffset=0;
	_C3.CropWidth=_C3.w;
	_C3.CropHeight=_C3.h;
	_C3.ow=_C3.w;
	_C3.oh=_C3.h;
	_C3._ul=null;
	_C3._vl=0;
	_C3.tp=_T3;
	_C3.texture=_G3[_C3.tp];
	return _u3;
}

function _wl(_u3)
{
	var _Bi=_ik._jk(_u3);
	if(_Bi)
	{
		return(
		{
			_fb:_Bi._ok.texture,_gb:_Bi._ok		}
		);
	}
	return null;
}

function _xl(_u3)
{
	var _Bi=_ik._jk(_u3);
	if(_Bi)
	{
		var _C3=_Bi._ok;
		var texture=_C3.texture;
		var _yl=1.0/texture._xb;
		var _zl=1.0/texture._yb;
		var _Al=[];
		_Al.push(_C3.x*_yl,_C3.y*_zl,(_C3.x+_C3.CropWidth)*_yl,(_C3.y+_C3.CropHeight)*_zl);
		return _Al;
	}
	return null;
}

function _Bl(_Cl)
{
	var _lk=_ik._F4(_Cl);
	if(_lk===null)
	{
		return -1;
	}
	var _C3=_lk._ok;
	if(_C3.texture)
	{
		if(_C3.texture._R7)
		{
			_S7(_C3.texture._R7);
			return 0;
		}
	}
	return -1;
}

function _Dl(_El)
{
	if(Array.isArray(_El))
	{
		for(var _05=0;_05<_El.length;_05++)
		{
			var _lk=_ik._F4(_El[_05]);
			if(_lk===null)
			{
				return -1;
			}
			var _C3=_lk._ok;
			if(_C3.texture)
			{
				if(_C3.texture._R7)
				{
					_S7(_C3.texture._R7);
					return 0;
				}
			}
		}
		return 0;
	}
	else 
	{
		return -1;
	}
}

function _Fl(_Cl)
{
	var _lk=_ik._F4(_Cl);
	if(_lk===null)
	{
		return -1;
	}
	var _C3=_lk._ok;
	if(_C3.texture)
	{
		if(_C3.texture._R7)
		{
			_Gl(_C3.texture._R7);
			return 0;
		}
	}
	return -1;
}

function _Hl(_El)
{
	if(Array.isArray(_El))
	{
		for(var _05=0;_05<_El.length;_05++)
		{
			var _lk=_ik._F4(_El[_05]);
			if(_lk===null)
			{
				return -1;
			}
			var _C3=_lk._ok;
			if(_C3.texture)
			{
				if(_C3.texture._R7)
				{
					_Gl(_C3.texture._R7);
					return 0;
				}
			}
		}
		return 0;
	}
	else 
	{
		return -1;
	}
}
var _Il=[];
var _Jl=0;

function _Kl(target)
{
	if(typeof target.onselectstart!="undefined")
	{
		target.onselectstart=
function()
		{
			return false;
		}
		;
	}
	else if(typeof target.style.MozUserSelect!="undefined")
	{
		target.style.MozUserSelect="none";
	}
	else 
	{
		target.onmousedown=
function()
		{
			return false;
		}
		;
	}
	target.style.cursor="default";
}

function _Ll(_r4,_s4,_Ml,_Nl,_Ol,_Pl)
{
	var __i=document.getElementById("canvas").parentNode;
	var _Ql=document.getElementById("canvas");
	var _Rl=document.createElement("div");
	_Rl.style.cssText="-moz-user-select: -moz-none;-khtml-user-select: none;-webkit-user-select: none;-ms-user-select: none;user-select: none;";
	_Rl._Sl=false;
	_Rl.setAttribute("id","gamemaker_image");
	_Rl.style.position="absolute";
	_Rl._L8=_Ml;
	var left=_r4+_Ml.tpe_XOffset;
	var top=_s4+_Ml.tpe_YOffset;
	_Rl.style.left=left+"px";
	_Rl.style.top=top+"px";
	_Rl.style.width=_Ml.tpe_CropWidth+"px";
	_Rl.style.height=_Ml.tpe_CropHeight+"px";
	_Rl.style.padding="0px";
	_Rl.style.margin="0px";
	_Rl.style.border="0px";
	_Kl(_Rl);
	_Rl.angle=0;
	_Rl.x=_r4;
	_Rl.y=_s4;
	var _Tl=document.createElement('button');
	_Tl.onmousemove=_Ul;
	_Tl.type="button";
	_Tl.style.cursor=_Rl.style.cursor=_Ql.style.cursor;
	_Tl.style.width=_Ml.tpe_CropWidth+"px";
	_Tl.style.height=_Ml.tpe_CropHeight+"px";
	_Tl.style.opacity="1.0";
	_Tl.style.backgroundColor="rgba(0, 0, 0, 0.0)";
	_Tl.style.border="0px";
	_Tl.style.backgroundImage="url("+_Ml.tpe_texture.src+")";
	_Tl.style.backgroundPosition=(-_Ml.tpe_x)+"px "+(-_Ml.tpe_y)+"px";
	_Tl.onclick=
function()
	{
		if((_Nl.substring(0,6)=="http:/")||(_Nl.substring(0,6)=="https:"))
		{
			var _Vl=window.open(_Nl,_Ol,_Pl);
			return false;
		}
		else 
		{
			var pFunc=eval("gml_Script_"+_Nl);
			if(pFunc)pFunc(null,null,_Ol,_Pl);
			return false;
		}
	}
	;
	_Rl.insertBefore(_Tl,null);
	__i.insertBefore(_Rl,null);
	return _Rl;
}

function clickable_add(_r4,_s4,_Ml,_Nl,_Ol,_Pl)
{
	_Il[_Jl]=_Ll(yyGetReal(_r4),yyGetReal(_s4),_Ml,yyGetString(_Nl),yyGetString(_Ol),yyGetString(_Pl));
	return _Jl++;
}

function clickable_add_ext(_r4,_s4,_Ml,_Nl,_Ol,_Pl,_Wl,_y8)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_Nl=yyGetString(_Nl);
	_Ol=yyGetString(_Ol);
	_Pl=yyGetString(_Pl);
	_Il[_Jl]=_Ll(_r4,_s4,_Ml,_Nl,_Ol,_Pl);
	clickable_change_ext(_Jl,_Ml,_r4,_s4,yyGetReal(_y8),yyGetReal(_Wl));
	return _Jl++;
}

function clickable_exists(_Qe)
{
	var _Xl=_Il[yyGetInt32(_Qe)];
	if(_Xl)
	{
		return true;
	}
	else 
	{
		return false;
	}
}

function clickable_delete(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	var _Xl=_Il[_Qe];
	if(_Xl)
	{
		_Xl.parentNode.removeChild(_Xl);
		_Il[_Qe]=undefined;
	}
}

function clickable_change(_Qe,_Ml,_r4,_s4)
{
	var _Xl=_Il[yyGetInt32(_Qe)];
	if(_Xl)
	{
		if(_Xl.firstChild)
		{
			var _Yl=_Xl.firstChild;
			var left=yyGetReal(_r4)+_Ml.tpe_XOffset;
			var top=yyGetReal(_s4)+_Ml.tpe_YOffset;
			_Xl.style.left=left+"px";
			_Xl.style.top=top+"px";
			_Xl.style.width=(_Ml.tpe_CropWidth)+"px";
			_Xl.style.height=(_Ml.tpe_CropHeight)+"px";
			_Yl.style.left=_Xl.style.left;
			_Yl.style.right=_Xl.style.top;
			_Yl.style.width=_Xl.style.width;
			_Yl.style.height=_Xl.style.height;
			_Yl.style.backgroundPosition=(-_Ml.tpe_x)+"px "+(-_Ml.tpe_y)+"px";
			var _Zl=true;
			var __l="url("+_Ml.tpe_texture.src+")";
			if(typeof(_Yl.style.backgroundImage)!=undefined)
			{
				if(_Yl.style.backgroundImage==__l)
				{
					_Zl=false;
				}
			}
			if(_Zl==true)
			{
				_Yl.style.backgroundImage=__l;
			}
		}
	}
}

function clickable_change_ext(_Qe,_Ml,_r4,_s4,_Wl,_y8)
{
	_Qe=yyGetInt32(_Qe);
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_Wl=yyGetReal(_Wl);
	_y8=yyGetReal(_y8);
	clickable_change(_Qe,_Ml,_r4,_s4);
	var _Xl=_Il[_Qe];
	if(_Xl)
	{
		var _Yl=_Xl.firstChild;
		if(_Xl.x!=_r4)
		{
			_Xl.style.left=_r4+"px";
			_Xl.x=_r4;
		}
		if(_Xl.y!=_s4)
		{
			_Xl.style.top=_s4+"px";
			_Xl.y=_s4;
		}
		if(_Yl)
		{
			_Yl.style.width=_Xl.style.width=(_Ml.tpe_CropWidth*_Wl)+"px";
			_Yl.style.height=_Xl.style.height=(_Ml.tpe_CropHeight*_Wl)+"px";
			var _0m=(_Wl*_Ml.tpe_texture.width*100)/(_Ml.tpe_CropWidth);
			_Yl.style.backgroundSize=(_Wl*_Ml.tpe_texture.width)+"px "+(_Wl*_Ml.tpe_texture.height)+"px";
			var _1m=(-_Ml.tpe_x*_Wl);
			var _2m=(-_Ml.tpe_y*_Wl);
			_Yl.style.backgroundPosition=_1m+"px "+_2m+"px";
			if(_Yl.style.opacity!=_y8)_Yl.style.opacity=_y8;
		}
	}
}

function clickable_set_style(_3m,_4m)
{
	var _Xl=_Il[yyGetInt32(_3m)];
	var _c6=_d6._F4(yyGetInt32(_4m));
	if(_Xl&&_c6)
	{
		var _Yl=_Xl.firstChild;
		if(_Yl)
		{
			for(const [key,_0d] of _c6)
			{
				_Yl.style[key]=_0d;
			}
		}
	}
}

function _5m(_6m,_r4,_s4,_ui,_ah,_7m)
{
	return _8m(_6m,yyGetInt32(_ui),yyGetBool(_7m),_9m,_r4,_s4,_ah,
function(_am)
	{
		var _bm=_am._cm(_r4,_s4,_ah);
		if(!_bm)
		{
			return _9m;
		}
		return _dm(_em,_am.id);
	}
	);
}
;

function _fm(_6m,_r4,_s4,_ui,_ah,_7m,_U6)
{
	_8m(_6m,yyGetInt32(_ui),yyGetBool(_7m),_9m,_r4,_s4,_ah,
function(_am)
	{
		if(_am._cm(_r4,_s4,_ah))
		{
			_U6.push(_dm(_em,_am.id));
		}
		return _9m;
	}
	);
}
;

function collision_point(_6m,_r4,_s4,_ui,_ah,_7m)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_ah=yyGetBool(_ah);
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			if(_jm(_r4,_s4,_ui,null,_ah))
			{
				return _ui;
			}
			return _9m;
		}
		else 
		{
			var id=_5m(_6m,_r4,_s4,_ui,_ah,_7m);
			return id;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				if(_jm(_r4,_s4,_km,null,_ah))
				{
					return _km;
				}
			}
			else 
			{
				var id=_5m(_6m,_r4,_s4,_km,_ah,_7m);
				if(id!=_9m)return id;
			}
		}
		return _9m;
	}
	else 
	{
		var id=_5m(_6m,_r4,_s4,_ui,_ah,_7m);
		return id;
	}
}
;

function _lm(_mm,_nm,_om,_pm)
{
	var _qm=[];
	for(var i=0;i<_mm.length;++i)
	{
		var _rm=_mm[i];
		if(_rm instanceof _gm)
		{
			var _hm=_rm.type;
			if(_hm==_im)
			{
				var _sm=_tm._um();
				var _vm=_tm._wm(_sm,_rm.value);
				var _ha=_vm.x-_om;
				var _ia=_vm.y-_pm;
				var _xm=(_ha*_ha)+(_ia*_ia);
				var __i=
				{
					_ym:_rm,_zm:_xm				}
				;
				_qm.push(__i);
				_rm=null;
			}
			else _rm=yyInst(null,null,yyGetInt32(_rm));
		}
		if(_rm)
		{
			var _ha=_rm.x-_om;
			var _ia=_rm.y-_pm;
			var _xm=(_ha*_ha)+(_ia*_ia);
			var __i=
			{
				_ym:_dm(_em,_rm.id),_zm:_xm			}
			;
			_qm.push(__i);
		}
	}
	_qm.sort(
function(_i3,_h3)
	{
		return _i3._zm-_h3._zm;
	}
	);
	for(var i=0;i<_qm.length;++i)
	{
		_nm._ce(_qm[i]._ym);
	}
}
;

function collision_point_list(_6m,_r4,_s4,_ui,_ah,_7m,_U6,_Am)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_ah=yyGetBool(_ah);
	var _Ai=_yi._F4(yyGetInt32(_U6));
	if(!_Ai)
	{
		_I3("Error: invalid ds_list ID (instance_position_list)");
		return 0;
	}
	var _Bm=false;
	var _Cm=[];
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			_jm(_r4,_s4,_ui,_Cm,_ah);
			_Bm=true;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				_jm(_r4,_s4,_km,_Cm,_ah);
			}
			else 
			{
				_fm(_6m,_r4,_s4,_km,_ah,_7m,_Cm);
			}
		}
		_Bm=true;
	}
	if(!_Bm)_fm(_6m,_r4,_s4,_ui,_ah,_7m,_Cm);
	var _u7=_Cm.length;
	_lm(_Cm,_Ai,_r4,_s4,_Am);
	return _u7;
}
;

function _Dm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m)
{
	return _8m(_6m,yyGetInt32(_ui),yyGetBool(_7m),_9m,_X5,_Y5,_p5,_q5,_ah,
function(_am)
	{
		var _bm=_am._Em(_X5,_Y5,_p5,_q5,_ah);
		if(!_bm)
		{
			return _9m;
		}
		return _dm(_em,_am.id);
	}
	);
}
;

function collision_rectangle(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_ah=yyGetBool(_ah);
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			if(_Fm(_X5,_Y5,_p5,_q5,_ui,null,_ah))
			{
				return _ui;
			}
			return _9m;
		}
		else 
		{
			var id=_Dm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m);
			return id;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				if(_Fm(_X5,_Y5,_p5,_q5,_km,null,_ah))
				{
					return _km;
				}
			}
			else 
			{
				var id=_Dm(_6m,_X5,_Y5,_p5,_q5,_km,_ah,_7m);
				if(id!=_9m)return id;
			}
		}
		return _9m;
	}
	else 
	{
		var id=_Dm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m);
		return id;
	}
}
;

function _Gm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m,_U6)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_ah=yyGetBool(_ah);
	return _8m(_6m,yyGetInt32(_ui),yyGetBool(_7m),_9m,_X5,_Y5,_p5,_q5,_ah,
function(_am)
	{
		if(_am._Em(_X5,_Y5,_p5,_q5,_ah))
		{
			_U6.push(_dm(_em,_am.id));
		}
		return _9m;
	}
	);
}
;

function collision_rectangle_list(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m,_U6,_Am)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_ah=yyGetBool(_ah);
	var _Ai=_yi._F4(yyGetInt32(_U6));
	if(!_Ai)
	{
		_I3("Error: invalid ds_list ID (instance_position_list)");
		return 0;
	}
	var _Bm=false;
	var _Cm=[];
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			_Fm(_X5,_Y5,_p5,_q5,_ui,_Cm,_ah);
			_Bm=true;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				_Fm(_X5,_Y5,_p5,_q5,_km,_Cm,_ah);
			}
			else 
			{
				_Gm(_6m,_X5,_Y5,_p5,_q5,_km,_ah,_7m,_Cm);
			}
		}
		_Bm=true;
	}
	if(!_Bm)_Gm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m,_Cm);
	var _u7=_Cm.length;
	var _Hm=(_X5+_p5)*0.5;
	var _Im=(_Y5+_q5)*0.5;
	_lm(_Cm,_Ai,_Hm,_Im,_Am);
	return _u7;
}
;

function collision_circle(_6m,_Jm,_Km,_Lm,_ui,_ah,_7m)
{
	return collision_ellipse(_6m,_Jm-_Lm,_Km-_Lm,_Jm+_Lm,_Km+_Lm,_ui,_ah,_7m);
}
;

function collision_circle_list(_6m,_Jm,_Km,_Lm,_ui,_ah,_7m,_U6,_Am)
{
	var _Ai=_yi._F4(yyGetInt32(_U6));
	if(!_Ai)
	{
		_I3("Error: invalid ds_list ID (collision_circle_list)");
		return 0;
	}
	return collision_ellipse_list(_6m,_Jm-_Lm,_Km-_Lm,_Jm+_Lm,_Km+_Lm,_ui,_ah,_7m,_U6,_Am);
}
;

function _Mm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_ah=yyGetBool(_ah);
	return _8m(_6m,yyGetInt32(_ui),yyGetBool(_7m),_9m,_X5,_Y5,_p5,_q5,_ah,
function(_am)
	{
		var _bm=_am._Nm(_X5,_Y5,_p5,_q5,_ah);
		if(!_bm)
		{
			return _9m;
		}
		return _dm(_em,_am.id);
	}
	);
}
;

function _Om(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m,_U6)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_ah=yyGetBool(_ah);
	return _8m(_6m,yyGetInt32(_ui),yyGetBool(_7m),_9m,_X5,_Y5,_p5,_q5,_ah,
function(_am)
	{
		if(_am._Nm(_X5,_Y5,_p5,_q5,_ah))
		{
			_U6.push(_dm(_em,_am.id));
		}
		return _9m;
	}
	);
}
;

function collision_ellipse(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_ah=yyGetBool(_ah);
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			if(_Pm(_X5,_Y5,_p5,_q5,_ui,null,_ah))
			{
				return _ui;
			}
			return _9m;
		}
		else 
		{
			var id=_Mm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m);
			return id;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				if(_Pm(_X5,_Y5,_p5,_q5,_km,null,_ah))
				{
					return _km;
				}
			}
			else 
			{
				var id=_Mm(_6m,_X5,_Y5,_p5,_q5,_km,_ah,_7m);
				if(id!=_9m)return id;
			}
		}
		return _9m;
	}
	else 
	{
		var id=_Mm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m);
		return id;
	}
}
;

function collision_ellipse_list(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m,_U6,_Am)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_ah=yyGetBool(_ah);
	var _Ai=_yi._F4(yyGetInt32(_U6));
	if(!_Ai)
	{
		_I3("Error: invalid ds_list ID (instance_position_list)");
		return 0;
	}
	var _Bm=false;
	var _Cm=[];
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			_Pm(_X5,_Y5,_p5,_q5,_ui,_Cm,_ah);
			_Bm=true;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				_Pm(_X5,_Y5,_p5,_q5,_km,_Cm,_ah);
			}
			else 
			{
				_Om(_6m,_X5,_Y5,_p5,_q5,_km,_ah,_7m,_Cm);
			}
		}
		_Bm=true;
	}
	if(!_Bm)_Om(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m,_Cm);
	var _u7=_Cm.length;
	var _Hm=(_X5+_p5)*0.5;
	var _Im=(_Y5+_q5)*0.5;
	_lm(_Cm,_Ai,_Hm,_Im,_Am);
	return _u7;
}
;

function _Qm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m)
{
	return _8m(_6m,yyGetInt32(_ui),yyGetBool(_7m),_9m,_X5,_Y5,_p5,_q5,_ah,
function(_am)
	{
		var _bm=_am._Rm(_X5,_Y5,_p5,_q5,_ah);
		if(!_bm)
		{
			return _9m;
		}
		return _dm(_em,_am.id);
	}
	);
}
;

function _Sm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m,_U6)
{
	_8m(_6m,yyGetInt32(_ui),yyGetBool(_7m),_9m,_X5,_Y5,_p5,_q5,_ah,
function(_am)
	{
		if(_am._Rm(_X5,_Y5,_p5,_q5,_ah))
		{
			_U6.push(_dm(_em,_am.id));
		}
		return _9m;
	}
	);
}
;

function collision_line(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_ah=yyGetBool(_ah);
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			if(_Tm(_X5,_Y5,_p5,_q5,_ui,null,_ah))
			{
				return _ui;
			}
			return _9m;
		}
		else 
		{
			var id=_Qm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m);
			return id;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				if(_Tm(_X5,_Y5,_p5,_q5,_km,null,_ah))
				{
					return _km;
				}
			}
			else 
			{
				var id=_Qm(_6m,_X5,_Y5,_p5,_q5,_km,_ah,_7m);
				if(id!=_9m)return id;
			}
		}
		return _9m;
	}
	else 
	{
		var id=_Qm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m);
		return id;
	}
}
;

function collision_line_list(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m,_U6,_Am)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_ah=yyGetBool(_ah);
	var _Ai=_yi._F4(yyGetInt32(_U6));
	if(!_Ai)
	{
		_I3("Error: invalid ds_list ID (collision_line_list)");
		return 0;
	}
	var _Bm=false;
	var _Cm=[];
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			_Tm(_X5,_Y5,_p5,_q5,_ui,_Cm,_ah);
			_Bm=true;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				_Tm(_X5,_Y5,_p5,_q5,_km,_Cm,_ah);
			}
			else 
			{
				_Sm(_6m,_X5,_Y5,_p5,_q5,_km,_ah,_7m,_Cm);
			}
		}
		_Bm=true;
	}
	if(!_Bm)_Sm(_6m,_X5,_Y5,_p5,_q5,_ui,_ah,_7m,_Cm);
	var _u7=_Cm.length;
	_lm(_Cm,_Ai,_X5,_Y5,_Am);
	return _u7;
}
;

function point_in_rectangle(_om,_pm,_X5,_Y5,_p5,_q5)
{
	_om=yyGetReal(_om);
	_pm=yyGetReal(_pm);
	if((_om>=yyGetReal(_X5)&&_om<=yyGetReal(_p5))&&(_pm>=yyGetReal(_Y5)&&_pm<=yyGetReal(_q5)))
	{
		return true;
	}
	return false;
}
;

function rectangle_in_rectangle(_Um,_Vm,_Wm,_Xm,_X5,_Y5,_p5,_q5)
{
	_Um=yyGetReal(_Um);
	_Vm=yyGetReal(_Vm);
	_Wm=yyGetReal(_Wm);
	_Xm=yyGetReal(_Xm);
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	var _Ym=0;
	var _Zm=0;
	if(_Um>_Wm)
	{
		_Zm=_Um;
		_Um=_Wm;
		_Wm=_Zm;
	}
	if(_Vm>_Xm)
	{
		_Zm=_Vm;
		_Vm=_Xm;
		_Xm=_Zm;
	}
	if(_X5>_p5)
	{
		_Zm=_X5;
		_X5=_p5;
		_p5=_Zm;
	}
	if(_Y5>_q5)
	{
		_Zm=_Y5;
		_Y5=_q5;
		_q5=_Zm;
	}
	if((_Um>=_X5&&_Um<=_p5)&&(_Vm>=_Y5&&_Vm<=_q5))_Ym|=1;
	if((_Wm>=_X5&&_Wm<=_p5)&&(_Vm>=_Y5&&_Vm<=_q5))_Ym|=2;
	if((_Wm>=_X5&&_Wm<=_p5)&&(_Xm>=_Y5&&_Xm<=_q5))_Ym|=4;
	if((_Um>=_X5&&_Um<=_p5)&&(_Xm>=_Y5&&_Xm<=_q5))_Ym|=8;
	var result=0;
	if(_Ym==15)
	{
		result=1.0;
	}
	else if(_Ym==0)
	{
		result=0.0;
		_Ym=0;
		if((_X5>=_Um&&_X5<=_Wm)&&(_Y5>=_Vm&&_Y5<=_Xm))_Ym|=1;
		if((_p5>=_Um&&_p5<=_Wm)&&(_Y5>=_Vm&&_Y5<=_Xm))_Ym|=2;
		if((_p5>=_Um&&_p5<=_Wm)&&(_q5>=_Vm&&_q5<=_Xm))_Ym|=4;
		if((_X5>=_Um&&_X5<=_Wm)&&(_q5>=_Vm&&_q5<=_Xm))_Ym|=8;
		if(0!=_Ym)result=2.0;
		else 
		{
			_Ym=0;
			if((_X5>=_Um&&_X5<=_Wm)&&(_Vm>=_Y5&&_Vm<=_q5))_Ym|=1;
			if((_p5>=_Um&&_p5<=_Wm)&&(_Vm>=_Y5&&_Vm<=_q5))_Ym|=2;
			if((_p5>=_Um&&_p5<=_Wm)&&(_Xm>=_Y5&&_Xm<=_q5))_Ym|=4;
			if((_X5>=_Um&&_X5<=_Wm)&&(_Xm>=_Y5&&_Xm<=_q5))_Ym|=8;
			if(0!=_Ym)result=2.0;
			else 
			{
				_Ym=0;
				if((_Um>=_X5&&_Um<=_p5)&&(_Y5>=_Vm&&_Y5<=_Xm))_Ym|=1;
				if((_Wm>=_X5&&_Wm<=_p5)&&(_Y5>=_Vm&&_Y5<=_Xm))_Ym|=2;
				if((_Wm>=_X5&&_Wm<=_p5)&&(_q5>=_Vm&&_q5<=_Xm))_Ym|=4;
				if((_Um>=_X5&&_Um<=_p5)&&(_q5>=_Vm&&_q5<=_Xm))_Ym|=8;
				if(0!=_Ym)result=2.0;
			}
		}
	}
	else 
	{
		result=2.0;
	}
	return result;
}
;

function __m(_0n,_1n,_x5,_y5,_z5,_A5,_ja,_ka)
{
	var _ua=_ja-_x5;
	var _wa=_z5-_x5;
	var _ya=_0n-_x5;
	var _va=_ka-_y5;
	var _xa=_A5-_y5;
	var _za=_1n-_y5;
	var _2n=(_ua*_ua)+(_va*_va);
	var _3n=(_ua*_wa)+(_va*_xa);
	var _4n=(_ua*_ya)+(_va*_za);
	var _5n=(_wa*_wa)+(_xa*_xa);
	var _6n=(_wa*_ya)+(_xa*_za);
	var _7n=1.0/(_2n*_5n-_3n*_3n);
	var _Y3=(_5n*_4n-_3n*_6n)*_7n;
	var _Z3=(_2n*_6n-_3n*_4n)*_7n;
	return((_Y3>=0.0)&&(_Z3>=0.0)&&(_Y3+_Z3<1.0));
}
;

function point_in_triangle(_om,_pm,_X5,_Y5,_p5,_q5,_8n,_9n)
{
	return __m(yyGetReal(_om),yyGetReal(_pm),yyGetReal(_X5),yyGetReal(_Y5),yyGetReal(_p5),yyGetReal(_q5),yyGetReal(_8n),yyGetReal(_9n));
}
;

function _an(_om,_pm,_bn,_cn,_dn)
{
	var _en=(((_om-_bn)*(_om-_bn))+((_pm-_cn)*(_pm-_cn)));
	if(_en<=_dn)return true;
	return false;
}
;

function point_in_circle(_om,_pm,_bn,_cn,_fn)
{
	return _an(yyGetReal(_om),yyGetReal(_pm),yyGetReal(_bn),yyGetReal(_cn),yyGetReal(_fn)*yyGetReal(_fn));
}
;

function rectangle_in_circle(_gn,_hn,_in,_jn,_bn,_cn,_fn)
{
	var _x5,_y5,_z5,_A5,_Hm,_Im,_kn,_ln,_mn;
	_x5=yyGetReal(_gn);
	_y5=yyGetReal(_hn);
	_z5=yyGetReal(_in);
	_A5=yyGetReal(_jn);
	_Hm=yyGetReal(_bn);
	_Im=yyGetReal(_cn);
	_kn=yyGetReal(_fn);
	var _nn=_kn*_kn;
	_ln=_Hm;
	_mn=_Im;
	if(_ln<_x5)_ln=_x5;
	if(_ln>_z5)_ln=_z5;
	if(_mn<_y5)_mn=_y5;
	if(_mn>_A5)_mn=_A5;
	var _zm=(_ln-_Hm)*(_ln-_Hm)+(_mn-_Im)*(_mn-_Im);
	var _on=0.0;
	if(_zm<=_nn)
	{
		_on=2.0;
		if((_an(_x5,_y5,_Hm,_Im,_nn))&&(_an(_z5,_y5,_Hm,_Im,_nn))&&(_an(_z5,_A5,_Hm,_Im,_nn))&&(_an(_x5,_A5,_Hm,_Im,_nn)))
		{
			_on=1.0;
		}
	}
	return _on;
}
;

function _pn(_gn,_hn,_in,_jn,_bn,_cn,_fn)
{
	var _x5,_y5,_z5,_A5,_Hm,_Im,_kn,_ln,_mn;
	_x5=yyGetReal(_gn);
	_y5=yyGetReal(_hn);
	_z5=yyGetReal(_in);
	_A5=yyGetReal(_jn);
	_Hm=yyGetReal(_bn);
	_Im=yyGetReal(_cn);
	_kn=yyGetReal(_fn);
	var _nn=_kn*_kn;
	_ln=_Hm;
	_mn=_Im;
	if(_ln<_x5)_ln=_x5;
	if(_ln>_z5)_ln=_z5;
	if(_mn<_y5)_mn=_y5;
	if(_mn>_A5)_mn=_A5;
	var _zm=(_ln-_Hm)*(_ln-_Hm)+(_mn-_Im)*(_mn-_Im);
	var _on=0.0;
	if(_zm<=_nn)
	{
		_on=2.0;
		if((Math.abs(_Hm-_x5)>_kn)&&(Math.abs(_Hm-_z5)>_kn)&&(Math.abs(_Im-_y5)>_kn)&&(Math.abs(_Im-_A5)>_kn))
		{
			_on=1.0;
		}
	}
	return _on;
}
;

function _qn(_rn,_sn)
{
	var _ha=_sn.x-_rn.x;
	var _ia=_sn.y-_rn.y;
	var _tn=
	{
		"x":-_ia,"y":_ha	}
	;
	return _tn;
}
;

function _un(_39,_vn,_tn)
{
	var min,max;
	var _en=_39[0].x*_tn.x+_39[0].y*_tn.y;
	min=max=_en;
	for(var i=1;i<_vn;++i)
	{
		_en=_39[i].x*_tn.x+_39[i].y*_tn.y;
		if(_en<min)min=_en;
		else if(_en>max)max=_en;
	}
	var _wn=
	{
		"min":min,"max":max	}
	;
	return _wn;
}
;

function rectangle_in_triangle(_gn,_hn,_in,_jn,_X5,_Y5,_p5,_q5,_8n,_9n)
{
	_gn=yyGetReal(_gn);
	_hn=yyGetReal(_hn);
	_in=yyGetReal(_in);
	_jn=yyGetReal(_jn);
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_8n=yyGetReal(_8n);
	_9n=yyGetReal(_9n);
	var _Ym=0;
	if(__m(_gn,_hn,_X5,_Y5,_p5,_q5,_8n,_9n))_Ym|=1;
	if(__m(_in,_hn,_X5,_Y5,_p5,_q5,_8n,_9n))_Ym|=2;
	if(__m(_in,_jn,_X5,_Y5,_p5,_q5,_8n,_9n))_Ym|=4;
	if(__m(_gn,_jn,_X5,_Y5,_p5,_q5,_8n,_9n))_Ym|=8;
	if(_Ym==15)
	{
		return 1.0;
	}
	else if(_Ym!=0)
	{
		return 2.0;
	}
	var _xn=[];
	_xn[0]=
	{
		"x":_X5,"y":_Y5	}
	;
	_xn[1]=
	{
		"x":_p5,"y":_q5	}
	;
	_xn[2]=
	{
		"x":_8n,"y":_9n	}
	;
	var axes=[];
	axes[0]=
	{
		"x":0,"y":1	}
	;
	axes[1]=
	{
		"x":1,"y":0	}
	;
	axes[2]=_qn(_xn[0],_xn[1]);
	axes[3]=_qn(_xn[1],_xn[2]);
	axes[4]=_qn(_xn[2],_xn[0]);
	var _yn=[];
	_yn[0]=
	{
		"x":_gn,"y":_hn	}
	;
	_yn[1]=
	{
		"x":_in,"y":_hn	}
	;
	_yn[2]=
	{
		"x":_gn,"y":_jn	}
	;
	_yn[3]=
	{
		"x":_in,"y":_jn	}
	;
	for(var i=0;i<5;++i)
	{
		var _tn=axes[i];
		var _zn=_un(_xn,3,_tn);
		var _An=_un(_yn,4,_tn);
		if(_An.max<=_zn.min||_zn.max<=_An.min)
		{
			return 0.0;
		}
	}
	return 2.0;
}
;

function _Bn()
{
}

function _Cn()
{
}

function _Dn()
{
}

function _En()
{
}

function _Fn()
{
}

function _Gn()
{
}

function _Hn()
{
}

function _In()
{
}

function _Jn()
{
}

function _Kn()
{
}

function _Ln()
{
}

function _Mn()
{
}

function _Nn()
{
}

function matrix_get()
{
}

function matrix_set()
{
}

function gpu_set_stencil_enable()
{
}

function gpu_set_stencil_func()
{
}

function gpu_set_stencil_ref()
{
}

function gpu_set_stencil_read_mask()
{
}

function gpu_set_stencil_write_mask()
{
}

function gpu_set_stencil_fail()
{
}

function gpu_set_stencil_depth_fail()
{
}

function gpu_set_stencil_pass()
{
}

function gpu_set_blendenable()
{
}

function gpu_set_ztestenable()
{
}

function gpu_set_zfunc()
{
}

function gpu_set_zwriteenable()
{
}

function gpu_set_fog()
{
}

function gpu_set_cullmode()
{
}

function gpu_set_blendmode()
{
}

function gpu_set_blendmode_ext()
{
}

function gpu_set_blendmode_ext_sepalpha()
{
}

function gpu_set_blendequation()
{
}

function gpu_set_blendequation_sepalpha()
{
}

function gpu_set_colorwriteenable()
{
}

function gpu_set_colourwriteenable()
{
}

function gpu_set_alphatestenable()
{
}

function gpu_set_alphatestref()
{
}

function gpu_set_texfilter()
{
}

function gpu_set_texfilter_ext()
{
}

function gpu_set_texrepeat()
{
}

function gpu_set_texrepeat_ext()
{
}

function gpu_set_tex_filter()
{
}

function gpu_set_tex_filter_ext()
{
}

function gpu_set_tex_repeat()
{
}

function gpu_set_tex_repeat_ext()
{
}

function gpu_set_tex_mip_filter()
{
}

function gpu_set_tex_mip_filter_ext()
{
}

function gpu_set_tex_mip_bias()
{
}

function gpu_set_tex_mip_bias_ext()
{
}

function gpu_set_tex_min_mip()
{
}

function gpu_set_tex_min_mip_ext()
{
}

function gpu_set_tex_max_mip()
{
}

function gpu_set_tex_max_mip_ext()
{
}

function gpu_set_tex_max_aniso()
{
}

function gpu_set_tex_max_aniso_ext()
{
}

function gpu_set_tex_mip_enable()
{
}

function gpu_set_tex_mip_enable_ext()
{
}

function gpu_get_stencil_enable()
{
}

function gpu_get_stencil_func()
{
}

function gpu_get_stencil_ref()
{
}

function gpu_get_stencil_read_mask()
{
}

function gpu_get_stencil_write_mask()
{
}

function gpu_get_stencil_fail()
{
}

function gpu_get_stencil_depth_fail()
{
}

function gpu_get_stencil_pass()
{
}

function gpu_get_blendenable()
{
}

function gpu_get_ztestenable()
{
}

function gpu_get_zfunc()
{
}

function gpu_get_zwriteenable()
{
}

function gpu_get_fog()
{
}

function gpu_get_cullmode()
{
}

function gpu_get_blendmode()
{
}

function gpu_get_blendmode_ext()
{
}

function gpu_get_blendmode_ext_sepalpha()
{
}

function gpu_get_blendmode_src()
{
}

function gpu_get_blendmode_dest()
{
}

function gpu_get_blendmode_srcalpha()
{
}

function gpu_get_blendmode_destalpha()
{
}

function gpu_get_blendequation()
{
}

function gpu_get_blendequation_sepalpha()
{
}

function gpu_get_colorwriteenable()
{
}

function gpu_get_colourwriteenable()
{
}

function gpu_get_alphatestenable()
{
}

function gpu_get_alphatestref()
{
}

function gpu_get_texfilter()
{
}

function gpu_get_texfilter_ext()
{
}

function gpu_get_texrepeat()
{
}

function gpu_get_texrepeat_ext()
{
}

function gpu_get_tex_filter()
{
}

function gpu_get_tex_filter_ext()
{
}

function gpu_get_tex_repeat()
{
}

function gpu_get_tex_repeat_ext()
{
}

function gpu_get_tex_mip_filter()
{
}

function gpu_get_tex_mip_filter_ext()
{
}

function gpu_get_tex_mip_bias()
{
}

function gpu_get_tex_mip_bias_ext()
{
}

function gpu_get_tex_min_mip()
{
}

function gpu_get_tex_min_mip_ext()
{
}

function gpu_get_tex_max_mip()
{
}

function gpu_get_tex_max_mip_ext()
{
}

function gpu_get_tex_max_aniso()
{
}

function gpu_get_tex_max_aniso_ext()
{
}

function gpu_get_tex_mip_enable()
{
}

function gpu_get_tex_mip_enable_ext()
{
}

function gpu_push_state()
{
}

function gpu_pop_state()
{
}

function gpu_get_state()
{
}

function gpu_set_state()
{
}
(()=>
{
	let __a=(_O2,_C2)=>()=>_0b(_O2,_C2);
	compile_if_used(_Bn=__a("d3d_set_depth"));
	compile_if_used(_Cn=__a("draw_set_color_write_enable"));
	compile_if_used(_Dn=__a("draw_set_colour_write_enable"));
	compile_if_used(draw_set_lighting,_En=__a("d3d_set_lighting"));
	compile_if_used(draw_light_define_direction,_Fn=__a("d3d_light_define_direction"));
	compile_if_used(draw_light_define_point,_Gn=__a("d3d_light_define_point"));
	compile_if_used(draw_light_enable,_Hn=__a("d3d_light_enable"));
	compile_if_used(draw_light_define_ambient,_In=__a("d3d_light_define_ambient"));
	compile_if_used(draw_light_get,_Kn=__a("d3d_light_get"));
	compile_if_used(draw_light_get_ambient,_Ln=__a("d3d_light_get_ambient"));
	compile_if_used(draw_get_lighting,_Mn=__a("d3d_get_lighting"));
	compile_if_used(_Nn=__a("d3d_set_perspective"));
	_Jn=__a("d3d_set_fog");
	compile_if_used(matrix_get=__a("matrix_get"));
	compile_if_used(matrix_set=__a("matrix_set"));
	compile_if_used(gpu_set_stencil_enable=__a("gpu_set_stencil_enable"));
	compile_if_used(gpu_set_stencil_func=__a("gpu_set_stencil_func"));
	compile_if_used(gpu_set_stencil_ref=__a("gpu_set_stencil_ref"));
	compile_if_used(gpu_set_stencil_read_mask=__a("gpu_set_stencil_read_mask"));
	compile_if_used(gpu_set_stencil_write_mask=__a("gpu_set_stencil_write_mask"));
	compile_if_used(gpu_set_stencil_fail=__a("gpu_set_stencil_fail"));
	compile_if_used(gpu_set_stencil_depth_fail=__a("gpu_set_stencil_depth_fail"));
	compile_if_used(gpu_set_stencil_pass=__a("gpu_set_stencil_pass"));
	compile_if_used(gpu_set_blendenable=__a("gpu_set_blendenable"));
	compile_if_used(gpu_set_ztestenable=__a("gpu_set_ztestenable"));
	compile_if_used(gpu_set_zfunc=__a("gpu_set_zfunc"));
	compile_if_used(gpu_set_zwriteenable=__a("gpu_set_zwriteenable"));
	compile_if_used(gpu_set_fog=__a("gpu_set_fog"));
	compile_if_used(gpu_set_cullmode=__a("gpu_set_cullmode"));
	compile_if_used(gpu_set_blendmode=__a("gpu_set_blendmode"));
	compile_if_used(gpu_set_blendmode_ext=__a("gpu_set_blendmode_ext"));
	compile_if_used(gpu_set_blendmode_ext_sepalpha=__a("gpu_set_blendmode_ext_sepalpha"));
	compile_if_used(gpu_set_blendequation=__a("gpu_set_blendequation"));
	compile_if_used(gpu_set_blendequation_sepalpha=__a("gpu_set_blendequation_sepalpha"));
	compile_if_used(gpu_set_colorwriteenable=__a("gpu_set_colorwriteenable"));
	compile_if_used(gpu_set_colourwriteenable=__a("gpu_set_colourwriteenable"));
	compile_if_used(gpu_set_alphatestenable=__a("gpu_set_alphatestenable"));
	compile_if_used(gpu_set_alphatestref=__a("gpu_set_alphatestref"));
	compile_if_used(gpu_set_texfilter=__a("gpu_set_texfilter"));
	gpu_set_texfilter_ext=__a("gpu_set_texfilter_ext");
	compile_if_used(gpu_set_texrepeat=__a("gpu_set_texrepeat"));
	gpu_set_texrepeat_ext=__a("gpu_set_texrepeat_ext");
	compile_if_used(gpu_set_tex_filter=__a("gpu_set_tex_filter"));
	gpu_set_tex_filter_ext=__a("gpu_set_tex_filter_ext");
	compile_if_used(gpu_set_tex_repeat=__a("gpu_set_tex_repeat"));
	compile_if_used(gpu_set_tex_repeat_ext=__a("gpu_set_tex_repeat_ext"));
	compile_if_used(gpu_set_tex_mip_filter=__a("gpu_set_tex_mip_filter"));
	compile_if_used(gpu_set_tex_mip_filter_ext=__a("gpu_set_tex_mip_filter_ext"));
	compile_if_used(gpu_set_tex_mip_bias=__a("gpu_set_tex_mip_bias"));
	compile_if_used(gpu_set_tex_mip_bias_ext=__a("gpu_set_tex_mip_bias_ext"));
	compile_if_used(gpu_set_tex_min_mip=__a("gpu_set_tex_min_mip"));
	compile_if_used(gpu_set_tex_min_mip_ext=__a("gpu_set_tex_min_mip_ext"));
	compile_if_used(gpu_set_tex_max_mip=__a("gpu_set_tex_max_mip"));
	compile_if_used(gpu_set_tex_max_mip_ext=__a("gpu_set_tex_max_mip_ext"));
	compile_if_used(gpu_set_tex_max_aniso=__a("gpu_set_tex_max_aniso"));
	compile_if_used(gpu_set_tex_max_aniso_ext=__a("gpu_set_tex_max_aniso_ext"));
	compile_if_used(gpu_set_tex_mip_enable=__a("gpu_set_tex_mip_enable"));
	compile_if_used(gpu_set_tex_mip_enable_ext=__a("gpu_set_tex_mip_enable_ext"));
	compile_if_used(gpu_get_stencil_enable=__a("gpu_get_stencil_enable"));
	compile_if_used(gpu_get_stencil_func=__a("gpu_get_stencil_func"));
	compile_if_used(gpu_get_stencil_ref=__a("gpu_get_stencil_ref"));
	compile_if_used(gpu_get_stencil_read_mask=__a("gpu_get_stencil_read_mask"));
	compile_if_used(gpu_get_stencil_write_mask=__a("gpu_get_stencil_write_mask"));
	compile_if_used(gpu_get_stencil_fail=__a("gpu_get_stencil_fail"));
	compile_if_used(gpu_get_stencil_depth_fail=__a("gpu_get_stencil_depth_fail"));
	compile_if_used(gpu_get_stencil_pass=__a("gpu_get_stencil_pass"));
	compile_if_used(gpu_get_blendenable=__a("gpu_get_blendenable"));
	gpu_get_ztestenable=__a("gpu_get_ztestenable");
	compile_if_used(gpu_get_zfunc=__a("gpu_get_zfunc"));
	gpu_get_zwriteenable=__a("gpu_get_zwriteenable");
	compile_if_used(gpu_get_fog=__a("gpu_get_fog"));
	gpu_get_cullmode=__a("gpu_get_cullmode");
	compile_if_used(gpu_get_blendmode=__a("gpu_get_blendmode"));
	compile_if_used(gpu_get_blendmode_ext=__a("gpu_get_blendmode_ext"));
	compile_if_used(gpu_get_blendmode_ext_sepalpha=__a("gpu_get_blendmode_ext_sepalpha"));
	compile_if_used(gpu_get_blendmode_src=__a("gpu_get_blendmode_src"));
	compile_if_used(gpu_get_blendmode_dest=__a("gpu_get_blendmode_dest"));
	compile_if_used(gpu_get_blendmode_srcalpha=__a("gpu_get_blendmode_srcalpha"));
	compile_if_used(gpu_get_blendmode_destalpha=__a("gpu_get_blendmode_destalpha"));
	compile_if_used(gpu_get_blendequation=__a("gpu_get_blendequation"));
	compile_if_used(gpu_get_blendequation_sepalpha=__a("gpu_get_blendequation_sepalpha"));
	compile_if_used(gpu_get_colorwriteenable=__a("gpu_get_colorwriteenable"));
	compile_if_used(gpu_get_colourwriteenable=__a("gpu_get_colourwriteenable"));
	gpu_get_alphatestenable=__a("gpu_get_alphatestenable");
	compile_if_used(gpu_get_alphatestref=__a("gpu_get_alphatestref"));
	compile_if_used(gpu_get_texfilter=__a("gpu_get_texfilter"));
	compile_if_used(gpu_get_texfilter_ext=__a("gpu_get_texfilter_ext"));
	compile_if_used(gpu_get_texrepeat=__a("gpu_get_texrepeat"));
	compile_if_used(gpu_get_texrepeat_ext=__a("gpu_get_texrepeat_ext"));
	compile_if_used(gpu_get_tex_filter=__a("gpu_get_tex_filter"));
	compile_if_used(gpu_get_tex_filter_ext=__a("gpu_get_tex_filter_ext"));
	compile_if_used(gpu_get_tex_repeat=__a("gpu_get_tex_repeat"));
	compile_if_used(gpu_get_tex_repeat_ext=__a("gpu_get_tex_repeat_ext"));
	compile_if_used(gpu_get_tex_mip_filter=__a("gpu_get_tex_mip_filter"));
	compile_if_used(gpu_get_tex_mip_filter_ext=__a("gpu_get_tex_mip_filter_ext"));
	compile_if_used(gpu_get_tex_mip_bias=__a("gpu_get_tex_mip_bias"));
	compile_if_used(gpu_get_tex_mip_bias_ext=__a("gpu_get_tex_mip_bias_ext"));
	compile_if_used(gpu_get_tex_min_mip=__a("gpu_get_tex_min_mip"));
	compile_if_used(gpu_get_tex_min_mip_ext=__a("gpu_get_tex_min_mip_ext"));
	compile_if_used(gpu_get_tex_max_mip=__a("gpu_get_tex_max_mip"));
	compile_if_used(gpu_get_tex_max_mip_ext=__a("gpu_get_tex_max_mip_ext"));
	compile_if_used(gpu_get_tex_max_aniso=__a("gpu_get_tex_max_aniso"));
	compile_if_used(gpu_get_tex_max_aniso_ext=__a("gpu_get_tex_max_aniso_ext"));
	compile_if_used(gpu_get_tex_mip_enable=__a("gpu_get_tex_mip_enable"));
	compile_if_used(gpu_get_tex_mip_enable_ext=__a("gpu_get_tex_mip_enable_ext"));
	compile_if_used(gpu_push_state=__a("gpu_push_state"));
	compile_if_used(gpu_pop_state=__a("gpu_pop_state"));
	compile_if_used(gpu_get_state=__a("gpu_get_state"));
	compile_if_used(gpu_set_state=__a("gpu_set_state"));
}
)();
var matrix_build=_On;
var matrix_multiply=_Pn;
var matrix_transform_vertex=_Qn;
var matrix_stack_push=_Rn;
var matrix_stack_pop=_Sn;
var matrix_stack_set=_Tn;
var matrix_stack_clear=_Un;
var matrix_stack_top=_Vn;
var matrix_stack_is_empty=_Wn;
var matrix_build_identity=_Xn;
var matrix_build_lookat=_Yn;
var matrix_build_projection_ortho=_Zn;
var matrix_build_projection_perspective=__n;
var matrix_build_projection_perspective_fov=_0o;
var _1o=50;
var _2o=0;
var _3o=new Array(_1o+1);

function _4o()
{
	if(!_i7)
	{
		return;
	}
	_Bn=_5o;
	compile_if_used(_Cn=_6o);
	compile_if_used(_Dn=_6o);
	_Nn=_7o;
	compile_if_used(draw_set_lighting,_En=_8o);
	compile_if_used(draw_light_define_direction,_Fn=_9o);
	compile_if_used(draw_light_define_point,_Gn=_ao);
	compile_if_used(draw_light_enable,_Hn=_bo);
	compile_if_used(draw_light_define_ambient,_In=_co);
	compile_if_used(draw_light_get,_Kn=_do);
	compile_if_used(draw_light_get_ambient,_Ln=_eo);
	compile_if_used(draw_get_lighting,_Mn=_fo);
	_Jn=_go;
	compile_if_used(matrix_get=_ho);
	compile_if_used(matrix_set=_io);
	compile_if_used(gpu_set_stencil_enable=_jo);
	compile_if_used(gpu_set_stencil_func=_ko);
	compile_if_used(gpu_set_stencil_ref=_lo);
	compile_if_used(gpu_set_stencil_read_mask=_mo);
	compile_if_used(gpu_set_stencil_write_mask=_no);
	compile_if_used(gpu_set_stencil_fail=_oo);
	compile_if_used(gpu_set_stencil_depth_fail=_po);
	compile_if_used(gpu_set_stencil_pass=_qo);
	compile_if_used(gpu_set_blendmode=_ro);
	compile_if_used(gpu_set_blendenable=_so);
	compile_if_used(gpu_set_ztestenable=_to);
	compile_if_used(gpu_set_depth=_uo);
	compile_if_used(gpu_set_zfunc=_vo);
	compile_if_used(gpu_set_zwriteenable=_wo);
	compile_if_used(gpu_set_fog=_xo);
	compile_if_used(gpu_set_cullmode=_yo);
	compile_if_used(gpu_set_blendmode=_ro);
	compile_if_used(gpu_set_blendmode_ext=_zo);
	compile_if_used(gpu_set_blendmode_ext_sepalpha=_Ao);
	compile_if_used(gpu_set_blendequation=_Bo);
	compile_if_used(gpu_set_blendequation_sepalpha=_Co);
	compile_if_used(gpu_set_colorwriteenable=_Do);
	compile_if_used(gpu_set_colourwriteenable=_Eo);
	compile_if_used(gpu_set_alphatestenable=_Fo);
	compile_if_used(gpu_set_alphatestref=_Go);
	compile_if_used(gpu_set_texfilter=_Ho);
	gpu_set_texfilter_ext=_Io;
	compile_if_used(gpu_set_texrepeat=_Jo);
	gpu_set_texrepeat_ext=_Ko;
	compile_if_used(gpu_set_tex_filter=_Ho);
	gpu_set_tex_filter_ext=_Io;
	compile_if_used(gpu_set_tex_repeat=_Jo);
	compile_if_used(gpu_set_tex_repeat_ext=_Ko);
	compile_if_used(gpu_set_tex_mip_filter=_Lo);
	compile_if_used(gpu_set_tex_mip_filter_ext=_Mo);
	compile_if_used(gpu_set_tex_mip_bias=_No);
	compile_if_used(gpu_set_tex_mip_bias_ext=_Oo);
	compile_if_used(gpu_set_tex_min_mip=_Po);
	compile_if_used(gpu_set_tex_min_mip_ext=_Qo);
	compile_if_used(gpu_set_tex_max_mip=_Ro);
	compile_if_used(gpu_set_tex_max_mip_ext=_So);
	compile_if_used(gpu_set_tex_max_aniso=_To);
	compile_if_used(gpu_set_tex_max_aniso_ext=_Uo);
	compile_if_used(gpu_set_tex_mip_enable=_Vo);
	compile_if_used(gpu_set_tex_mip_enable_ext=_Wo);
	compile_if_used(gpu_get_stencil_enable=_Xo);
	compile_if_used(gpu_get_stencil_func=_Yo);
	compile_if_used(gpu_get_stencil_ref=_Zo);
	compile_if_used(gpu_get_stencil_read_mask=__o);
	compile_if_used(gpu_get_stencil_write_mask=_0p);
	compile_if_used(gpu_get_stencil_fail=_1p);
	compile_if_used(gpu_get_stencil_depth_fail=_2p);
	compile_if_used(gpu_get_stencil_pass=_3p);
	compile_if_used(gpu_get_blendenable=_4p);
	gpu_get_ztestenable=_5p;
	compile_if_used(gpu_get_depth=_6p);
	compile_if_used(gpu_get_zfunc=_7p);
	gpu_get_zwriteenable=_8p;
	compile_if_used(gpu_get_fog=_9p);
	gpu_get_cullmode=_ap;
	compile_if_used(gpu_get_blendmode=_bp);
	compile_if_used(gpu_get_blendmode_ext=_cp);
	compile_if_used(gpu_get_blendmode_ext_sepalpha=_dp);
	compile_if_used(gpu_get_blendmode_src=_ep);
	compile_if_used(gpu_get_blendmode_dest=_fp);
	compile_if_used(gpu_get_blendmode_srcalpha=_gp);
	compile_if_used(gpu_get_blendmode_destalpha=_hp);
	compile_if_used(gpu_get_colorwriteenable=_ip);
	compile_if_used(gpu_get_colourwriteenable=_jp);
	gpu_get_alphatestenable=_kp;
	compile_if_used(gpu_get_alphatestref=_lp);
	compile_if_used(gpu_get_texfilter=_mp);
	gpu_get_texfilter_ext=_np;
	compile_if_used(gpu_get_texrepeat=_op);
	compile_if_used(gpu_get_tex_filter=_mp);
	compile_if_used(gpu_get_tex_filter_ext=_np);
	compile_if_used(gpu_get_tex_repeat=_op);
	compile_if_used(gpu_get_tex_repeat_ext=_pp);
	compile_if_used(gpu_get_tex_mip_filter=_qp);
	compile_if_used(gpu_get_tex_mip_filter_ext=_rp);
	compile_if_used(gpu_get_tex_mip_bias=_sp);
	compile_if_used(gpu_get_tex_mip_bias_ext=_tp);
	compile_if_used(gpu_get_tex_min_mip=_up);
	compile_if_used(gpu_get_tex_min_mip_ext=_vp);
	compile_if_used(gpu_get_tex_max_mip=_wp);
	compile_if_used(gpu_get_tex_max_mip_ext=_xp);
	compile_if_used(gpu_get_tex_max_aniso=_yp);
	compile_if_used(gpu_get_tex_max_aniso_ext=_zp);
	compile_if_used(gpu_get_tex_mip_enable=_Ap);
	compile_if_used(gpu_get_tex_mip_enable_ext=_Bp);
	compile_if_used(gpu_push_state=_Cp);
	compile_if_used(gpu_pop_state=_Dp);
	compile_if_used(gpu_get_state=_Ep);
	compile_if_used(gpu_set_state=_Fp);
	_3o[0]=new _Gp();
}

function _5o(_Hp)
{
	_X9=Math.min(16000.0,Math.max(-16000.0,_Hp));
}

function _6o(_Ip,_Jp,_Kp,alpha)
{
	_Lp._Ip=(_Ip>=0.5);
	_Lp._Jp=(_Jp>=0.5);
	_Lp._Kp=(_Kp>=0.5);
	_Lp.alpha=(alpha>=0.5);
	_i7._Mp(_Lp._Ip,_Lp._Jp,_Lp._Kp,_Lp.alpha);
}

function _7o(_Np)
{
	_Op=_Np;
}

function _8o(_Np)
{
	if(_Pp!=_Np)
	{
		_Pp=_Np;
		_i7._Qp(_Rp());
	}
}

function _fo()
{
	return _Pp;
}

function _Sp(x,y,w,h,angle)
{
	var _Tp=new _Gp();
	var _la=new _Up(x+(w/2.0),y+(h/2.0),-w);
	var _04=new _Up(x+(w/2.0),y+(h/2.0),0.0);
	var _ma=new _Up(Math.sin(-angle*(Math.PI/180.0)),Math.cos(-angle*(Math.PI/180.0)),0.0);
	_Tp._Vp(_la,_04,_ma);
	var _Wp=new _Gp();
	_Wp._Xp(w,-h*_Yp,1.0,32000.0);
	_i7._Zp(_Tp);
	_i7.__p(_Wp);
}

function _9o(_o8,_ha,_ia,_0q,_n3)
{
	var _1q=new _Up(_ha,_ia,_0q);
	_1q._2q();
	var _3q=_o8*4;
	_4q[_3q+0]=_1q._5q;
	_4q[_3q+1]=_1q._6q;
	_4q[_3q+2]=_1q._7q;
	_4q[_3q+3]=0.0;
	_8q[_3q+0]=(_n3&0xff)/255.0;
	_8q[_3q+1]=((_n3>>8)&0xff)/255.0;
	_8q[_3q+2]=((_n3>>16)&0xff)/255.0;
	_8q[_3q+3]=1.0;
	_9q[_o8]=_aq;
	_bq[_3q+0]=0;
	_bq[_3q+1]=0;
	_bq[_3q+2]=0;
	_bq[_3q+3]=0;
	_i7._cq(_o8,_bq.subarray(_o8*4,(_o8+1)*4),_4q.subarray(_o8*4,(_o8+1)*4),_8q.subarray(_o8*4,(_o8+1)*4));
}

function _eo()
{
	var _n3=(((_dq[0]*255.0))&0xff)|(((_dq[1]*255.0)<<8)&0xff00)|(((_dq[2]*255.0)<<16)&0xff0000)|(((_dq[3]*255.0)<<24)&0xff000000);
	return _n3;
}

function _do(index)
{
	var _r3=[];
	if(index<0||index>7)
	{
		console.log("draw_light_get() - light index out of range");
		return;
	}
	var _3q=index*4;
	_r3[0]=_eq[index];
	_r3[1]=_9q[index];
	if(_9q[index]==_aq)
	{
		_r3[2]=_4q[_3q+0];
		_r3[3]=_4q[_3q+1];
		_r3[4]=_4q[_3q+2];
		_r3[5]=_4q[_3q+3];
	}
	else 
	{
		_r3[2]=_bq[_3q+0];
		_r3[3]=_bq[_3q+1];
		_r3[4]=_bq[_3q+2];
		_r3[5]=_bq[_3q+3];
	}
	var _f3=(((_8q[_3q+0]*255.0))&0xff);
	var _g3=(((_8q[_3q+1]*255.0)<<8)&0xff00);
	var _h3=(((_8q[_3q+2]*255.0)<<16)&0xff0000);
	var _i3=(((_8q[_3q+3]*255.0)<<24)&0xff000000);
	var _n3=_f3|_g3|_h3|_i3;
	_r3[6]=_n3;
	return _r3;
}

function _ao(_o8,x,y,z,_fq,_n3)
{
	var _3q=_o8*4;
	_bq[_3q+0]=x;
	_bq[_3q+1]=y;
	_bq[_3q+2]=z;
	_bq[_3q+3]=_fq;
	_8q[_3q+0]=(_n3&0xff)/255.0;
	_8q[_3q+1]=((_n3>>8)&0xff)/255.0;
	_8q[_3q+2]=((_n3>>16)&0xff)/255.0;
	_8q[_3q+3]=1.0;
	_9q[_o8]=_gq;
	_4q[_3q+0]=0;
	_4q[_3q+1]=0;
	_4q[_3q+2]=0;
	_4q[_3q+3]=0;
	_i7._cq(_o8,_bq.subarray(_o8*4,(_o8+1)*4),_4q.subarray(_o8*4,(_o8+1)*4),_8q.subarray(_o8*4,(_o8+1)*4));
}

function _bo(_o8,enable)
{
	_eq[_o8]=enable;
	_i7._hq(_o8,enable,_8q.subarray(_o8*4,(_o8+1)*4));
}

function _co(colour)
{
	_dq[0]=(colour&0xff)/255.0;
	_dq[1]=((colour>>8)&0xff)/255.0;
	_dq[2]=((colour>>16)&0xff)/255.0;
	_dq[3]=((colour>>24)&0xff)/255.0;
	_i7._iq(_dq);
}

function _go(enable,colour,start,end)
{
	if(_jq==null)
	{
		_jq=new Float32Array(8);
	}
	_jq[0]=enable;
	var _fq=end-start;
	_jq[1]=(_fq==0.0)?0.0:(1.0/_fq);
	_jq[2]=end;
	_jq[3]=0.0;
	_jq[4]=(colour&0xff)/255.0;
	_jq[5]=((colour>>8)&0xff)/255.0;
	_jq[6]=((colour>>16)&0xff)/255.0;
	_jq[7]=((colour>>24)&0xff)/255.0;
	_i7._kq(_jq);
}

function _ho(_Ob)
{
	_Ob=yyGetInt32(_Ob);
	var _w5=[];
	if(_Ob<0||_Ob>2)
	{
		_I3('ERROR: Invalid matrix type (matrix_get)');
		for(var i=0;i<16;i++)
		{
			_w5[i]=0;
		}
		return _w5;
	}
	var _lq=_mq[_Ob];
	for(var i=0;i<16;i++)
	{
		_w5[i]=_lq._w5[i];
	}
	return _w5;
}

function _io(_Ob,_nq)
{
	_Ob=yyGetInt32(_Ob);
	if(_Ob<0||_Ob>2)
	{
		_I3('ERROR: Invalid matrix type (matrix_get)');
		return;
	}
	_oq(_Ob,_nq);
	if(_Ob==_pq)
	{
		var _qq=new _Gp();
		var _rq=_sq(_tq);
		if(_Yp==-1)
		{
			_qq=_rq;
		}
		else 
		{
			var _uq=new _Gp();
			_uq._vq();
			_uq._w5[_wq]=-1;
			_qq.Multiply(_rq,_uq);
		}
		_xq(new _Gp(_nq),_qq);
	}
	else if(_Ob==_tq)
	{
		_xq(_sq(_pq),new _Gp(_nq));
	}
}

function _Xn()
{
	return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,];
}

function _Yn(_yq,_zq,_Aq,_Bq,_Cq,_Dq,_Eq,_Fq,_Gq)
{
	var _w5=new _Gp();
	var _Hq=new _Up(yyGetReal(_yq),yyGetReal(_zq),yyGetReal(_Aq));
	var _Iq=new _Up(yyGetReal(_Bq),yyGetReal(_Cq),yyGetReal(_Dq));
	var _Jq=new _Up(yyGetReal(_Eq),yyGetReal(_Fq),yyGetReal(_Gq));
	_w5._Vp(_Hq,_Iq,_Jq);
	var _lq=[];
	for(var i=0;i<16;i++)
	{
		_lq[i]=_w5._w5[i];
	}
	return _lq;
}

function _Zn(width,height,_Kq,_Lq)
{
	var _w5=new _Gp();
	_w5._Xp(yyGetReal(width),yyGetReal(height),yyGetReal(_Kq),yyGetReal(_Lq));
	var _lq=[];
	for(var i=0;i<16;i++)
	{
		_lq[i]=_w5._w5[i];
	}
	return _lq;
}

function __n(width,height,_Kq,_Lq)
{
	var _w5=new _Gp();
	_w5._Mq(yyGetReal(width),yyGetReal(height),yyGetReal(_Kq),yyGetReal(_Lq));
	var _lq=[];
	for(var i=0;i<16;i++)
	{
		_lq[i]=_w5._w5[i];
	}
	return _lq;
}

function _0o(_Nq,_Oq,_Kq,_Lq)
{
	var _w5=new _Gp();
	_w5._Pq(yyGetReal(_Nq),yyGetReal(_Oq),yyGetReal(_Kq),yyGetReal(_Lq));
	var _lq=[];
	for(var i=0;i<16;i++)
	{
		_lq[i]=_w5._w5[i];
	}
	return _lq;
}

function _On(_r4,_s4,_Qq,_Rq,_Sq,_Tq,_7l,_8l,_Uq)
{
	var _w5=new _Gp();
	var _Vq=(Math.PI/180.0);
	_Rq=(_Vq*-yyGetReal(_Rq));
	_Sq=(_Vq*-yyGetReal(_Sq));
	_Tq=(_Vq*-yyGetReal(_Tq));
	_w5._Wq(yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_Qq),_Rq,_Sq,_Tq,yyGetReal(_7l),yyGetReal(_8l),yyGetReal(_Uq));
	var _lq=[];
	for(var i=0;i<16;i++)
	{
		_lq[i]=_w5._w5[i];
	}
	return _lq;
}

function _Pn(_Xq,_Yq)
{
	var _Zq=new _Gp();
	var __q=new _Gp();
	var _0r=new _Gp();
	for(var i=0;i<16;i++)
	{
		_Zq._w5[i]=yyGetReal(_Xq[i]);
		__q._w5[i]=yyGetReal(_Yq[i]);
	}
	_0r.Multiply(_Zq,__q);
	var _lq=[];
	for(var i=0;i<16;i++)
	{
		_lq[i]=_0r._w5[i];
	}
	return _lq;
}

function _Qn(_1r,_r4,_s4,_Qq)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_Qq=yyGetReal(_Qq);
	var _ta;
	if(arguments.length==4)
	{
		var _O5=(_1r[_2r]*_r4)+(_1r[_3r]*_s4)+(_1r[_4r]*_Qq)+_1r[_5r];
		var _Q5=(_1r[_6r]*_r4)+(_1r[_wq]*_s4)+(_1r[_7r]*_Qq)+_1r[_8r];
		var _9r=(_1r[_ar]*_r4)+(_1r[_br]*_s4)+(_1r[_cr]*_Qq)+_1r[_dr];
		_ta=[_O5,_Q5,_9r];
	}
	else 
	{
		var _eh=yyGetReal(arguments[4]);
		var _O5=(_1r[_2r]*_r4)+(_1r[_3r]*_s4)+(_1r[_4r]*_Qq)+(_1r[_5r]*_eh);
		var _Q5=(_1r[_6r]*_r4)+(_1r[_wq]*_s4)+(_1r[_7r]*_Qq)+(_1r[_8r]*_eh);
		var _9r=(_1r[_ar]*_r4)+(_1r[_br]*_s4)+(_1r[_cr]*_Qq)+(_1r[_dr]*_eh);
		var _46=(_1r[_er]*_r4)+(_1r[_fr]*_s4)+(_1r[_gr]*_Qq)+(_1r[_hr]*_eh);
		_ta=[_O5,_Q5,_9r,_46];
	}
	return _ta;
}

function _Rn(_nq)
{
	if(_2o>=_1o)
	{
		return;
	}
	_2o++;
	if(arguments.length==0)
	{
		_3o[_2o]=new _Gp(_3o[_2o-1]);
	}
	else 
	{
		var _lq=new _Gp();
		var i;
		for(i=0;i<16;i++)
		{
			_lq._w5[i]=_nq[i];
		}
		_3o[_2o]=new _Gp();
		_3o[_2o].Multiply(_lq,_3o[_2o-1]);
	}
}

function _Sn()
{
	_2o--;
	if(_2o<0)
	{
		_Un();
	}
}

function _Un()
{
	_2o=0;
	_3o[0]=new _Gp();
}

function _Tn(_nq)
{
	_3o[_2o]=new _Gp(_nq);
}

function _Vn()
{
	var elements=new Array(16);
	var i;
	for(i=0;i<16;i++)
	{
		elements[i]=_3o[_2o]._w5[i];
	}
	return elements;
}

function _Wn()
{
	if(_2o==0)return true;
	else return false;
}

function _jo(_Np)
{
	_i7._p9._F9(_d9._ir,yyGetInt32(_Np)>=0.5);
}

function _ko(_jr)
{
	_i7._p9._F9(_d9._kr,yyGetInt32(_jr));
}

function _lo(_lr)
{
	_i7._p9._F9(_d9._mr,yyGetInt32(_lr));
}

function _mo(_nr)
{
	_i7._p9._F9(_d9._or,yyGetInt32(_nr));
}

function _no(_nr)
{
	_i7._p9._F9(_d9._pr,yyGetInt32(_nr));
}

function _oo(_qr)
{
	_i7._p9._F9(_d9._rr,yyGetInt32(_qr));
}

function _po(_qr)
{
	_i7._p9._F9(_d9._sr,yyGetInt32(_qr));
}

function _qo(_qr)
{
	_i7._p9._F9(_d9._tr,yyGetInt32(_qr));
}

function _so(_Np)
{
	_i7._p9._F9(_d9._ur,yyGetInt32(_Np)>=0.5);
}

function _to(_Np)
{
	_i7._p9._F9(_d9._vr,yyGetInt32(_Np)>=0.5);
}

function _uo(_wj)
{
	_X9=_wj;
}

function _vo(_jr)
{
	_i7._p9._F9(_d9._wr,yyGetInt32(_jr));
}

function _wo(_Np)
{
	_i7._p9._F9(_d9._xr,yyGetInt32(_Np)>=0.5);
}

function _xo(_Np,_ec,_yr,_zr)
{
	if(Array.isArray(_Np))
	{
		var _Ar=_Np;
		_Np=_Ar[0];
		_ec=_Ar[1];
		_yr=_Ar[2];
		_zr=_Ar[3];
	}
	_Np=yyGetBool(_Np);
	_ec=yyGetInt32(_ec)|0xff000000;
	_yr=yyGetReal(_yr);
	_zr=yyGetReal(_zr);
	_i7._p9._F9(_d9._Br,_Np);
	_i7._p9._F9(_d9._Cr,_ec);
	_i7._p9._F9(_d9._Dr,_yr);
	_i7._p9._F9(_d9._Er,_zr);
	_jq[0]=_Np;
	var _fq=_zr-_yr;
	_jq[1]=(_fq==0.0)?0.0:(1.0/_fq);
	_jq[2]=_zr;
	_jq[3]=0.0;
	_jq[4]=(_ec&0xff)/255.0;
	_jq[5]=((_ec>>8)&0xff)/255.0;
	_jq[6]=((_ec>>16)&0xff)/255.0;
	_jq[7]=1.0;
	_i7._kq(_jq);
}

function _yo(_Fr)
{
	_i7._p9._F9(_d9._Gr,yyGetInt32(_Fr));
}

function _ro(_Hr)
{
	switch(yyGetInt32(_Hr))
	{
		case 1:_i7._p9._F9(_d9._r9,_d9._e9);
		_i7._p9._F9(_d9._s9,_d9._h9);
		_i7._p9._F9(_d9._Ir,_d9._Jr);
		_i7._p9._F9(_d9._t9,_d9._e9);
		_i7._p9._F9(_d9._u9,_d9._h9);
		_i7._p9._F9(_d9._Kr,_d9._Jr);
		_i7._p9._F9(_d9._v9,false);
		break;
		case 2:_i7._p9._F9(_d9._r9,_d9._e9);
		_i7._p9._F9(_d9._s9,_d9._j9);
		_i7._p9._F9(_d9._Ir,_d9._Jr);
		_i7._p9._F9(_d9._t9,_d9._e9);
		_i7._p9._F9(_d9._u9,_d9._j9);
		_i7._p9._F9(_d9._Kr,_d9._Jr);
		_i7._p9._F9(_d9._v9,false);
		break;
		case 3:_i7._p9._F9(_d9._r9,_d9._e9);
		_i7._p9._F9(_d9._s9,_d9._h9);
		_i7._p9._F9(_d9._Ir,_d9._Lr);
		_i7._p9._F9(_d9._t9,_d9._e9);
		_i7._p9._F9(_d9._u9,_d9._h9);
		_i7._p9._F9(_d9._Kr,_d9._Lr);
		_i7._p9._F9(_d9._v9,false);
		break;
		case 4:_i7._p9._F9(_d9._r9,_d9._h9);
		_i7._p9._F9(_d9._s9,_d9._h9);
		_i7._p9._F9(_d9._Ir,_d9._Mr);
		_i7._p9._F9(_d9._t9,_d9._h9);
		_i7._p9._F9(_d9._u9,_d9._h9);
		_i7._p9._F9(_d9._Kr,_d9._Mr);
		_i7._p9._F9(_d9._v9,false);
		break;
		case 5:_i7._p9._F9(_d9._r9,_d9._e9);
		_i7._p9._F9(_d9._s9,_d9._h9);
		_i7._p9._F9(_d9._Ir,_d9._Nr);
		_i7._p9._F9(_d9._t9,_d9._e9);
		_i7._p9._F9(_d9._u9,_d9._Or);
		_i7._p9._F9(_d9._Kr,_d9._Nr);
		_i7._p9._F9(_d9._v9,false);
		break;
		default :_i7._p9._F9(_d9._r9,_d9._e9);
		_i7._p9._F9(_d9._s9,_d9._g9);
		_i7._p9._F9(_d9._Ir,_d9._Jr);
		_i7._p9._F9(_d9._t9,_d9._e9);
		_i7._p9._F9(_d9._u9,_d9._g9);
		_i7._p9._F9(_d9._Kr,_d9._Jr);
		_i7._p9._F9(_d9._v9,false);
		break;
	}
}

function _zo(_ih,_ji)
{
	var _Pr,_Qr;
	if(Array.isArray(_ih))
	{
		_Pr=yyGetInt32(_ih[0]);
		_Qr=yyGetInt32(_ih[1]);
	}
	else 
	{
		_Pr=yyGetInt32(_ih);
		_Qr=yyGetInt32(_ji);
	}
	_i7._p9._F9(_d9._r9,_Pr);
	_i7._p9._F9(_d9._s9,_Qr);
	_i7._p9._F9(_d9._t9,_Pr);
	_i7._p9._F9(_d9._u9,_Qr);
	_i7._p9._F9(_d9._v9,false);
}

function _Ao(_ih,_ji,_Rr,_Sr)
{
	var _Pr,_Qr,_Tr,_Ur;
	if(Array.isArray(_ih))
	{
		_Pr=yyGetInt32(_ih[0]);
		_Qr=yyGetInt32(_ih[1]);
		_Tr=yyGetInt32(_ih[2]);
		_Ur=yyGetInt32(_ih[3]);
	}
	else 
	{
		_Pr=yyGetInt32(_ih);
		_Qr=yyGetInt32(_ji);
		_Tr=yyGetInt32(_Rr);
		_Ur=yyGetInt32(_Sr);
	}
	_i7._p9._F9(_d9._r9,_Pr);
	_i7._p9._F9(_d9._s9,_Qr);
	_i7._p9._F9(_d9._t9,_Tr);
	_i7._p9._F9(_d9._u9,_Ur);
	_i7._p9._F9(_d9._v9,true);
}

function _Bo(_Vr)
{
	var _Wr=yyGetInt32(_Vr);
	_i7._p9._F9(_d9._Ir,_Wr);
	_i7._p9._F9(_d9._Kr,_Wr);
	_i7._p9._F9(_d9._v9,false);
}

function _Co(_Vr,_Xr)
{
	var _Wr,_Yr;
	if(Array.isArray(_Vr))
	{
		_Wr=yyGetInt32(_Vr[0]);
		_Yr=yyGetInt32(_Vr[1]);
	}
	else 
	{
		_Wr=yyGetInt32(_Vr);
		_Yr=yyGetInt32(_Xr);
	}
	_i7._p9._F9(_d9._Ir,_Wr);
	_i7._p9._F9(_d9._Kr,_Yr);
	_i7._p9._F9(_d9._v9,true);
}

function _Do(_Zr,__r,_0s,_y8)
{
	var _1s;
	var _2s;
	var _3s;
	var _4s;
	if(Array.isArray(_Zr))
	{
		var _Ar=_Zr;
		_1s=(yyGetInt32(_Ar[0])>=0.5);
		_2s=(yyGetInt32(_Ar[1])>=0.5);
		_3s=(yyGetInt32(_Ar[2])>=0.5);
		_4s=(yyGetInt32(_Ar[3])>=0.5);
	}
	else 
	{
		_1s=(yyGetInt32(_Zr)>=0.5);
		_2s=(yyGetInt32(__r)>=0.5);
		_3s=(yyGetInt32(_0s)>=0.5);
		_4s=(yyGetInt32(_y8)>=0.5);
	}
	var _5s=
	{
		_Ip:_1s,_Jp:_2s,_Kp:_3s,alpha:_4s	}
	;
	_i7._p9._F9(_d9._6s,_5s);
}

function _Eo(_Zr,__r,_0s,_y8)
{
	_Do(_Zr,__r,_0s,_y8);
}

function _Fo(_Np)
{
	_7s=(yyGetInt32(_Np)>=0.5)?true:false;
	_i7._p9._F9(_d9._8s,yyGetInt32(_Np)>=0.5);
}

function _Go(_5k)
{
	_9s=yyGetInt32(_5k)/255.0;
	_i7._p9._F9(_d9._as,yyGetInt32(_5k));
}

function _Ho(_bs)
{
	var _cs=_i7._ds;
	var i;
	if(yyGetBool(_bs))
	{
		for(i=0;i<_cs;i++)
		{
			_i7._p9._es(i,_d9._fs,_d9._gs);
			_i7._p9._es(i,_d9._hs,_d9._gs);
		}
	}
	else 
	{
		for(i=0;i<_cs;i++)
		{
			_i7._p9._es(i,_d9._fs,_d9._is);
			_i7._p9._es(i,_d9._hs,_d9._is);
		}
	}
}

function _Io(_js,_bs)
{
	var _ks,_ls;
	if(Array.isArray(_js))
	{
		var _Ar=_js;
		_ks=yyGetInt32(_Ar[0]);
		_ls=yyGetBool(_Ar[1]);
	}
	else 
	{
		_ks=yyGetInt32(_js);
		_ls=yyGetBool(_bs);
	}
	if(_ls)
	{
		_i7._p9._es(_ks,_d9._fs,_d9._gs);
		_i7._p9._es(_ks,_d9._hs,_d9._gs);
	}
	else 
	{
		_i7._p9._es(_ks,_d9._fs,_d9._is);
		_i7._p9._es(_ks,_d9._hs,_d9._is);
	}
}

function _Jo(_ms)
{
	var _cs=_i7._ds;
	var i;
	if(yyGetBool(_ms))
	{
		for(i=0;i<_cs;i++)
		{
			_i7._p9._es(i,_d9._ns,_d9._os);
			_i7._p9._es(i,_d9._ps,_d9._os);
		}
	}
	else 
	{
		for(i=0;i<_cs;i++)
		{
			_i7._p9._es(i,_d9._ns,_d9._qs);
			_i7._p9._es(i,_d9._ps,_d9._qs);
		}
	}
}

function _Ko(_js,_ms)
{
	var _ks,repeat;
	if(Array.isArray(_js))
	{
		var _Ar=_js;
		_ks=yyGetInt32(_Ar[0]);
		repeat=yyGetBool(_Ar[1]);
	}
	else 
	{
		_ks=yyGetInt32(_js);
		repeat=yyGetBool(_ms);
	}
	if(repeat)
	{
		_i7._p9._es(_ks,_d9._ns,_d9._os);
		_i7._p9._es(_ks,_d9._ps,_d9._os);
	}
	else 
	{
		_i7._p9._es(_ks,_d9._ns,_d9._qs);
		_i7._p9._es(_ks,_d9._ps,_d9._qs);
	}
}

function _Lo(_rs)
{
	var filter=_rs;
	for(var i=0;i<_i7._ds;i++)
	{
		_i7._p9._es(i,_d9._ss,filter);
	}
}

function _Mo(_ts,_rs)
{
	var _us=_ts;
	var filter=_rs;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	_i7._p9._es(_us,_d9._ss,filter);
}

function _No(_vs)
{
	var _ws=_vs;
	for(var i=0;i<_i7._ds;i++)
	{
		_i7._p9._es(i,_d9._xs,_ws);
	}
}

function _Oo(_ts,_vs)
{
	var _us=_ts;
	var _ws=_vs;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	_i7._p9._es(_us,_d9._xs,_ws);
}

function _Po(_ys)
{
	var _zs=_ys;
	for(var i=0;i<_i7._ds;i++)
	{
		_i7._p9._es(i,_d9._As,_zs);
	}
}

function _Qo(_ts,_ys)
{
	var _us=_ts;
	var _zs=_ys;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	_i7._p9._es(_us,_d9._As,_zs);
}

function _Ro(_Bs)
{
	var _Cs=_Bs;
	for(var i=0;i<_i7._ds;i++)
	{
		_i7._p9._es(i,_d9._Ds,_Cs);
	}
}

function _So(_ts,_Bs)
{
	var _us=_ts;
	var _Cs=_Bs;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	_i7._p9._es(_us,_d9._Ds,_Cs);
}

function _To(_Es)
{
	var _Fs=_Es;
	for(var i=0;i<_i7._ds;i++)
	{
		_i7._p9._es(i,_d9._Gs,_Fs);
	}
}

function _Uo(_ts,_Es)
{
	var _us=_ts;
	var _Fs=_Es;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	_i7._p9._es(_us,_d9._Gs,_Fs);
}

function _Vo(_Np)
{
	var enable=_Np;
	for(var i=0;i<_i7._ds;
i++)
	{
		_i7._p9._es(i,_d9._Hs,enable);
	}
}

function _Wo(_ts,_Np)
{
	var _us=_ts;
	var enable=_Np;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	_i7._p9._es(_us,_d9._Hs,enable);
}

function _Xo()
{
	return _i7._p9._q9(_d9._ir)?1.0:0.0;
}

function _Yo()
{
	return _i7._p9._q9(_d9._kr);
}

function _Zo()
{
	return _i7._p9._q9(_d9._mr);
}

function __o()
{
	return _i7._p9._q9(_d9._or);
}

function _0p()
{
	return _i7._p9._q9(_d9._pr);
}

function _1p()
{
	return _i7._p9._q9(_d9._rr);
}

function _2p()
{
	return _i7._p9._q9(_d9._sr);
}

function _3p()
{
	return _i7._p9._q9(_d9._tr);
}

function _4p()
{
	return _i7._p9._q9(_d9._ur)?1.0:0.0;
}

function _5p()
{
	return _i7._p9._q9(_d9._vr)?1.0:0.0;
}

function _6p()
{
	return _X9;
}

function _7p()
{
	return _i7._p9._q9(_d9._wr);
}

function _8p()
{
	return _i7._p9._q9(_d9._xr)?1.0:0.0;
}

function _9p()
{
	var _Ar=new Array();
	_Ar.push(_i7._p9._q9(_d9._Br)?1.0:0.0);
	_Ar.push(_i7._p9._q9(_d9._Cr));
	_Ar.push(_i7._p9._q9(_d9._Dr));
	_Ar.push(_i7._p9._q9(_d9._Er));
	return _Ar;
}

function _ap()
{
	return _i7._p9._q9(_d9._Gr);
}

function _bp()
{
	var _Pr=_i7._p9._q9(_d9._r9);
	var _Qr=_i7._p9._q9(_d9._s9);
	var _Tr=_i7._p9._q9(_d9._t9);
	var _Ur=_i7._p9._q9(_d9._u9);
	if((_Pr!=_Tr)||(_Qr!=_Ur))
	{
		return -1;
	}
	else 
	{
		switch(_Pr)
		{
			case _Is:
			{
				switch(_Qr)
				{
					case _Js:return 0;
					case _Ks:return 1;
					case _Ls:return 2;
					default :return -1;
				}
			}
			case _Ms:
			{
				if(_Qr==_Ls)
				{
					return 3;
				}
				else 
				{
					return -1;
				}
			}
			default :return -1;
		}
	}
}

function _cp()
{
	var _Ar=new Array();
	_Ar[0]=_i7._p9._q9(_d9._r9);
	_Ar[1]=_i7._p9._q9(_d9._s9);
	return _Ar;
}

function _dp()
{
	var _Ar=new Array();
	_Ar[0]=_i7._p9._q9(_d9._r9);
	_Ar[1]=_i7._p9._q9(_d9._s9);
	_Ar[2]=_i7._p9._q9(_d9._t9);
	_Ar[3]=_i7._p9._q9(_d9._u9);
	return _Ar;
}

function _ep()
{
	return _i7._p9._q9(_d9._r9);
}

function _fp()
{
	return _i7._p9._q9(_d9._s9);
}

function _gp()
{
	return _i7._p9._q9(_d9._t9);
}

function _hp()
{
	return _i7._p9._q9(_d9._u9);
}

function _Ns()
{
	return _i7._p9._q9(_d9._Ir);
}

function _Os()
{
	var _Ar=new Array();
	_Ar[0]=_i7._p9._q9(_d9._Ir);
	_Ar[1]=_i7._p9._q9(_d9._Kr);
	return _Ar;
}

function _ip()
{
	var _0d=_i7._p9._q9(_d9._6s);
	var _r3=new Array();
	_r3.push(_0d._Ip?1.0:0.0);
	_r3.push(_0d._Jp?1.0:0.0);
	_r3.push(_0d._Kp?1.0:0.0);
	_r3.push(_0d.alpha?1.0:0.0);
	return _r3;
}

function _jp()
{
	return _ip();
}

function _kp()
{
	return _i7._p9._q9(_d9._8s)?1.0:0.0;
}

function _lp()
{
	return _i7._p9._q9(_d9._as);
}

function _mp()
{
	return _i7._p9._Ps(0,_d9._fs)==_d9._gs?1.0:0.0;
}

function _np(_js)
{
	return _i7._p9._Ps(yyGetInt32(_js),_d9._fs)==_d9._gs?1.0:0.0;
}

function _op()
{
	return _i7._p9._Ps(0,_d9._ns)==_d9._os?1.0:0.0;
}

function _pp(_js)
{
	return _i7._p9._Ps(yyGetInt32(_js),_d9._ns)==_d9._os?1.0:0.0;
}

function _qp()
{
	return _i7._p9._Ps(0,_d9._ss);
}

function _rp(_ts)
{
	var _us=_ts;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	return _i7._p9._Ps(_us,_d9._ss);
}

function _sp()
{
	return _i7._p9._Ps(0,_d9._xs);
}

function _tp(_ts)
{
	var _us=_ts;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	return _i7._p9._Ps(_us,_d9._xs);
}

function _up()
{
	return _i7._p9._Ps(0,_d9._As);
}

function _vp(_ts)
{
	var _us=_ts;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	return _i7._p9._Ps(_us,_d9._As);
}

function _wp()
{
	return _i7._p9._Ps(0,_d9._Ds);
}

function _xp(_ts)
{
	var _us=_ts;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	return _i7._p9._Ps(_us,_d9._Ds);
}

function _yp()
{
	return _i7._p9._Ps(0,_d9._Gs);
}

function _zp(_ts)
{
	var _us=_ts;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	return _i7._p9._Ps(_us,_d9._Gs);
}

function _Ap()
{
	return _i7._p9._Ps(0,_d9._Hs);
}

function _Bp(_ts)
{
	var _us=_ts;
	if((_us<0)||(_us>=_i7._ds))
	{
		return;
	}
	return _i7._p9._Ps(_us,_d9._Hs);
}

function _Cp()
{
	_i7._p9._Qs();
}

function _Dp()
{
	_i7._p9._Rs();
}
var _Ss=undefined;
var _Ts=undefined;

function _Us()
{
	if(_Ss==undefined)
	{
		_Ss=["blendenable",_d9._ur,"ztestenable",_d9._vr,"zfunc",_d9._wr,"zwriteenable",_d9._xr,"fogenable",_d9._Br,"fogcolor",_d9._Cr,"fogstart",_d9._Dr,"fogend",_d9._Er,"cullmode",_d9._Gr,"srcblend",_d9._r9,"destblend",_d9._s9,"srcblendalpha",_d9._t9,"destblendalpha",_d9._u9,"sepalphaenable",_d9._v9,"colorwriteenable",_d9._6s,"alphatestenable",_d9._8s,"alphatestref",_d9._as,"alphatestfunc",_d9._Vs,"stencilenable",_d9._ir,"stencilfunc",_d9._kr,"stencilref",_d9._mr,"stencilreadmask",_d9._or,"stencilwritemask",_d9._pr,"stencilfail",_d9._rr,"stencilzfail",_d9._sr,"stencilpass",_d9._tr,];
	}
}

function _Ws()
{
	if(_Ts==undefined)
	{
		_Ts=["magfilter",_d9._fs,"minfilter",_d9._hs,"mipfilter",_d9._Xs,"addressu",_d9._ns,"addressv",_d9._ps,"minmip",_d9._As,"maxmip",_d9._Ds,"mipbias",_d9._xs,"maxaniso",_d9._Gs,"mipenable",_d9._Hs];
	}
}

function _Ep()
{
	_Us();
	_Ws();
	var map=ds_map_create();
	var _Ys=_Ss.length/2;
	var _Zs=_Ts.length/2;
	var i;
	for(i=0;i<_Ys;i++)
	{
		var _0d=_i7._p9._q9(_Ss[i*2+1]);
		ds_map_add(map,_Ss[i*2],_0d);
	}
	var _cs=_i7._ds;
	for(i=0;i<_Zs;i++)
	{
		var _05;
		for(_05=0;_05<_cs;_05++)
		{
			var name=_Ts[i*2].slice(0)+_05;
			var _0d=_i7._p9._Ps(_05,_Ts[i*2+1]);
			ds_map_add(map,name,_0d);
		}
	}
	return map;
}

function _Fp(_a6)
{
	_a6=yyGetInt32(_a6);
	_Us();
	_Ws();
	var i;
	var _Ys=_Ss.length/2;
	var _Zs=_Ts.length/2;
	var __s=ds_map_find_first(_a6);
	while(__s!=undefined) 
	{
		var key=__s;
		var value=ds_map_find_value(_a6,key);
		var _0t=false;
		for(i=0;i<_Ys;i++)
		{
			if(key==_Ss[i*2])
			{
				_i7._p9._F9(_Ss[i*2+1],value);
				_0t=true;
				break;
			}
		}
		if(!_0t)
		{
			for(i=0;i<_Zs;i++)
			{
				var _1t=_Ts[i*2].length;
				var _2t=key.substr(0,_1t);
				if(_2t==_Ts[i*2])
				{
					var _3t=key.substr(_1t-1,key.length-_1t);
					var _vn=parseInt(_3t,10);
					_i7._p9._es(_vn,_Ts[i*2+1],value);
					break;
				}
			}
		}
		__s=ds_map_find_next(_a6,__s);
	}
}

function _4t()
{
}
var _5t=1970;
var _6t=0;
var _7t=1;
var _8t=365.25;
var _9t=30.4375;
var _at=[31,28,31,30,31,30,31,31,30,31,30,31];
var _bt=[];
var _ct=(86400.0);
var _dt=(_ct*30);
var _et=true;
var _ft=0;
var _gt=1;

function _ht(_it)
{
	if(_it<_jt)
	{
		return _it*_kt;
	}
	else 
	{
		return(_it-_jt)*_kt;
	}
}

function _lt(_mt)
{
	return _mt%400==0||(_mt%100!=0&&_mt%4==0);
}

function _nt(_mt)
{
	var _ot=_at.slice();
	;
	if(_lt(_mt))
	{
		_ot[1]=29;
	}
	return _ot;
}

function _pt(_mt,_qt,_rt,_st,_tt,_ut,_vt)
{
	_mt=yyGetInt32(_mt);
	_qt=yyGetInt32(_qt);
	_rt=yyGetInt32(_rt);
	_st=yyGetInt32(_st);
	_tt=yyGetInt32(_tt);
	_ut=yyGetInt32(_ut);
	_vt=yyGetInt32(_vt);
	if((_mt>=1970)&&(_qt>=1)&&(_qt<=12)&&(_rt>=1)&&(_rt<=31)&&(_st>=0)&&(_st<=23)&&(_tt>=0)&&(_tt<=59)&&(_ut>=0)&&(_ut<=59)&&(_vt>=0)&&(_vt<=999))
	{
		if(_rt>28)
		{
			switch(_qt)
			{
				case 2:if(!_lt(_mt)||(_rt>29))
				{
					return 0;
				}
				break;
				case 4:case 6:case 9:case 11:if(_rt>30)
				{
					return 0;
				}
				break;
			}
		}
	}
	else 
	{
		return 0;
	}
	return 1;
}
var _kt=86400000.0;
var _jt=25569;

function date_current_datetime()
{
	var _wt=new Date();
	var _xt=_wt.getMilliseconds();
	var _K5=_wt.getTime()-_xt;
	return(_K5/_kt)+_jt;
}

function _yt()
{
	var _en=new Date();
	return(~~(_en.getTime()/_kt))+_jt;
}

function _zt()
{
	var _en=new Date();
	_en.setFullYear(_5t,_6t,_7t);
	var _At=(_en.getTime()/_kt)+_jt;
	return(_At-(~~_At));
}

function date_create_datetime(_Bt,_Ct,_Dt,_Et,_Ft,_Gt)
{
	_Bt=yyGetInt32(_Bt);
	_Ct=yyGetInt32(_Ct);
	_Dt=yyGetInt32(_Dt);
	_Et=yyGetInt32(_Et);
	_Ft=yyGetInt32(_Ft);
	_Gt=yyGetInt32(_Gt);
	var _en=new Date();
	if(_et)
	{
		_en.setFullYear(_Bt,_Ct-1,_Dt);
		_en.setHours(_Et,_Ft,_Gt,10);
	}
	else 
	{
		_en.setUTCFullYear(_Bt,_Ct-1,_Dt);
		_en.setUTCHours(_Et,_Ft,_Gt,10);
	}
	return(_en.getTime()/_kt)+_jt;
}

function date_get_year(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	return(_et)?_en.getFullYear():_en.getUTCFullYear();
}

function date_get_month(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	return(_et)?(_en.getMonth())+1:(_en.getUTCMonth())+1;
}

function date_get_day(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	return(_et)?_en.getDate():_en.getUTCDate();
}

function date_get_weekday(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	return(_et)?_en.getDay():_en.getUTCDay();
}

function date_get_week(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	var w=_Ht(_en);
	return floor(w/7);
}

function date_get_hour(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	return(_et)?_en.getHours():_en.getUTCHours();
}

function date_get_minute(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	return(_et)?_en.getMinutes():_en.getUTCMinutes();
}

function date_get_second(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	return(_et)?_en.getSeconds():_en.getUTCSeconds();
}

function _Ht(_It)
{
	var _rt=0;
	if(_et)
	{
		var _Jt=_nt(_It.getFullYear());
		for(var i=0;i<_It.getMonth();i++)
		{
			_rt+=_Jt[i];
		}
		_rt+=_It.getDate();
	}
	else 
	{
		var _Jt=_nt(_It.getUTCFullYear());
		for(var i=0;i<_It.getUTCMonth();i++)
		{
			_rt+=_Jt[i];
		}
		_rt+=_It.getUTCDate();
	}
	return _rt;
}

function date_valid_datetime(_Bt,_Ct,_Dt,_Et,_Ft,_Gt)
{
	return _pt(yyGetInt32(_Bt),yyGetInt32(_Ct),yyGetInt32(_Dt),yyGetInt32(_Et),yyGetInt32(_Ft),yyGetInt32(_Gt),0);
}

function date_inc_year(_Kt,_Lt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	_en.setUTCFullYear(_en.getUTCFullYear()+yyGetInt32(_Lt),_en.getUTCMonth(),_en.getUTCDate());
	return(_en.getTime()/_kt)+_jt;
}

function date_inc_month(_Kt,_Lt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	_en.setUTCFullYear(_en.getUTCFullYear(),_en.getUTCMonth()+yyGetInt32(_Lt),_en.getUTCDate());
	return(_en.getTime()/_kt)+_jt;
}

function date_inc_week(_Kt,_Lt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	_en.setUTCFullYear(_en.getUTCFullYear(),_en.getUTCMonth(),_en.getUTCDate()+(yyGetInt32(_Lt)*7));
	return(_en.getTime()/_kt)+_jt;
}

function date_inc_day(_Kt,_Lt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	_en.setUTCFullYear(_en.getUTCFullYear(),_en.getUTCMonth(),_en.getUTCDate()+yyGetInt32(_Lt));
	return(_en.getTime()/_kt)+_jt;
}

function date_inc_hour(_Kt,_Lt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	_en.setUTCHours(_en.getUTCHours()+yyGetInt32(_Lt),_en.getUTCMinutes(),_en.getUTCSeconds(),_en.getUTCMilliseconds());
	return(_en.getTime()/_kt)+_jt;
}

function date_inc_minute(_Kt,_Lt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	_en.setUTCHours(_en.getUTCHours(),_en.getUTCMinutes()+yyGetInt32(_Lt),_en.getUTCSeconds(),_en.getUTCMilliseconds());
	return(_en.getTime()/_kt)+_jt;
}

function date_inc_second(_Kt,_Lt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	_en.setUTCHours(_en.getUTCHours(),_en.getUTCMinutes(),_en.getUTCSeconds()+yyGetInt32(_Lt),_en.getUTCMilliseconds());
	return(_en.getTime()/_kt)+_jt;
}

function date_get_day_of_year(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	var _Mt=_Ht(_en);
	return _Mt;
}

function date_get_hour_of_year(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	var _Mt=_Ht(_en);
	var _Nt=(_Mt-1)*24;
	if(_et)_Nt+=_en.getHours();
	else _Nt+=_en.getUTCHours();
	return _Nt;
}

function date_get_minute_of_year(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	var _Mt=_Ht(_en);
	var _Ot=(_Mt-1)*24*60;
	if(_et)
	{
		_Ot+=_en.getHours()*60;
		_Ot+=_en.getMinutes();
	}
	else 
	{
		_Ot+=_en.getUTCHours()*60;
		_Ot+=_en.getUTCMinutes();
	}
	return _Ot;
}

function date_get_second_of_year(_a5)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_a5)));
	var _Mt=_Ht(_en);
	var _Pt=(_Mt-1)*24*60*60;
	if(_et)
	{
		_Pt+=_en.getHours()*60*60;
		_Pt+=_en.getMinutes()*60;
		_Pt+=_en.getSeconds();
	}
	else 
	{
		_Pt+=_en.getUTCHours()*60*60;
		_Pt+=_en.getUTCMinutes()*60;
		_Pt+=_en.getUTCSeconds();
	}
	return _Pt;
}

function date_year_span(_Qt,_Rt)
{
	var _en=new Date();
	var _St=_en.setTime(_ht(yyGetReal(_Qt)));
	var _Tt=_en.setTime(_ht(yyGetReal(_Rt)));
	var _Ut=(_Tt-_St);
	return Math.abs(Math.floor(_Ut/1000)/60/60/24/_8t);
}

function date_month_span(_Qt,_Rt)
{
	var _en=new Date();
	var _St=_en.setTime(_ht(yyGetReal(_Qt)));
	var _Tt=_en.setTime(_ht(yyGetReal(_Rt)));
	var _Ut=(_Tt-_St);
	return Math.abs(Math.floor(_Ut/1000)/60/60/24/_9t);
}

function date_week_span(_Qt,_Rt)
{
	var _en=new Date();
	var _St=_en.setTime(_ht(yyGetReal(_Qt)));
	var _Tt=_en.setTime(_ht(yyGetReal(_Rt)));
	var _Ut=(_Tt-_St);
	return Math.abs(Math.floor(_Ut/1000)/60/60/24/7);
}

function date_day_span(_Qt,_Rt)
{
	var _en=new Date();
	var _St=_en.setTime(_ht(yyGetReal(_Qt)));
	var _Tt=_en.setTime(_ht(yyGetReal(_Rt)));
	var _Ut=(_Tt-_St);
	return Math.abs(Math.floor(_Ut/1000)/60/60/24);
}

function date_hour_span(_Qt,_Rt)
{
	var _en=new Date();
	var _St=_en.setTime(_ht(yyGetReal(_Qt)));
	var _Tt=_en.setTime(_ht(yyGetReal(_Rt)));
	var _Ut=(_Tt-_St);
	return Math.abs(Math.floor(_Ut/1000)/60/60);
}

function date_minute_span(_Qt,_Rt)
{
	var _en=new Date();
	var _St=_en.setTime(_ht(yyGetReal(_Qt)));
	var _Tt=_en.setTime(_ht(yyGetReal(_Rt)));
	var _Ut=(_Tt-_St);
	return Math.abs(Math.floor(_Ut/1000)/60);
}

function date_second_span(_Qt,_Rt)
{
	var _en=new Date();
	var _St=_en.setTime(_ht(yyGetReal(_Qt)));
	var _Tt=_en.setTime(_ht(yyGetReal(_Rt)));
	var _Ut=(_Tt-_St);
	return ~~Math.abs(Math.floor(_Ut/1000));
}

function _Vt(_Kt)
{
	var _en=new Date();
	_en.setTime(_ht(_Kt));
	return(_en.getHours()-_en.getUTCHours())*60*60*1000;
}

function date_compare_datetime(_Qt,_Rt)
{
	_Qt=yyGetReal(_Qt);
	_Rt=yyGetReal(_Rt);
	if(_Qt<_Rt)
	{
		return -1;
	}
	else if(_Qt>_Rt)
	{
		return 1;
	}
	return 0;
}

function date_compare_date(_Qt,_Rt)
{
	var _Wt=new Date();
	_Wt.setTime(_ht(yyGetReal(_Qt)));
	var _Xt=new Date();
	_Xt.setTime(_ht(yyGetReal(_Rt)));
	var _St=(_Wt.getFullYear()*366)+(_Wt.getMonth()*31)+_Wt.getDate();
	var _Tt=(_Xt.getFullYear()*366)+(_Xt.getMonth()*31)+_Xt.getDate();
	return(_St==_Tt)?0.0:((_St>_Tt)?1.0:-1.0);
}

function date_compare_time(_Qt,_Rt)
{
	var _Wt=new Date();
	_Wt.setTime(_ht(yyGetReal(_Qt)));
	var _Xt=new Date();
	_Xt.setTime(_ht(yyGetReal(_Rt)));
	var _Yt=(_Wt.getHours()*3600)+(_Wt.getMinutes()*60)+_Wt.getSeconds();
	var _Zt=(_Xt.getHours()*3600)+(_Xt.getMinutes()*60)+_Xt.getSeconds();
	return(_Yt==_Zt)?0.0:((_Yt>_Zt)?1.0:-1.0);
}

function __t(_0u)
{
	return(_0u-_jt)*_ct;
}

function _1u(_0u)
{
	return((_0u+0.5)/_ct)+_jt;
}

function _2u(_K5)
{
	let _3u=new Date(_K5._mt+1900,_K5._qt,_K5._rt,_K5._st,_K5._tt,_K5._ut);
	if(_et)return _3u.getTime()/1000;
	return _3u.getTime()/1000-_3u.getTimezoneOffset()*60;
}

function _4u(time)
{
	let _3u=new Date(time*1000);
	let tm=
	{
		_mt:_3u.getUTCFullYear()-1900,_qt:_3u.getUTCMonth(),_rt:_3u.getUTCDate(),_st:_3u.getUTCHours(),_tt:_3u.getUTCMinutes(),_ut:_3u.getUTCSeconds()	}
	;
	if(_et)
	{
		tm._mt=_3u.getFullYear()-1900;
		tm._qt=_3u.getMonth();
		tm._rt=_3u.getDate();
		tm._st=_3u.getHours();
		tm._tt=_3u.getMinutes();
		tm._ut=_3u.getSeconds();
	}
	return tm;
}

function date_date_of(_Kt)
{
	let result=-1;
	let _5u=__t(_Kt);
	let _6u=_4u(_5u);
	if(_6u)
	{
		_6u._st=0;
		_6u._tt=0;
		_6u._ut=0;
		result=_1u(_2u(_6u));
	}
	return result;
}

function date_time_of(_Kt)
{
	return frac(yyGetReal(_Kt));
}

function _7u(_Gc)
{
	return((_Gc<10)?"0":"")+_Gc.toString();
}

function date_datetime_string(_Kt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	var _Pj;
	if(_et)
	{
		_Pj=_7u(_en.getDate())+"/"+_7u(_en.getMonth()+1)+"/"+_en.getFullYear()+" "+_7u(_en.getHours())+":"+_7u(_en.getMinutes())+":"+_7u(_en.getSeconds());
	}
	else 
	{
		_Pj=_7u(_en.getUTCDate())+"/"+_7u(_en.getUTCMonth()+1)+"/"+_en.getUTCFullYear()+" "+_7u(_en.getUTCHours())+":"+_7u(_en.getUTCMinutes())+":"+_7u(_en.getUTCSeconds());
	}
	return _Pj;
}

function date_date_string(_Kt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	var _Pj;
	if(_et)
	{
		_Pj=_7u(_en.getDate())+"/"+_7u(_en.getMonth()+1)+"/"+_en.getFullYear();
	}
	else 
	{
		_Pj=_7u(_en.getUTCDate())+"/"+_7u(_en.getUTCMonth()+1)+"/"+_en.getUTCFullYear();
	}
	return _Pj;
}

function date_time_string(_Kt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	if(_en.toString()=="Invalid Date")
	{
		return "invalid time";
	}
	var _Pj;
	if(_et)
	{
		_Pj=_7u(_en.getHours())+":"+_7u(_en.getMinutes())+":"+_7u(_en.getSeconds());
	}
	else 
	{
		_Pj=_7u(_en.getUTCHours())+":"+_7u(_en.getUTCMinutes())+":"+_7u(_en.getUTCSeconds());
	}
	return _Pj;
}

function date_days_in_month(_Kt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	if(_et)
	{
		var _Jt=_nt(_en.getFullYear());
		return _Jt[_en.getMonth()];
	}
	var _Jt=_nt(_en.getUTCFullYear());
	return _Jt[_en.getUTCMonth()];
}

function date_days_in_year(_Kt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	var _Mt=0;
	var _Jt;
	if(_et)_Jt=_nt(_en.getFullYear());
	else _Jt=_nt(_en.getUTCFullYear());
	for(var i=0;i<_Jt.length;
i++)
	{
		_Mt+=_Jt[i];
	}
	return _Mt;
}

function date_leap_year(_Kt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	if(_et)return _lt(_en.getFullYear());
	return _lt(_en.getUTCFullYear());
}

function date_is_today(_Kt)
{
	var _en=new Date();
	_en.setTime(_ht(yyGetReal(_Kt)));
	var _8u=new Date();
	if(_et)
	{
		if((_en.getFullYear()==_8u.getFullYear())&&(_en.getMonth()==_8u.getMonth())&&(_en.getDate()==_8u.getDate()))
		{
			return true;
		}
	}
	else 
	{
		if((_en.getUTCFullYear()==_8u.getUTCFullYear())&&(_en.getUTCMonth()==_8u.getUTCMonth())&&(_en.getUTCDate()==_8u.getUTCDate()))
		{
			return true;
		}
	}
	return false;
}

function date_set_timezone(_9u)
{
	_et=(yyGetInt32(_9u)==_ft);
}

function date_get_timezone()
{
	if(_et)return _ft;
	return _gt;
}
var _au=[];
var _bu=[];
var _cu=[];
var _du=Date.now();
var _eu=0;
var _fu=1;
var _gu=2;
var _hu=3;
var _iu=
function(text)
{
	if(!text)return;
	if(_ju)
	{
		if(_ku)
		{
			var _Sb=_ku.document.getElementById('debug_console');
			if(_Sb)
			{
				var _lu=String.fromCharCode(0x0a);
				text=text.replace('<b>','').replace('</b>','');
				var _mu=Date.now()-_du;
				if(!_Sb)
				{
					alert(text);
				}
				else 
				{
					_Sb.value+=text+_lu;
					var _Sg=_Sb.textLength;
				}
				_du=Date.now();
			}
		}
	}
	if(_nu!=undefined)
	{
		if(_nu.Options.outputDebugToConsole)console.log(text);
		if(_nu.Options.outputDebugToDiv)
		{
			var _ou=document.getElementById("yyDebugDiv");
			var _pu=document.createElement('P');
			_pu.textContent+=text;
			_ou.appendChild(_pu);
		}
	}
}
;

function debug(text)
{
	var index;
	for(index=0;index<arguments.length;++index)
	{
		_iu(arguments[index]);
	}
}

function _qu(_ru,_su,_tu,_uu,_vu)
{
	this.gmlmessage=_ru;
	this.gmllongMessage=_su;
	this.gmlstacktrace=_vu;
	this.gmlscript=_tu;
	this.gmlline=_uu;
	this.__yyIsGMLObject=true;
}
_qu.prototype.toString=
function()
{
	return yyGetString(this);
}
;

function __yy__processException(_wu)
{
	if(_wu instanceof Error)
	{
		var message=(_wu.message)?_wu.message:"";
		var _xu=(_wu.message)?_wu.constructor.name+" - "+_wu.message:"";
		var _yu=(_wu.fileName)?_wu.fileName:"";
		var _zu=(_wu.lineNumber)?_wu.lineNumber:-1;
		var _Au=[];
		if(_wu.stack)
		{
			_Au=_wu.stack.split(/_Bu?_Cu/);
		}
		_wu=new _qu(message,_xu,_yu,_zu,_Au);
		;
	}
	return _wu;
}

function _I3(text)
{
	var index;
	var _Du=_Eu();
	var _Fu=new _qu(text,text,_Gu(_I3.caller.name),-1,_Du);
	throw _Fu;
}

function _sg(_Hu)
{
	if(!_cu[_Hu])
	{
		_cu[_Hu]=true;
		_Au(_Hu);
		debug(_Hu);
	}
}

function _0b(_Hu,_Iu)
{
	if(!_au[_Hu])
	{
		_au[_Hu]=true;
		var _Ju="Error: function "+_Hu+" is not supported.";
		debug(_Ju);
	}
	return _Iu;
}

function _Ku(name,_Lu)
{
	return()=>_0b(name,_Lu);
}

function _Mu(_Hu)
{
	if(!_au[_Hu])
	{
		_au[_Hu]=true;
		var _Ju="Error: "+_Hu+" is not supported.";
		debug(_Ju);
	}
}

function _Nu(_Hu)
{
	if(!_au[_Hu])
	{
		_au[_Hu]=true;
		var _Ju="Error: function "+_Hu+" is not yet implemented";
		debug(_Ju);
	}
}

function _Ou(_Hu)
{
	if(!_bu[_Hu])
	{
		_bu[_Hu]=true;
		var _Ju="Warning: function "+_Hu;
		debug(_Ju);
	}
}

function _Pu(_Qu)
{
	var _Ru=_Su._Tu(_Qu,-1);
	var _lu=String.fromCharCode(0x0a);
	var _hg="";
	for(var i=0;i<_Ru.length;i++)
	{
		if(i!=0)_hg=_hg+_lu;
		_hg+=_Ru[i];
	}
	return _hg;
}

function _Uu(_Vu)
{
	if(!_Vu)return;
	alert(_Vu);
}

function _Wu(_Vu,_Xu)
{
	if(!_Vu)return;
	alert(_Vu);
}

function debug_event(_f2)
{
	switch(_f2)
	{
		case "RangeError":
		{
			throw new _Yu("debug_event");
		}
		break;
		default :break;
	}
}

function dbg_view()
{
	_0b("dbg_view()");
}

function dbg_section()
{
	_0b("dbg_seciton()");
}

function dbg_view_delete()
{
	_0b("dbg_view_delete()");
}

function dbg_section_delete()
{
	_0b("dbg_section_delete()");
}

function dbg_slider()
{
	_0b("dbg_slider()");
}

function dbg_drop_down()
{
	_0b("dbg_drop_down()");
}

function dbg_watch()
{
	_0b("dbg_watch()");
}

function dbg_same_line()
{
	_0b("dbg_same_line()");
}

function dbg_button()
{
	_0b("dbg_button()");
}

function dbg_text_input()
{
	_0b("dbg_text_input()");
}

function dbg_checkbox()
{
	_0b("dbg_checkbox()");
}

function dbg_colour()
{
	_0b("dbg_colour()");
}

function dbg_color()
{
	_0b("dbg_color()");
}

function dbg_text()
{
	_0b("dbg_text()");
}

function dbg_sprite()
{
	_0b("dbg_sprite()");
}

function dbg_slider_int()
{
	_0b("dbg_slider_int()");
}

function dbg_add_font_glyphs()
{
	_0b("dbg_add_font_glyphs()");
}

function ref_create()
{
	_0b("ref_create()");
	return 0;
}

function is_debug_overlay_open()
{
	return false;
}

function is_mouse_over_debug_overlay()
{
	return false;
}

function is_keyboard_used_debug_overlay()
{
	return false;
}

function show_debug_log()
{
	_0b("show_debug_log()");
	;
}

function show_debug_message(_Qu)
{
	var _Xf=yyGetString(_Qu);
	if(!_Xf)return;
	if(arguments.length==1)
	{
		debug(_Xf);
		return;
	}
	if(typeof(_Xf)!="string")
	{
		_I3("show_debug_message() trying to use string template but argument0 is not a string");
	}
	var _Zu=[];
	for(var _u5=1;_u5<arguments.length;++_u5)
	{
		_Zu.push(arguments[_u5]);
	}
	debug(__u(_Xf,_Zu));
}

function show_debug_message_ext(_Qu,_Zu)
{
	var _Xf=yyGetString(_Qu);
	if(!_Xf)return;
	if(typeof(_Xf)!="string")
	{
		_I3("show_debug_message_ext() argument0 is not a string");
	}
	if(!(_Zu instanceof Array))
	{
		_I3("show_debug_message_ext() argument1 is not an array");
	}
	debug(__u(_Xf,_Zu));
}

function show_debug_overlay(_0v)
{
}

function debug_get_callstack(_1v)
{
	var _2v=[];
	if(_1v==undefined)_1v=100;
	var caller=arguments.callee.caller;
	while(caller!=null) 
	{
		_2v.push(caller);
		if(_2v.length>=_1v)break;
		caller=caller.caller;
		if(_2v.indexOf(caller)>=0)break;
	}
	var _3v=[];
	for(var i=0;i<_2v.length;i++)
	{
		_3v[i]=_2v[i].name;
	}
	_3v.push(0);
	return _3v;
}

function show_message_async(_Qu)
{
	_4v(_5v,_hu,[yyGetString(_Qu)]);
	return _5v++;
}

function show_message(_Qu)
{
	var _Xf=yyGetString(_Qu);
	if(!_Xf)return;
	alert(_Xf);
}

function show_error(_6v,_7v)
{
	_6v=yyGetString(_6v);
	if(!_6v)return;
	alert(_6v);
}

function show_question_async(_6v)
{
	_4v(_5v,_gu,[yyGetString(_6v)]);
	return _5v++;
}

function show_question(_6v)
{
	if(window.confirm)
	{
		return confirm(yyGetString(_6v)||"")?1.0:0.0;
	}
	_0b("show_question()");
	return 0;
}

function get_integer_async(_6v,_8v)
{
	_4v(_5v,_fu,[yyGetString(_6v),yyGetString(_8v)]);
	return _5v++;
}

function get_integer(_6v,_8v)
{
	return parseFloat(prompt(yyGetString(_6v),yyGetString(_8v)));
}

function _9v(_av)
{
	var _x4=document.getElementById(_bv);
	var _cv=_x4.parentNode;
	var _dv=document.createElement("div");
	_ev="gm4html5_login_ID";
	_dv.setAttribute("class","gm4html5_login");
	_dv.setAttribute("id",_ev);
	_cv.insertBefore(_dv,_x4.nextSibling);
	_dv.innerHTML="<div class=\"gm4html5_login_header\">Login</div>"+"<table>"+"<tr>"+"<td><label for=\"username\" id=\"gm4html5_login_label_username_id\">Username:</label></td>"+"<td><input type=\"text\" id=\"gm4html5_login_username_id\" value=\"username\" /></td>"+"</tr>"+"<tr>"+"<td><label for=\"password\" id=\"gm4html5_login_label_password_id\">Password:</label></td>"+"<td><input type=\"password\" id=\"gm4html5_login_password_id\" value=\"password\" /></td>"+"</tr>"+"</table>"+"<div class=\"gm4html5_login_button\"><input type=\"button\" value=\"Login\" id=\"gm4html5_login_button_id\"/></div>"+"<div class=\"gm4html5_cancel_button\"><input type=\"button\" value=\"Cancel\" id=\"gm4html5_cancel_button_id\" /></div>";
	_fv();
	_gv=true;
	var login=document.getElementById("gm4html5_login_button_id");
	var _hv=document.getElementById("gm4html5_login_username_id");
	var _iv=document.getElementById("gm4html5_login_password_id");
	_hv.value=_av._jv[0];
	_iv.value=_av._jv[1];
	login.onmouseup=
function()
	{
		var _kv=_hv.value;
		var _lv=_iv.value;
		var _mv=_nv(_ev);
		if(!_mv)return;
		_mv._kv=_kv;
		_mv._lv=_lv;
		_mv.value=0;
		_mv.result="";
		_mv._ge=true;
		_mv._fe=_ov;
		_cv.removeChild(_dv);
		_gv=false;
		_pv();
		_qv(_av.id);
	}
	;
	var _rv=document.getElementById("gm4html5_cancel_button_id");
	_rv.onmouseup=
function()
	{
		_cv.removeChild(_dv);
		_gv=false;
		var _mv=_nv(_ev);
		if(!_mv)return;
		_mv._kv="";
		_mv._lv="";
		_mv.value=0;
		_mv.result="";
		_mv._ge=true;
		_mv._fe=_sv;
		_pv();
		_qv(_av.id);
	}
	;
	_tv();
	_be._ce(_av.id,null,_uv,_ev);
}

function _vv(_av)
{
	var _x4=document.getElementById(_bv);
	var _cv=_x4.parentNode;
	var _dv=document.createElement("div");
	_ev="gm4html5_input_ID";
	_dv.setAttribute("class","gm4html5_login");
	_dv.setAttribute("id",_ev);
	_cv.insertBefore(_dv,_x4.nextSibling);
	_dv.innerHTML="<table>"+"<tr>"+"<td><label for=\"username\" id=\"gm4html5_input_message_id\">Message</label></td>"+"</tr>"+"<tr>"+"<td><input type=\"text\" id=\"gm4html5_input_text_id\" value=\"text\" /></td>"+"</tr>"+"</table>"+"<div class=\"gm4html5_login_button\"><input type=\"button\" value=\"OK\" id=\"gm4html5_input_ok_button_id\"/></div>"+"<div class=\"gm4html5_cancel_button\"><input type=\"button\" value=\"Cancel\" id=\"gm4html5_input_cancel_button_id\" /></div>";
	_fv();
	_gv=true;
	var _wv=document.getElementById("gm4html5_input_message_id");
	var _xv=document.getElementById("gm4html5_input_text_id");
	_wv.innerHTML=_av._jv[0];
	_xv.value=_av._jv[1];
	var _yv=document.getElementById("gm4html5_input_ok_button_id");
	_yv.onmouseup=
function()
	{
		var text=_xv.value;
		var _mv=_nv(_ev);
		if(!_mv)return;
		_mv._kv="";
		_mv._lv="";
		_mv.value=parseFloat(text);
		_mv.result=text;
		_mv._ge=true;
		_mv._fe=_ov;
		_cv.removeChild(_dv);
		_gv=false;
		_pv();
		_qv(_av.id);
	}
	;
	var _rv=document.getElementById("gm4html5_input_cancel_button_id");
	_rv.onmouseup=
function()
	{
		_cv.removeChild(_dv);
		_gv=false;
		var _mv=_nv(_ev);
		if(!_mv)return;
		_mv._kv="";
		_mv._lv="";
		_mv.value=0;
		_mv.result="";
		_mv._ge=true;
		_mv._fe=_sv;
		_pv();
		_qv(_av.id);
	}
	;
	_tv();
	_be._ce(_av.id,null,_uv,_ev);
}

function _zv(_av)
{
	var _x4=document.getElementById(_bv);
	var _cv=_x4.parentNode;
	var _dv=document.createElement("div");
	_ev="gm4html5_question_ID";
	_dv.setAttribute("class","gm4html5_login");
	_dv.setAttribute("id",_ev);
	_cv.insertBefore(_dv,_x4.nextSibling);
	_dv.innerHTML="<table>"+"<tr>"+"<td><label for=\"username\" id=\"gm4html5_question_message_id\">Message</label></td>"+"</tr>"+"</table>"+"<div class=\"gm4html5_login_button\"><input type=\"button\" value=\"Yes\" id=\"gm4html5_question_yes_button_id\"/></div>"+"<div class=\"gm4html5_cancel_button\"><input type=\"button\" value=\"No\" id=\"gm4html5_question_no_button_id\" /></div>";
	_fv();
	_gv=true;
	var _Av=document.getElementById("gm4html5_question_message_id");
	_Av.innerHTML=_av._jv[0];
	var _yv=document.getElementById("gm4html5_question_yes_button_id");
	_yv.onmouseup=
function()
	{
		var _mv=_nv(_ev);
		if(!_mv)return;
		_mv._kv="";
		_mv._lv="";
		_mv.value=1;
		_mv.result="1";
		_mv._ge=true;
		_mv._fe=_ov;
		_cv.removeChild(_dv);
		_gv=false;
		_pv();
		_qv(_av.id);
	}
	;
	var _rv=document.getElementById("gm4html5_question_no_button_id");
	_rv.onmouseup=
function()
	{
		_cv.removeChild(_dv);
		_gv=false;
		var _mv=_nv(_ev);
		if(!_mv)return;
		_mv._kv="";
		_mv._lv="";
		_mv.value=0;
		_mv.result="0";
		_mv._ge=true;
		_mv._fe=_sv;
		_pv();
		_qv(_av.id);
	}
	;
	_tv();
	_be._ce(_av.id,null,_uv,_ev);
}

function _Bv(_av)
{
	var _x4=document.getElementById(_bv);
	var _cv=_x4.parentNode;
	var _dv=document.createElement("div");
	_ev="gm4html5_message_ID";
	_dv.setAttribute("class","gm4html5_login");
	_dv.setAttribute("id",_ev);
	_cv.insertBefore(_dv,_x4.nextSibling);
	_dv.innerHTML="<table>"+"<tr>"+"<td><label for=\"username\" id=\"gm4html5_message_message_id\">Message</label></td>"+"</tr>"+"</table>"+"<div class=\"gm4html5_login_button\"><input type=\"button\" value=\"OK\" id=\"gm4html5_message_ok_button_id\"/></div>";
	_fv();
	_gv=true;
	var _Av=document.getElementById("gm4html5_message_message_id");
	_Av.innerHTML=_av._jv[0];
	var _yv=document.getElementById("gm4html5_message_ok_button_id");
	_yv.onmouseup=
function()
	{
		var _mv=_nv(_ev);
		if(!_mv)return;
		_mv._kv="";
		_mv._lv="";
		_mv.value=1;
		_mv.result="1";
		_mv._ge=true;
		_mv._fe=1;
		_cv.removeChild(_dv);
		_gv=false;
		_pv();
		_qv(_av.id);
	}
	;
	_tv();
	_be._ce(_av.id,null,_uv,_ev);
}
/*@constructor */
function _Cv(_Qe,_Ob,_Dv)
{
	this.id=_Qe;
	this.type=_Ob;
	this._jv=_Dv;
}

function _Ev()
{
	if(_Fv.length>0)
	{
		switch(_Fv[0].type)
		{
			case _eu:_9v(_Fv[0]);
			break;
			case _fu:_vv(_Fv[0]);
			break;
			case _gu:_zv(_Fv[0]);
			break;
			case _hu:_Bv(_Fv[0]);
			break;
		}
	}
}

function _Gv(_Dv)
{
	for(var i=0;i<_Dv.length;++i)
	{
		var _Pj=_Dv[i];
		if(typeof(_Pj)=='string')
		{
			var _Hv="";
			for(var _u5=0;_u5<_Pj.length;_u5++)
			{
				var chr=_Pj[_u5];
				switch(chr)
				{
					case '&':_Hv=_Hv+'&amp;';
					break;
					case '<':_Hv=_Hv+'&lt;';
					break;
					case '>':_Hv=_Hv+'&gt;';
					break;
					default :_Hv=_Hv+chr;
					break;
				}
			}
			_Pj=_Hv;
			var _Iv=String.fromCharCode(13)+String.fromCharCode(10);
			_Pj=_Pj.split('#').join('<br>');
			_Pj=_Pj.split(_Iv).join('<br>');
			_Dv[i]=_Pj;
		}
	}
}

function _4v(_Qe,_Ob,_Dv)
{
	_Gv(_Dv);
	var _en=new _Cv(_Qe,_Ob,_Dv);
	_Fv.push(_en);
	if(_Fv.length==1)
	{
		_Ev();
	}
}

function _qv(_Qe)
{
	var index=-1;
	for(var i=0;i<_Fv.length;++i)
	{
		if(_Fv[i].id==_Qe)
		{
			index=i;
			break;
		}
	}
	if(index>=0)
	{
		_Fv.splice(index,1);
	}
	_Ev();
}

function get_login_async(_Jv,_Kv)
{
	_4v(_5v,_eu,[_Jv,_Kv]);
	return _5v++;
}

function get_string_async(_6v,_8v)
{
	_4v(_5v,_fu,[yyGetString(_6v),yyGetString(_8v)]);
	return _5v++;
}

function get_string(_6v,_8v)
{
	return prompt(yyGetString(_6v),yyGetString(_8v));
}

function _tv()
{
	if(_gv)
	{
		var login=document.getElementById(_ev);
		var w=login.offsetWidth;
		var h=login.offsetHeight;
		var _O5=(canvas.width-w)/2;
		var _Q5=(canvas.height-h)/2;
		_Ie=new _Lv();
		_He(canvas,_Ie);
		login.style.left=~~(_O5+_Ie.left)+"px";
		login.style.top=~~(_Q5+_Ie.top)+"px";
	}
}

function _Gu(_si)
{
	return _si.substr(0,_si.indexOf("("));
}

function _Au(_Mv)
{
	var _At=arguments.callee.caller;
	var _Pj="Error: "+_Mv+"\n"+"--------------------------------------------------------------------\n";
	while(_At) 
	{
		var name="\t"+_Gu(_At.toString());
		_Pj+=name+'(';
		for(var i=0;i<_At.arguments.length;i++)
		{
			if(i!==0)
			{
				_Pj+=', ';
			}
			if(typeof _At.arguments[i]==="string")
			{
				_Pj+='"'+_At.arguments[i].toString()+'"';
			}
			else if((typeof _At.arguments[i]==="number")||(_At.arguments[i] instanceof Long))
			{
				_Pj+=_At.arguments[i].toString();
			}
			else if(_At.arguments[i]===undefined)
			{
				_Pj+="[undefined]";
			}
			else if(_At.arguments[i]===null)
			{
				_Pj+="[null]";
			}
			else if(_At.arguments[i].__type)
			{
				_Pj+=_At.arguments[i].__type;
			}
			else 
			{
				_Pj+="[unknown]";
			}
		}
		_Pj+=")\n";
		_At=_At.caller;
	}
	debug(_Pj);
}

function _Eu(_Mv)
{
	var _At=arguments.callee.caller;
	var _r3=[];
	while(_At&&(_r3.length<100)) 
	{
		var name=_Gu(_At.toString());
		_Pj=name+'(';
		for(var i=0;i<_At.arguments.length;i++)
		{
			if(i!==0)
			{
				_Pj+=', ';
			}
			if(typeof _At.arguments[i]==="string")
			{
				_Pj+='"'+_At.arguments[i].toString()+'"';
			}
			else if((typeof _At.arguments[i]==="number")||(_At.arguments[i] instanceof Long))
			{
				_Pj+=_At.arguments[i].toString();
			}
			else if(_At.arguments[i]===undefined)
			{
				_Pj+="[undefined]";
			}
			else if(_At.arguments[i]===null)
			{
				_Pj+="[null]";
			}
			else if(_At.arguments[i].__type)
			{
				_Pj+=_At.arguments[i].__type;
			}
			else 
			{
				_Pj+="[unknown]";
			}
		}
		_Pj+=")\n";
		_r3.push(_Pj);
		_At=_At.caller;
	}
	return _r3;
}

function _Nv()
{
	if(!_ku)return;
	var _Ov=_ku.document.getElementById('debug_instances');
	if(!_Ov)return;
	var _Pv=[];
	var options=_Ov.options;
	for(var index in options)
	{
		if(!options.hasOwnProperty(index))continue;
		if(index!="selectedIndex"&&index!="length")
		{
			var _Qv=options[index];
			if(_Qv&&_Qv.text)
			{
				_Pv[_Pv.length]=_Qv.text;
			}
		}
	}
	var _Rv=[];
	for(var index in _Sv._Tv)
	{
		if(!_Sv._Tv.hasOwnProperty(index))continue;
		var _Uv=_Sv._Tv[index];
		if(_Uv!==undefined&&_Uv!==null)
		{
			var _hg=_Uv.id.toString();
			var i;
			for(i=0;i<_Pv.length;i++)
			{
				if(_Pv[i]==_hg)break;
			}
			if(i>=_Pv.length)
			{
				_Rv[_Rv.length]=_hg;
			}
			else 
			{
				_Pv.splice(i,1);
			}
		}
	}
	for(var index in _Pv)
	{
		if(!_Pv.hasOwnProperty(index))continue;
		for(var _Qv in options)
		{
			if(!options.hasOwnProperty(_Qv))continue;
			if(options[_Qv].text=index)
			{
				_Ov.removeChild(options[_Qv]);
				break;
			}
		}
	}
	for(var index=0;index<_Rv.length;index++)
	{
		var _Uv=_Rv[index];
		var option=_ku.document.createElement("option");
		option.text=""+_Uv;
		_Ov.add(option,null);
	}
}
var _Vv=3;
var _Wv=-1;

function _Xv()
{
	if(!_ku)return;
	var _Ov=_ku.document.getElementById('debug_instances');
	var _Yv=_ku.document.getElementById('debug_Instance_Data');
	if(!_Ov||!_Yv)return;
	var _Zv=_Ov.selectedIndex;
	if(_Zv<0)
	{
		return;
	}
	if(_Zv==undefined)return;
	_Zv=parseInt(_Ov.options[_Zv].text);
	var _rm=_Sv._Tv[_Zv];
	if(!_rm)return;
	var _hg=[];
	_hg[_hg.length]='<table ALIGN="left" VALIGN="top" style="border-spacing:0px; border-collapse:collapse; border:0px; margin:0px;">';
	_hg[_hg.length]='<tr bgcolor="#f0f0f0" "><td style="width:130px;"><b>Object</b></td><td style="width:270px;"><b>'+_rm.__v._0w+'</b></td></tr>';
	_hg[_hg.length]='<tr><td>x</td><td>'+_rm.x.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>y</td><td>'+_rm.y.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>depth</td><td>'+_rm.depth.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>visible</td><td>'+_rm.visible+'</td></tr>';
	_hg[_hg.length]='<tr><td>persistent</td><td>'+_rm.persistent+'</td></tr>';
	_hg[_hg.length]='<tr><td>vspeed</td><td>'+_rm.vspeed.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>direction</td><td>'+_rm.direction.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>speed</td><td>'+_rm.speed.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>friction</td><td>'+_rm.friction.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>gravity</td><td>'+_rm.gravity.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>gravity_direction</td><td>'+_rm.gravity_direction.toFixed(_Vv)+'</td></tr>';
	var _1w=_E4._F4(_rm.sprite_index);
	if(!_1w)
	{
		_hg[_hg.length]='<tr><td>sprite_index</td><td><none></td></tr>';
	}
	else 
	{
		var _2w=_rm.image_index;
		if(_2w<0||_2w>_1w._D3.length)_2w=0;
		var _C3=_1w._D3[~~_2w];
		_hg[_hg.length]='<tr><td>sprite_index</td><td height="'+(_C3.oh+32)+'px">'+_1w.pName+'<br>'+'<div style="padding:0px; margin:0px; border:0px; overflow: hidden; '+'width:'+_C3.CropWidth+'px; height:'+_C3.CropHeight+'px; '+'background: url('+_C3.texture.src+') '+-_C3.x+'px '+-_C3.y+'px;" />'+'</td></tr>';
	}
	_hg[_hg.length]='<tr><td>image_index</td><td>'+_rm.image_index.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>image_speed </td><td>'+_rm.image_speed.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>image_blend</td><td>'+~~_rm.image_blend+'</td></tr>';
	_hg[_hg.length]='<tr><td>image_alpha</td><td>'+_rm.image_alpha.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>image_xscale</td><td>'+_rm.image_xscale.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>image_yscale</td><td>'+_rm.image_yscale.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>mask_index</td><td>'+_rm.mask_index.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>path_index</td><td>'+_rm.path_index.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>path_position</td><td>'+_rm.path_position.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>path_speed</td><td>'+_rm.path_speed.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>path_scale</td><td>'+_rm.path_scale.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>path_orientation</td><td>'+_rm.path_orientation.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>path_endaction</td><td>'+_rm.path_endaction.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>path_xstart</td><td>'+_rm._3w.toFixed(_Vv)+'</td></tr>';
	_hg[_hg.length]='<tr><td>path_ystart</td><td>'+_rm._4w.toFixed(_Vv)+'</td></tr>';
	for(var _5w=0;_5w<12;_5w++)
	{
		_hg[_hg.length]='<tr><td>alarm['+_5w+']</td><td>'+~~_rm.alarm[_5w]+'</td></tr>';
	}
	_hg[_hg.length]='</table>';
	_Yv.innerHTML=_hg.join("");
}

function UpdateDebugWindow()
{
	_Nv();
	_Xv();
}
/*@constructor */
function _6w()
{
	this._7w="";
	this._8w=0;
	this._9w=false;
	this._aw=false;
	this._bw="";
}
_6w.prototype._cw=
function()
{
	var _Pj;
	var i=this._8w;
	var _hg=this._7w;
	while(i<_hg.length) 
	{
		var c=_hg.charCodeAt(i);
		if(c==0x0d||c==0x0a)
		{
			i++;
		}
		else 
		{
			break;
		}
	}
	this._8w=i;
}
;
_6w.prototype._dw=
function()
{
	var _Pj;
	var i=this._8w;
	var _hg=this._7w;
	while(i<_hg.length) 
	{
		var c=_hg.charCodeAt(i);
		if(c==0x0d||c==0x0a)
		{
			i++;
			c=_hg.charCodeAt(i);
			if(c==0x0d||c==0x0a)
			{
				i++;
			}
			break;
		}
		else 
		{
			i++;
		}
	}
	this._8w=i;
}
;
_6w.prototype._ew=
function()
{
	var _Pj;
	var i=this._8w;
	var _hg=this._7w;
	while(i<_hg.length) 
	{
		var c=_hg.charCodeAt(i);
		if(c==0x0d||c==0x0a||c==0x09||c==0x20)
		{
			i++;
		}
		else 
		{
			break;
		}
	}
	this._8w=i;
}
;

function file_text_open_from_string(_fw)
{
	var _ae=new _6w();
	_ae._7w=yyGetString(_fw);
	_ae._8w=0;
	_ae._bw=null;
	return _gw._ce(_ae);
}

function file_text_open_read(_hw)
{
	_hw=yyGetString(_hw);
	var _iw=_rj(_hw,true);
	if(_iw==null)_iw=_rj(_hw,false);
	if(_iw==null)return -1;
	var _ae=new _6w();
	_ae._7w=_iw;
	_ae._8w=0;
	_ae._bw=_hw;
	return _gw._ce(_ae);
}

function file_text_close(_jw)
{
	_jw=yyGetInt32(_jw);
	var _ae=_gw._F4(_jw);
	if(!_ae)
	{
		_I3("Error: Illegal file handle");
		return;
	}
	if(_ae._bw!=null)
	{
		if(_ae._aw)
		{
			_nj(_ae._bw,_ae._7w);
		}
	}
	_gw._lh(_jw);
}

function file_text_open_write(_hw)
{
	var _ae=new _6w();
	_ae._bw=yyGetString(_hw);
	_ae._7w="";
	_ae._8w=0;
	_ae._kw=true;
	_ae._aw=true;
	return _gw._ce(_ae);
}

function file_text_open_append(_hw)
{
	_hw=yyGetString(_hw);
	var _At=file_text_open_read(_hw);
	if(_At<0)
	{
		return file_text_open_write(_hw);
	}
	var _ae=_gw._F4(_At);
	_ae._kw=true;
	_ae._8w=_ae._7w.length;
	_ae._aw=false;
	return _At;
}

function file_text_write_string(_jw,_6v)
{
	var _ae=_gw._F4(yyGetInt32(_jw));
	if(!_ae)
	{
		_I3("Error: Illegal file handle");
		return;
	}
	if(!_ae._kw)
	{
		_I3("Error: File "+_ae._bw+" has not been opened with WRITE permisions");
		return;
	}
	_ae._7w+=yyGetString(_6v);
	_ae._aw=true;
	_ae._8w=_ae._7w.length;
}

function file_text_write_real(_jw,_r4)
{
	var _ae=_gw._F4(yyGetInt32(_jw));
	if(!_ae)
	{
		_I3("Error: Illegal file handle");
		return;
	}
	if(!_ae._kw)
	{
		_I3("Error: File "+_ae._bw+" has not been opened with WRITE permisions");
		return;
	}
	_ae._7w+=yyGetReal(_r4);
	_ae._aw=true;
	_ae._8w=_ae._7w.length;
}

function file_text_writeln(_jw)
{
	var _ae=_gw._F4(yyGetInt32(_jw));
	if(!_ae)
	{
		_I3("Error: Illegal file handle");
		return;
	}
	if(!_ae._kw)
	{
		_I3("Error: File "+_ae._bw+" has not been opened with WRITE permisions");
		return;
	}
	_ae._7w+=String.fromCharCode(0x0d);
	_ae._7w+=String.fromCharCode(0x0a);
	_ae._8w=_ae._7w.length;
}

function file_text_read_string(_jw)
{
	var _ae=_gw._F4(yyGetInt32(_jw));
	if(!_ae)
	{
		_I3("Error: Illegal file handle");
		return;
	}
	var _Pj="";
	var i=_ae._8w;
	var _hg=_ae._7w;
	while(i<_hg.length) 
	{
		var c=_hg.charCodeAt(i);
		if(c==0x0d||c==0x0a)
		{
			break;
		}
		else 
		{
			_Pj+=_hg[i++];
		}
	}
	_ae._8w=i;
	return _Pj;
}

function file_text_read_real(_jw)
{
	var _ae=_gw._F4(yyGetInt32(_jw));
	if(!_ae)
	{
		_I3("Error: Illegal file handle");
		return;
	}
	_ae._ew();
	var _Pj="";
	var i=_ae._8w;
	var _hg=_ae._7w;
	while(i<_hg.length) 
	{
		var c=_hg[i];
		if((c=='-')&&(_Pj==""))
		{
			_Pj+=_hg[i++];
		}
		else if((c>='0'&&c<='9')||(c=='.'))
		{
			_Pj+=_hg[i++];
		}
		else 
		{
			break;
		}
	}
	_ae._8w=i;
	return parseFloat(_Pj);
}

function file_text_readln(_jw)
{
	var _ae=_gw._F4(yyGetInt32(_jw));
	if(!_ae)
	{
		_I3("Error: Illegal file handle");
		return;
	}
	var _Pj="";
	var i=_ae._8w;
	var _hg=_ae._7w;
	while(i<_hg.length) 
	{
		var c=_hg.charCodeAt(i);
		if(c==0x0d||c==0x0a)
		{
			_Pj+=_hg[i++];
			if(i<_hg.length)
			{
				c=_hg.charCodeAt(i);
				if(c==0x0d||c==0x0a)
				{
					_Pj+=_hg[i++];
				}
			}
			break;
		}
		else 
		{
			_Pj+=_hg[i++];
		}
	}
	_ae._8w=i;
	return _Pj;
}

function file_text_eof(_jw)
{
	var _ae=_gw._F4(yyGetInt32(_jw));
	if(!_ae)
	{
		_I3("Error: Illegal file handle");
		return;
	}
	if(_ae._8w>=_ae._7w.length)return true;
	return false;
}

function file_text_eoln(_jw)
{
	var _ae=_gw._F4(yyGetInt32(_jw));
	if(!_ae)
	{
		_I3("Error: Illegal file handle");
		return;
	}
	if(_ae._8w>=_ae._7w.length)return true;
	var c=_ae._7w.charCodeAt(_ae._8w);
	if(c==0x0a||c==0x0d)return true;
	return false;
}

function file_exists(_hw)
{
	_hw=yyGetString(_hw);
	var _bk=_lw(_hw,true);
	if(_bk==true)return true;
	return _lw(_hw,false);
}

function file_delete(_hw)
{
	if(_mw)
	{
		try
		{
			window.localStorage['removeItem'](_nw(yyGetString(_hw)));
			return true;
		}
		catch(_5i)
		{
			return false;
		}
	}
	return false;
}

function file_rename(_ow,_pw)
{
	_ow=yyGetString(_ow);
	file_copy(_ow,yyGetString(_pw));
	file_delete(_ow);
}

function file_copy(_hw,_pw)
{
	_hw=yyGetString(_hw);
	_pw=yyGetString(_pw);
	if(true===file_exists(_pw))file_delete(_pw);
	if(false===file_exists(_hw))return false;
	var _qw=file_text_open_read(_hw);
	var _rw=file_text_open_write(_pw);
	while(false===file_text_eof(_qw)) 
	{
		var _zu=file_text_readln(_qw);
		file_text_write_string(_rw,_zu);
	}
	file_text_close(_qw);
	file_text_close(_rw);
}

function directory_exists(_sw)
{
	_0b("directory_exists()");
	return true;
}

function directory_create(_sw)
{
	_0b("directory_create()");
	return true;
}

function directory_destroy(_sw)
{
	_0b("directory_destroy()");
	return true;
}

function file_find_first(_nr,_tw)
{
	_0b("file_find_first()");
	return "";
}

function file_find_next()
{
	_0b("file_find_next()");
	return "";
}

function file_find_close()
{
	_0b("file_find_close()");
}

function file_attributes(_hw,_tw)
{
	_0b("file_attributes()");
	return true;
}

function filename_name(_hw)
{
	_hw=yyGetString(_hw);
	var _i3=_hw.lastIndexOf('\\');
	var _h3=_hw.lastIndexOf('/');
	var last=(_i3>_h3)?_i3:_h3;
	var _r3=_hw;
	if(last>0)
	{
		_r3=_hw.substr(last+1);
	}
	return _r3;
}

function filename_path(_hw)
{
	_hw=yyGetString(_hw);
	var _i3=_hw.lastIndexOf('\\');
	var _h3=_hw.lastIndexOf('/');
	var last=(_i3>_h3)?_i3:_h3;
	var _r3=_hw;
	if(last>0)
	{
		_r3=_hw.substr(0,last+1);
	}
	return _r3;
}

function filename_dir(_hw)
{
	_hw=yyGetString(_hw);
	var _i3=_hw.lastIndexOf('\\');
	var _h3=_hw.lastIndexOf('/');
	var last=(_i3>_h3)?_i3:_h3;
	var _r3=_hw;
	if(last>0)
	{
		_r3=_hw.substr(0,last);
	}
	return _r3;
}

function filename_drive(_hw)
{
	_Nu("filename_drive()");
}

function filename_change_ext(_hw,_uw)
{
	_hw=yyGetString(_hw);
	var last=_hw.lastIndexOf('.');
	var _r3=_hw;
	if(last>0)
	{
		_r3=_hw.substr(0,last);
		_r3=_r3+yyGetString(_uw);
	}
	return _r3;
}

function file_bin_open(_hw,_vw)
{
	_0b("file_bin_open()");
}

function file_bin_rewrite(_jw)
{
	_0b("file_bin_rewrite()");
}

function file_bin_close(_jw)
{
	_0b("file_bin_close()");
}

function file_bin_size(_jw)
{
	_0b("file_bin_size()");
}

function file_bin_position(_jw)
{
	_0b("file_bin_position()");
}

function file_bin_seek(_jw,_Li)
{
	_0b("file_bin_seek()");
}

function file_bin_write_byte(_jw,_ww)
{
	_0b("file_bin_write_byte()");
}

function file_bin_read_byte(_jw)
{
	_0b("file_bin_read_byte()");
}

function environment_get_variable(_O2)
{
	return "";
}

function filename_ext(_jj)
{
	_jj=yyGetString(_jj);
	var _xw=_jj.lastIndexOf(".");
	var _yw=_jj.lastIndexOf("\\");
	if(_yw>_xw)return "";
	return _jj.substr(_xw,_jj.length);
}
const _zw=new RegExp("@i64@([0-9a-f]+?)\\$i64\\$","i");

function _Aw(_Bw)
{
	var _r3=undefined;
	if((typeof _Bw=="string")&&_Bw.startsWith("@ref "))
	{
		var _Cw=_Bw.indexOf("(",5);
		var _Dw=_Bw.substring(5,_Cw);
		var _Ew=_Bw.indexOf(")",_Cw);
		var _Fw=_Bw.substring(_Cw+1,_Ew);
		var _Gw=Number(_Fw);
		var type=_Hw(_Dw);
		_r3=_dm(type,_Gw);
	}
	return _r3;
}

function _Iw(value)
{
	switch(typeof(value))
	{
		case "object":if(value==null)return g_pBuiltIn.pointer_null;
		if(value instanceof Array)return new _Gi(_Ji,_Jw(value));
		return new _Gi(_Hi,_Kw(value));
		case "boolean":return value?1:0;
		case "number":return value;
		case "string":if(value=="@@infinity$$")return Infinity;
		if(value=="@@-infinity$$")return -Infinity;
		if(value=="@@nan$$")return NaN;
		var match=value.match(_zw);
		if(match)
		{
			return parseInt(match[1],16);
		}
		if(value.startsWith("@ref "))
		{
			return _Aw(value);
		}
		return value;
		default :return value.toString();
	}
}

function _Jw(_ui)
{
	var _r3=ds_list_create();
	for(var i=0;i<_ui.length;++i)
	{
		var _Z3=_Iw(_ui[i]);
		ds_list_add(_r3,_Z3);
	}
	return _r3;
}

function _Kw(_ui)
{
	var _r3=ds_map_create();
	for(var _Qv in _ui)
	{
		var _i3=_ui[_Qv];
		var _Z3=_Iw(_i3);
		ds_map_add(_r3,_Qv,_Z3);
	}
	return _r3;
}

function json_decode(_Lw)
{
	var _Pj=yyGetString(_Lw);
	var _Mw=false;
	try
	{
		for(var _Nw=0;_Nw<_Pj.length;_Nw++)
		{
			if(_Pj.charAt(_Nw)=="\"")
			{
				if(!_Mw)
				{
					_Mw=true;
				}
				else if(_Nw==0||_Pj.charAt(_Nw-1)!="\\")
				{
					_Mw=false;
				}
			}
			if(!_Mw&&_Pj.charAt(_Nw)=="#")
			{
				_Pj=_Pj.substring(0,_Nw)+_Pj.substring(_Nw+1,_Pj.length);
				_Nw--;
			}
		}
	}
	catch(Error)
	{
	}
	var _Ow=
	{
	}
	;
	try
	{
		_Ow=JSON.parse(_Pj);
		if(_Ow instanceof Array)
		{
			_Pj="{ \"default\" : "+_Pj+"}";
			_Ow=JSON.parse(_Pj);
		}
	}
	catch(err)
	{
		_Pj="{ \"default\" : \""+_Pj.toString()+"\"}";
		try
		{
			_Ow=JSON.parse(_Pj);
		}
		catch(err)
		{
		}
	}
	return _Kw(_Ow);
}
var _Pw=new Map();

function _Qw(value)
{
	if(value==undefined)return null;
	switch(typeof(value))
	{
		case "object":if(value===null)return null;
		if(value instanceof Long)
		{
			return "@i64@"+value.toString(16)+"$i64$";
		}
		if(value instanceof _gm)
		{
			return "@ref "+_Rw(value.type)+"("+value.value+")";
		}
		if(value==g_pBuiltIn.pointer_null)return null;
		if(value instanceof Array)
		{
			return _Sw(value);
		}
		switch(value._Ti)
		{
			case _Ji:return _Tw(value.Object);
			case _Hi:return _Uw(value.Object);
			default :return value.toString();
		}
		case "number":if(isNaN(value))return "@@nan$$";
		if(!isFinite(value))return value>0?"@@infinity$$":"@@-infinity$$";
		return value;
		case "string":case "boolean":return value;
		default :return value.toString();
	}
}

function _Tw(_U6)
{
	var _r3=[];
	var _zi=_yi._F4(_U6);
	let _u7=_Pw.get(_zi)|0;
	if(_u7>1)return null;
	_Pw.set(_zi,_u7+1);
	if(_zi)
	{
		for(var i=0;i<_zi._Qi.length;++i)
		{
			if(_zi._Qi[i]!=undefined)_r3.push(_Qw(_zi._Qi[i]));
		}
	}
	return _r3;
}

function _Uw(_a6)
{
	var _r3=
	{
	}
	;
	var _c6=_d6._F4(_a6);
	let _u7=_Pw.get(_c6)|0;
	if(_u7>1)return null;
	_Pw.set(_c6,_u7+1);
	if(_c6)
	{
		for(const [key,_0d] of _c6)
		{
			var _Z3=key;
			if(_c6._9j&&_c6._9j.has(key))_Z3=_c6._9j.get(key);
			_r3[_Z3.toString()]=_Qw(_0d);
		}
	}
	return _r3;
}

function _Sw(_dj)
{
	let _u7=_Pw.get(_dj)|0;
	if(_u7>1)return null;
	_Pw.set(_dj,_u7+1);
	var _r3="[";
	for(var i=0;i<_dj.length;++i)
	{
		if(i>0)_r3+=", ";
		_r3+=_Qw(_dj[i]);
	}
	_r3+="]";
	return _r3;
}

function json_encode(_a6,_Vw)
{
	_Vw=_Vw==undefined?false:yyGetReal(_Vw);
	_Pw=new Map();
	var __i=_Uw(yyGetInt32(_a6));
	return JSON.stringify(__i,null,_Vw?2:0);
}
var _Ww=undefined;

function _Xw(key,value)
{
	if((_Ww!=undefined)&&is_callable(_Ww))
	{
		var _si=_ti(_Ww,1);
		_ui="boundObject" in _si?_si._vi:
		{
		}
		;
		value=_si(_ui,_ui,key,value);
	}
	if(value==undefined)return null;
	switch(typeof value)
	{
		case "string":return value;
		case "number":if(isNaN(value))return "@@nan$$";
		if(!isFinite(value))return value>0?"@@infinity$$":"@@-infinity$$";
		return value;
		case "boolean":return value;
		case "object":if(value==null)return null;
		if(value instanceof Long)
		{
			return "@i64@"+value.toString(16)+"$i64$";
		}
		if(value instanceof _gm)
		{
			return "@ref "+_Rw(value.type)+"("+value.value+")";
		}
		if(value==g_pBuiltIn.pointer_null)return null;
		if(value instanceof Array)
		{
			if(_Pw.has(value))return null;
			_Pw.set(value,1);
			var _r3=[];
			value.forEach((_fj,index)=>
			{
				_r3.push(_Xw(index.toString(),_fj));
			}
			);
			_Pw.delete(value);
			return _r3;
		}
		if(value.__yyIsGMLObject)
		{
			if(_Pw.has(value))return null;
			_Pw.set(value,1);
			var _r3=
			{
			}
			;
			for(var _Yw in value)
			{
				if(!value.hasOwnProperty(_Yw))continue;
				var nName=_Yw;
				if(typeof _Zw!="undefined"&&_Zw.hasOwnProperty(_Yw))
				{
					nName="gml"+_Zw[_Yw];
				}
				if(nName.startsWith("gml")||g_instance_names[nName]!=undefined)
				{
					var name=nName.startsWith("gml")?nName.substring(3):nName;
					var _cj=g_instance_names[nName];
					if((_cj==undefined)||(_cj[0]|_cj[1]))
					{
						Object.defineProperty(_r3,name,
						{
							value:_Xw(name,value[_Yw]),__w:true,_0x:true,enumerable:true						}
						);
					}
				}
			}
			_Pw.delete(value);
			return _r3;
		}
		default :return undefined;
	}
}

function json_stringify(_qb,_Vw,filter)
{
	try
	{
		_Vw=_Vw==undefined?false:yyGetReal(_Vw);
		var _1x=_Ww;
		_Ww=filter;
		var _2x=_Xw("",_qb);
		_Ww=_1x;
		return JSON.stringify(_2x,null,_Vw?2:0);
	}
	catch(e)
	{
		console.log(e);
		_I3("JSON stringify error");
	}
}
var _3x=undefined;
var _4x=0;

function _5x(_6x,value)
{
	var _r3=undefined;
	switch(typeof value)
	{
		case "string":if(value=="@@nan$$")_r3=NaN;
		else if(value=="@@infinity$$")_r3=Infinity;
		else if(value=="@@-infinity$$")_r3=-Infinity;
		else 
		{
			_r3=value;
			var match=value.match(_zw);
			if(match)
			{
				_r3=parseInt(match[1],16);
			}
			else if(value.startsWith("@ref "))
			{
				_r3=_Aw(value);
			}
		}
		break;
		case "number":_r3=value;
		break;
		case "boolean":_r3=value;
		break;
		case "object":if(value==null)
		{
			_r3=g_pBuiltIn.pointer_null;
			++_4x;
		}
		else if(value instanceof Array)
		{
			_r3=value;
		}
		else 
		{
			var __i=
			{
			}
			;
			__i.__type="___struct___";
			__i.__yyIsGMLObject=true;
			for(var _Yw in value)
			{
				if(!value.hasOwnProperty(_Yw))continue;
				var nName;
				if(g_instance_names[_Yw]!=undefined)
				{
					nName=_Yw;
				}
				else if(typeof g_var2obf!=="undefined"&&g_var2obf[_Yw]!=undefined)
				{
					nName=g_var2obf[_Yw];
				}
				else 
				{
					nName="gml"+_Yw;
				}
				Object.defineProperty(__i,nName,
				{
					value:value[_Yw],configurable:true,writable:true,enumerable:true				}
				);
			}
			_r3=__i;
		}
		break;
		default :_r3=value;
		break;
	}
	if((_3x!=undefined)&&is_callable(_3x))
	{
		var _si=_ti(_3x,1);
		_ui="boundObject" in _si?_si._vi:
		{
		}
		;
		if(_r3==g_pBuiltIn.pointer_null)
		{
			_r3=undefined;
			--_4x;
		}
		_r3=_si(_ui,_ui,_6x,_r3);
		if(_r3===undefined)
		{
			_r3=g_pBuiltIn.pointer_null;
			++_4x;
		}
	}
	return _r3;
}

function _7x(_qb)
{
	var _r3=_qb;
	switch(typeof _qb)
	{
		case "array":for(var i in _qb)
		{
			_qb[i]=_7x(_qb[i]);
			if(_qb[i]==g_pBuiltIn.pointer_null)
			{
				_qb[i]=undefined;
			}
		}
		break;
		case "object":if(_qb==g_pBuiltIn.pointer_null)_r3=undefined;
		else for(var key in _qb)
		{
			if(_qb.hasOwnProperty(key))
			{
				_qb[key]=_7x(_qb[key]);
				if(_qb[key]==g_pBuiltIn.pointer_null)
				{
					_qb[key]=undefined;
				}
			}
		}
		break;
	}
	return _r3;
}

function json_parse(_qb,_si)
{
	var _r3=undefined;
	var _8x=_3x;
	var _9x=_4x;
	_3x=_si;
	_4x=0;
	try
	{
		var _r3=JSON.parse(_qb,_5x);
		if(_4x>0)
		{
			_r3=_7x(_r3);
		}
		return _r3;
	}
	catch(e)
	{
		_I3("JSON parse error");
	}
	_4x=_9x;
	_3x=_8x;
	return _r3;
}

function _ax(_bx)
{
	var _u5=_bx.length,i=0;
	var _cx=[];
	var _dx=[];
	var start=0;
	var _fj="";
	var _ex=0;
	while(i<_u5) 
	{
		var _fx=i;
		var c=_bx.charCodeAt(i++);
		switch(c)
		{
			case 13:case 10:if(c==13&&_bx.charCodeAt(i)==10)i+=1;
			if(_fx>_ex)
			{
				if(_fx>start)_fj+=_bx.substring(start,_fx);
				_dx.push(_fj);
				_fj="";
			}
			_cx.push(_dx);
			_dx=[];
			_ex=i;
			start=i;
			break;
			case 44:if(_fx>start)_fj+=_bx.substring(start,_fx);
			_dx.push(_fj);
			_fj="";
			if(_bx.charCodeAt(i)==34)
			{
				i+=1;
				start=i;
				while(i<_u5) 
				{
					c=_bx.charCodeAt(i++);
					if(c!=34)continue;
					switch(_bx.charCodeAt(i))
					{
						case 34:if(i>start)_fj+=_bx.substring(start,i);
						i+=1;
						start=i;
						continue;
						case 13:case 10:case 44:break;
						default :continue;
					}
					break;
				}
			}
			else start=i;
			break;
		}
	}
	if(i>_ex)
	{
		if(i>start)_fj+=_bx.substring(start,i);
		_dx.push(_fj);
		_cx.push(_dx);
	}
	return _cx;
}

function load_csv(_hw)
{
	_hw=yyGetString(_hw);
	var _iw=_rj(_hw,true);
	if(_iw==null)_iw=_rj(_hw,false);
	if(_iw==null)return -1;
	var _gx=_ax(_iw);
	var height=_gx.length;
	if(height==0)return -1;
	var width=_gx[0].length;
	if(width==0)return -1;
	var _Qe=ds_grid_create(width,height);
	var _jh=_kh._F4(_Qe)._gh;
	for(var y=0;y<height;y++)
	{
		var _hx=_gx[y];
		for(var x=0;x<_hx.length;x++)
		{
			_jh[x+y*width]=_hx[x];
		}
	}
	return _Qe;
}

function draw_set_halign(_ix)
{
	_Su._jx=yyGetInt32(_ix);
}

function draw_get_halign()
{
	return _Su._jx;
}

function draw_set_valign(_ix)
{
	_Su._kx=yyGetInt32(_ix);
}

function draw_get_valign()
{
	return _Su._kx;
}

function draw_set_font(_lx)
{
	_Su._mx=yyGetInt32(_lx);
}

function draw_get_font()
{
	return _Su._mx;
}

function draw_text(_r4,_s4,_Hu)
{
	var c=(_mb&0xffffff)|(((_lb*255.0)<<24)&0xff000000);
	_Su._nx(yyGetString(_Hu),yyGetReal(_r4),yyGetReal(_s4),-1,-1,0,1,1,c,c,c,c);
}

function draw_text_color(_r4,_s4,_Hu,_fl,_gl,_hl,_il,_y8)
{
	if(!_i7)_Ou("draw_text_color() only uses the 1st colour");
	var _ox=_lb;
	var _px=_qx;
	if(_y8>1.0)_y8=1.0;
	else if(_y8<0)_y8=0.0;
	var _i3=((yyGetReal(_y8)*255)<<24)&0xff000000;
	_fl=_ob(yyGetInt32(_fl)&0xffffff)|_i3;
	_gl=_ob(yyGetInt32(_gl)&0xffffff)|_i3;
	_hl=_ob(yyGetInt32(_hl)&0xffffff)|_i3;
	_il=_ob(yyGetInt32(_il)&0xffffff)|_i3;
	_Su._nx(yyGetString(_Hu),yyGetReal(_r4),yyGetReal(_s4),-1,-1,0,1,1,_fl,_gl,_hl,_il);
	_lb=_ox;
	draw_set_color(_px);
}
var draw_text_colour=draw_text_color;

function draw_text_ext_color(_r4,_s4,_Hu,_rx,_eh,_fl,_gl,_hl,_il,_y8)
{
	if(!_i7)_Ou("draw_text_ext_color() only uses the 1st colour");
	var _ox=_lb;
	var _px=_qx;
	if(_y8>1.0)_y8=1.0;
	else if(_y8<0)_y8=0.0;
	var _i3=(yyGetReal(_y8)*255)<<24;
	_fl=_ob(yyGetInt32(_fl)&0xffffff)|_i3;
	_gl=_ob(yyGetInt32(_gl)&0xffffff)|_i3;
	_hl=_ob(yyGetInt32(_hl)&0xffffff)|_i3;
	_il=_ob(yyGetInt32(_il)&0xffffff)|_i3;
	_Su._nx(yyGetString(_Hu),yyGetReal(_r4),yyGetReal(_s4),yyGetInt32(_rx),yyGetInt32(_eh),0,1,1,_fl,_gl,_hl,_il);
	_lb=_ox;
	draw_set_color(_px);
}
var draw_text_ext_colour=draw_text_ext_color;

function draw_text_ext(_r4,_s4,_Hu,_rx,_eh)
{
	var c=(_mb&0xffffff)|(((_lb*255.0)<<24)&0xff000000);
	_Su._nx(yyGetString(_Hu),yyGetReal(_r4),yyGetReal(_s4),yyGetInt32(_rx),yyGetInt32(_eh),0,1,1,c,c,c,c);
}

function draw_text_transformed(_r4,_s4,_Hu,_7l,_8l,_v4)
{
	var c=(_mb&0xffffff)|(((_lb*255.0)<<24)&0xff000000);
	_Su._nx(yyGetString(_Hu),yyGetReal(_r4),yyGetReal(_s4),-1,-1,yyGetReal(_v4),yyGetReal(_7l),yyGetReal(_8l),c,c,c,c);
}

function draw_text_ext_transformed(_r4,_s4,_Hu,_rx,_eh,_7l,_8l,_v4)
{
	var c=(_mb&0xffffff)|(((_lb*255.0)<<24)&0xff000000);
	_Su._nx(yyGetString(_Hu),yyGetReal(_r4),yyGetReal(_s4),yyGetInt32(_rx),yyGetInt32(_eh),yyGetReal(_v4),yyGetReal(_7l),yyGetReal(_8l),c,c,c,c);
}

function draw_text_ext_transformed_color(_r4,_s4,_Hu,_rx,_eh,_7l,_8l,_v4,_fl,_gl,_hl,_il,_y8)
{
	if(!_i7)_Ou("draw_text_ext_transformed_color() only uses the 1st colour");
	var _ox=_lb;
	var _px=_qx;
	var _i3=((yyGetReal(_y8)*255)<<24)&0xff000000;
	_fl=_ob(yyGetInt32(_fl))|_i3;
	_gl=_ob(yyGetInt32(_gl))|_i3;
	_hl=_ob(yyGetInt32(_hl))|_i3;
	_il=_ob(yyGetInt32(_il))|_i3;
	_Su._nx(yyGetString(_Hu),yyGetReal(_r4),yyGetReal(_s4),yyGetInt32(_rx),yyGetInt32(_eh),yyGetReal(_v4),yyGetReal(_7l),yyGetReal(_8l),_fl,_gl,_hl,_il);
	_lb=_ox;
	draw_set_color(_px);
}
var draw_text_ext_transformed_colour=draw_text_ext_transformed_color;

function draw_text_transformed_color(_r4,_s4,_Hu,_7l,_8l,_v4,_fl,_gl,_hl,_il,_y8)
{
	if(!_i7)_Ou("draw_text_transformed_color() only uses the 1st colour");
	var _ox=_lb;
	var _px=_qx;
	var _i3=((yyGetReal(_y8)*255)<<24)&0xff000000;
	_fl=_ob(yyGetInt32(_fl))|_i3;
	_gl=_ob(yyGetInt32(_gl))|_i3;
	_hl=_ob(yyGetInt32(_hl))|_i3;
	_il=_ob(yyGetInt32(_il))|_i3;
	_Su._nx(yyGetString(_Hu),yyGetReal(_r4),yyGetReal(_s4),-1,-1,yyGetReal(_v4),yyGetReal(_7l),yyGetReal(_8l),_fl,_gl,_hl,_il);
	_lb=_ox;
	draw_set_color(_px);
}
var draw_text_transformed_colour=draw_text_transformed_color;

function string_height(_Hu)
{
	_Hu=yyGetString(_Hu);
	_Su._sx();
	if(!_Su._tx)return 1;
	var _ux=_Su._Tu(_Hu,-1,_Su._tx);
	if(_ux==null)return _Su._tx._vx(_Hu);
	return _Su._tx._vx(_Hu)*_ux.length;
}

function string_width(_Hu)
{
	_Su._sx();
	return _Su._tx?_Su._tx._wx(yyGetString(_Hu)):1;
}

function string_width_ext(_Lw,_rx,_eh)
{
	_Su._sx();
	if(!_Su._tx)return 1;
	_Su._xx(yyGetString(_Lw),0,0,yyGetInt32(_rx),yyGetInt32(_eh),0);
	return _yx;
}

function string_height_ext(_Lw,_rx,_eh)
{
	_Su._sx();
	if(!_Su._tx)return 1;
	_Su._xx(yyGetString(_Lw),0,0,yyGetInt32(_rx),yyGetInt32(_eh),0);
	return _zx;
}

function font_exists(_Qe)
{
	if(_Su._F4(yyGetInt32(_Qe)))return true;
	else return false;
}

function font_get_bold(_Qe)
{
	var _Ax=_Su._F4(yyGetInt32(_Qe));
	if(!_Ax)return false;
	return _Ax.bold;
}

function font_get_fontname(_Qe)
{
	var _Ax=_Su._F4(yyGetInt32(_Qe));
	if(!_Ax)return "";
	return _Ax._Bx;
}

function font_get_name(_Qe)
{
	var _Ax=_Su._F4(yyGetInt32(_Qe));
	if(!_Ax)return "";
	return _Ax.pName;
}

function font_get_italic(_Qe)
{
	var _Ax=_Su._F4(yyGetInt32(_Qe));
	if(!_Ax)return false;
	return _Ax.italic;
}

function font_get_first(_Qe)
{
	var _Ax=_Su._F4(yyGetInt32(_Qe));
	if(!_Ax)return 0;
	return _Ax.first;
}

function font_get_last(_Qe)
{
	var _Ax=_Su._F4(yyGetInt32(_Qe));
	if(!_Ax)return 255;
	return _Ax.last;
}

function font_get_size(_Qe)
{
	var _Ax=_Su._F4(yyGetInt32(_Qe));
	if(!_Ax)return 0;
	return _Ax.size;
}

function _Cx(_O2,_Ab,_Dx,_Ex,_Fx,_Gx,_Hx)
{
	var _Ax=new _Ix();
	_Ax._Jx=0.5;
	_Ax._Kx=true;
	_Ax.pName="fnt_"+_O2;
	_Ax._Bx=_O2;
	_Ax.size=_Ab;
	_Ax.bold=_Dx;
	_Ax.italic=_Ex;
	_Ax.first=_Fx;
	_Ax.last=_Gx;
	_Ax._Hf=false;
	if(_O2.toLowerCase().lastIndexOf(".ttf")!=-1)
	{
		_Ax._Lx=new Font();
		_Ax._Lx.onload=
function()
		{
			_Ax._Hf=true;
		}
		;
		_Ax._Lx.onerror=
function(err)
		{
			alert(err);
		}
		;
		_Ax._Lx.src=_Mx(null,null,_M7+_O2);
		_Ax._Nx=_Ab+"px "+_Ax._Lx._wf+" ";
	}
	else 
	{
		_Ax._Nx=_Ab+"px "+_O2+" ";
		_Ax._Hf=true;
	}
	if(_Dx)_Ax._Nx=_Ax._Nx+"bold ";
	if(_Ex)_Ax._Nx=_Ax._Nx+"Italic ";
	if(_Hx)
	{
		return _Su._Ox(_Ax);
	}
	else 
	{
		return _Ax;
	}
}

function font_delete(id)
{
	id=yyGetInt32(id);
	if(_Su.Fonts[id]!=undefined)
	{
		_Su.Fonts[id]._Lx=undefined;
		_Su.Fonts[id]=undefined;
	}
}

function font_enable_sdf(id,enable)
{
	console.log("font_enable_sdf() - SDF font rendering can't be dynamically toggled for fonts on HTML5");
}

function font_get_sdf_enabled(id)
{
	if(_i7)
	{
		id=yyGetInt32(id);
		if(_Su.Fonts[id]!=undefined)
		{
			var font=_Su.Fonts[id];
			return font._Px;
		}
	}
	return false;
}

function font_sdf_spread(id,enable)
{
	console.log("font_enable_sdf() - SDF spread value is fixed for fonts on HTML5");
}

function font_get_sdf_spread(id)
{
	if(_i7)
	{
		id=yyGetInt32(id);
		if(_Su.Fonts[id]!=undefined)
		{
			var font=_Su.Fonts[id];
			if(font._Px)
			{
				return font.sdfSpread;
			}
		}
	}
	return 0;
}

function font_enable_effects(id,enable,_Ar)
{
	if(_i7)
	{
		id=yyGetInt32(id);
		if(_Su.Fonts[id]!=undefined)
		{
			var font=_Su.Fonts[id];
			font._Qx.enabled=yyGetBool(enable);
			font._Rx(_Ar);
		}
	}
}

function font_add(_O2,_Ab,_Dx,_Ex,_Fx,_Gx)
{
	return _Cx(yyGetString(_O2),yyGetInt32(_Ab),yyGetBool(_Dx),yyGetBool(_Ex),yyGetInt32(_Fx),yyGetInt32(_Gx),true);
}

function font_add_sprite(_D4,_Fx,_Sx,_rx)
{
	var _Ax=new _Ix();
	_Ax._Tx(yyGetInt32(_D4),yyGetInt32(_Fx),yyGetBool(_Sx),yyGetInt32(_rx),null);
	return _Su._Ox(_Ax);
}

function font_add_sprite_ext(_D4,_Ux,_Sx,_rx)
{
	_Ux=yyGetString(_Ux);
	var _Ax=new _Ix();
	_Ax._Tx(yyGetInt32(_D4),_Ux.charCodeAt(0),yyGetBool(_Sx),yyGetInt32(_rx),_Ux);
	return _Su._Ox(_Ax);
}

function font_replace_sprite(_Qe,_D4,_Fx,_Sx,_rx)
{
	_Qe=yyGetInt32(_Qe);
	var _Ax=_Su._F4(_Qe);
	_Ax._Tx(yyGetInt32(_D4),yyGetInt32(_Fx),yyGetBool(_Sx),yyGetInt32(_rx),null);
	return _Qe;
}
;

function font_replace_sprite_ext(_Qe,_D4,_Ux,_Sx,_rx)
{
	_Qe=yyGetInt32(_Qe);
	_Ux=yyGetString(_Ux);
	var _Ax=_Su._F4(_Qe);
	_Ax._Tx(yyGetInt32(_D4),_Ux.charCodeAt(0),yyGetBool(_Sx),yyGetInt32(_rx),_Ux);
	return _Qe;
}
;

function font_set_cache_size(_u3,_Vx)
{
	_u3=yyGetInt32(_u3);
	_Vx=yyGetInt32(_Vx);
	var _Ax=_Su._F4(_u3);
	if(!_Ax)
	{
		_I3("Trying to adjust the cache on a non-existant font ("+string(_u3)+")");
		return false;
	}
	if(_Ax._Wx)
	{
		_I3("Trying to adjust the cache on a SPRITE font ("+string(_u3)+")");
		return false;
	}
	var _D3=_Ax._ok;
	if(_D3._v7>_Vx)
	{
		_D3._t7=[];
		_D3._u7=0;
	}
	_D3._v7=_Vx;
}

function font_get_texture(_u3)
{
	_u3=yyGetInt32(_u3);
	var _Ax=_Su._F4(_u3);
	if(!_Ax)
	{
		_I3("Trying to adjust the cache on a non-existant font ("+string(_u3)+")");
		return false;
	}
	if(_Ax._Wx)
	{
		_I3("Trying to adjust the cache on a SPRITE font ("+string(_u3)+")");
		return false;
	}
	var _C3=_Ax._ok;
	if(_C3)
	{
		return(
		{
			_fb:_C3.texture,_gb:_C3,toString:()=>
			{
				return "Texture:"+_C3.texture.URL;
			}
		}
		);
	}
	return null;
}

function font_get_uvs(_u3)
{
	_u3=yyGetInt32(_u3);
	var _Ax=_Su._F4(_u3);
	if(!_Ax)
	{
		_I3("Trying to adjust the uvs on a non-existent font ("+string(_u3)+")");
		return null;
	}
	var _C3=_Ax._ok;
	var texture=_C3.texture;
	var _yl=1.0/texture.width;
	var _zl=1.0/texture.height;
	var _Al=[];
	_Al.push(_C3.x*_yl,_C3.y*_zl,(_C3.x+_C3.CropWidth)*_yl,(_C3.y+_C3.CropHeight)*_zl);
	return _Al;
}

function font_get_info(_u3)
{
	_u3=yyGetInt32(_u3);
	var _Ax=_Su._F4(_u3);
	if(!_Ax)
	{
		return undefined;
	}
	var _C3=_Ax._ok;
	var _Yg=_C3!=null?_C3.x:0;
	var _Xx=_C3!=null?_C3.y:0;
	_r3=new _Yx();
	variable_struct_set(_r3,"ascenderOffset",_Ax.ascenderOffset);
	variable_struct_set(_r3,"ascender",_Ax.ascender);
	variable_struct_set(_r3,"sdfSpread",_Ax.sdfSpread);
	variable_struct_set(_r3,"sdfEnabled",_Ax._Px);
	variable_struct_set(_r3,"freetype",false);
	variable_struct_set(_r3,"size",_Ax.size);
	variable_struct_set(_r3,"spriteIndex",_Ax.spriteIndex);
	variable_struct_set(_r3,"texture",_C3!=null?_C3.tp:-1);
	variable_struct_set(_r3,"name",_Ax.pName);
	variable_struct_set(_r3,"bold",_Ax.bold);
	variable_struct_set(_r3,"italic",_Ax.italic);
	variable_struct_set(_r3,"effectsEnabled",_Ax._Qx.enabled);
	variable_struct_set(_r3,"effectParams",_Ax._Zx());
	variable_struct_set(_r3,"glyphs",new _Yx());
	var glyphs=variable_struct_get(_r3,"glyphs");
	if(_Ax.spriteIndex!=-1)
	{
		for(var _g3 in _Ax.__x)
		{
			if(_Ax.__x.hasOwnProperty(_g3))
			{
				var _0y=new _Yx();
				var _1y=_Ax.__x[_g3];
				var _2y=parseInt(_g3);
				var char=String.fromCharCode(_2y);
				variable_struct_set(_0y,"char",_1y);
				variable_struct_set(glyphs,char,_0y);
			}
		}
	}
	else 
	{
		for(var _g3 in _Ax.glyphs)
		{
			if(_Ax.glyphs.hasOwnProperty(_g3))
			{
				var _0y=new _Yx();
				var _1y=_Ax.glyphs[_g3];
				var _2y=parseInt(_g3);
				var char=String.fromCharCode(_2y);
				variable_struct_set(_0y,"char",_2y);
				variable_struct_set(_0y,"x",_1y.x);
				variable_struct_set(_0y,"y",_1y.y);
				variable_struct_set(_0y,"w",_1y.w);
				variable_struct_set(_0y,"h",_1y.h);
				variable_struct_set(_0y,"shift",_1y.shift);
				variable_struct_set(_0y,"offset",_1y.offset);
				if(_1y._3y!=undefined)
				{
					var _3y=[];
					for(var _ij=0;_ij<_1y._3y.length;++_ij)
					{
						_3y.push(_1y._3y[_ij]);
					}
					variable_struct_set(_0y,"kerning",_3y);
				}
				variable_struct_set(glyphs,char,_0y);
			}
		}
	}
	return _r3;
}

function font_add_enable_aa()
{
}

function font_add_get_enable_aa()
{
	return false;
}
var _4y=1;

function _5y(_a5)
{
	_6y(_a5*1000);
}

function scheduler_resolution_set(_C2)
{
}

function scheduler_resolution_get()
{
	return -1;
}

function display_set_timing_method(_7y)
{
	_4y=yyGetInt32(_7y);
}

function display_get_timing_method()
{
	return _4y;
}
/*@constructor */
function _8y(_5k,_O2)
{
	this.name=_O2;
	this.value=_5k;
}

function _9y()
{
	var _ay=_rj("hiscores_data_",true);
	if(_ay!=null)
	{
		try
		{
			var _by=JSON.parse(_ay);
			var i;
			for(i=0;i<_cy;i++)
			{
				_dy[i]=_by[i].name;
				_ey[i]=_by[i].value;
			}
		}
		catch(_5i)
		{
			_I3("Error: reading hiscore JSON");
		}
	}
}

function _fy()
{
	var _by=
	{
	}
	;
	var i;
	for(i=0;i<_cy;i++)
	{
		_by[i]=new _8y(_ey[i],_dy[i]);
	}
	var _ay=JSON.stringify(_by);
	_nj("hiscores_data_",_ay);
}

function draw_highscore(_X5,_Y5,_p5,_q5)
{
	_X5=yyGetInt32(_X5);
	_Y5=yyGetInt32(_Y5);
	_p5=yyGetInt32(_p5);
	_q5=yyGetInt32(_q5);
	var _jx=_Su._jx;
	var _ia=(_q5-_Y5)/_cy;
	for(var i=0;i<_cy;i++)
	{
		_Su._jx=0;
		draw_text(_X5,_Y5,_dy[i]);
		_Su._jx=2;
		draw_text(_p5,_Y5,_ey[i].toString());
		_Y5+=_ia;
	}
	_Su._jx=_jx;
}

function highscore_clear()
{
	for(var i=0;i<10;i++)
	{
		_ey[i]=0;
		_dy[i]=_gy;
	}
}

function highscore_add(_6v,_hy)
{
	_hy=yyGetInt32(_hy);
	var _iy=yyGetString(_6v);
	if(!_iy)
	{
		_iy="";
	}
	for(var i=0;i<_cy;i++)
	{
		if(_hy>_ey[i])
		{
			_ey.splice(i,0,_hy);
			_dy.splice(i,0,_iy);
			_ey.splice(10,1);
			_dy.splice(10,1);
			_fy();
			return;
		}
	}
}

function highscore_value(_jy)
{
	_jy=yyGetInt32(_jy);
	if(_jy<1||_jy>_cy)return -1;
	return _ey[_jy-1];
}

function highscore_name(_jy)
{
	_jy=yyGetInt32(_jy);
	if(_jy<1||_jy>_cy)return "";
	return _dy[_jy-1];
}

function _ky(_Jk,_Kk,_5k)
{
	var _ly,_my,_ny,_oy,_Of,_Pf;
	_ly=(_Jk>>16)&0xff;
	_ny=(_Jk>>8)&0xff;
	_Of=(_Jk&0xff);
	_my=(_Kk>>16)&0xff;
	_oy=(_Kk>>8)&0xff;
	_Pf=(_Kk&0xff);
	var _py=1.0-_5k;
	var _f3=_Si(_ly*_py+_my*_5k);
	var _g3=_Si(_ny*_py+_oy*_5k);
	var _h3=_Si(_Of*_py+_Pf*_5k);
	var _n3=((_f3&0xff)<<16)|((_g3&0xff)<<8)|(_h3&0xff);
	return _n3;
}

function _qy(_Jk,_Kk,_5k)
{
	return _ky(_Jk,_Kk,_5k);
}

function _ry(_Jk,_Kk)
{
	return make_color_rgb((color_get_red(_Jk)*color_get_red(_Kk))/255,(color_get_green(_Jk)*color_get_green(_Kk))/255,(color_get_blue(_Jk)*color_get_blue(_Kk))/255);
}

function event_perform(_6m,_sy,_f2,_ty)
{
	_f2=yyGetInt32(_f2);
	_ty=yyGetInt32(_ty);
	if(YYInstanceof(_6m)!="instance")
	{
		_I3("Attempt to dispatch event on non-instance object");
	}
	var _uy=_vy;
	_vy=true;
	var event=_wy(_f2,_ty);
	var index=_xy(_f2,_ty);
	_6m._O4(event,index,_6m,_sy);
	_vy=_uy;
}

function event_perform_async(_6m,_sy,_f2,_yy)
{
	var _zy=g_pBuiltIn.async_load;
	_f2=yyGetInt32(_f2);
	_yy=yyGetInt32(_yy);
	g_pBuiltIn.async_load=_yy;
	_j2._k2(_Ay|_f2,0,true);
	ds_map_destroy(_yy);
	g_pBuiltIn.async_load=_zy;
}

function _By(_6m,_Cy,_Dy,_Ey)
{
	var _Fy=_Gy._F4(_Dy);
	if((_Fy!=null)&&(_Fy!=undefined))
	{
		var _Hy=_Fy.Events[_Ey];
		if((_Hy!=null)&&(_Hy!=undefined))
		{
			_Hy.Event(_6m,_6m);
		}
	}
}

function event_perform_object(_6m,_sy,_ui,_f2,_ty)
{
	_ui=yyGetInt32(_ui);
	_f2=yyGetInt32(_f2);
	_ty=yyGetInt32(_ty);
	if(YYInstanceof(_6m)!="instance")
	{
		_I3("Attempt to dispatch event on non-instance object");
	}
	var event=_wy(_f2,_ty);
	var index=_xy(_f2,_ty);
	var __v=_j2._F4(_ui);
	if(__v)
	{
		var _Iy=_Jy;
		var _Ky=_Ly;
		var _My=_Ny;
		_Jy=__v;
		_Ly=event;
		_Ny=index;
		var _Oy=__v;
		while(_Oy!=null) 
		{
			if(_Oy._O4(event,index,_6m,_sy))
			{
				break;
			}
			_Oy=_Oy._cv;
		}
		_Jy=_Iy;
		_Ly=_Ky;
		_Ny=_My;
	}
}
var _Py=true;

function event_user(_6m,_sy,_ty)
{
	_ty=yyGetInt32(_ty);
	if(_ty>=0&&_ty<=15)
	{
		_ty+=_Qy;
		event_perform(_6m,_sy,_Ry,_ty);
	}
}

function event_inherited(_6m,_sy)
{
	if(YYInstanceof(_6m)!="instance")
	{
		_I3("Attempt to dispatch event on non-instance object");
	}
	_6m._Sy(_Ty,_Uy,_sy);
}

function parameter_count()
{
	return _Vy;
}

function parameter_string(_K2)
{
	_K2=yyGetInt32(_K2);
	if(_K2<0||_K2>_Vy)return "";
	var _hg=_Wy[_K2];
	if(_Xy[_K2]!=null)_hg=_hg+"="+_Xy[_K2];
	return _hg;
}

function _Yy()
{
	var _Zy="en";
	if(navigator["language"])
	{
		_Zy=navigator["language"];
	}
	else if(navigator["userLanguage"])
	{
		_Zy=navigator["userLanguage"];
	}
	return _Zy;
}

function os_get_language()
{
	var _Zy=_Yy();
	var __y=_Zy.indexOf("-");
	if(__y>=0)
	{
		_Zy=_Zy.substring(0,__y);
	}
	return _Zy;
}

function os_get_region()
{
	var _W3="";
	var _Zy=_Yy();
	var __y=_Zy.indexOf("-");
	if(__y>=0)
	{
		_W3=_Zy.substring(__y+1,_Zy.length);
	}
	return _W3;
}

function os_check_permission()
{
}

function os_request_permission()
{
}

function device_mouse_dbclick_enable(_Np)
{
}

function base64_encode(data)
{
	var _kf="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var _lf,_mf,_nf,_of,_pf,_qf,_rf,_sf;
	var i=0;
	var _tf=0;
	var _uf="";
	var _vf=[];
	if(!data)
	{
		return data;
	}
	data=yyGetString(data);
	if(typeof data!=="string")return undefined;
	data=_0z(data);
	do 
	{
		_lf=data.charCodeAt(i++);
		_mf=data.charCodeAt(i++);
		_nf=data.charCodeAt(i++);
		_sf=_lf<<16|_mf<<8|_nf;
		_of=_sf>>18&0x3f;
		_pf=_sf>>12&0x3f;
		_qf=_sf>>6&0x3f;
		_rf=_sf&0x3f;
		_vf[_tf++]=_kf.charAt(_of)+_kf.charAt(_pf)+_kf.charAt(_qf)+_kf.charAt(_rf);
	}
	while(i<data.length);
	_uf=_vf.join('');
	var _f3=data.length%3;
	return(_f3?_uf.slice(0,_f3-3):_uf)+'==='.slice(_f3||3);
}

function _1z(_Qu)
{
	var _ta="";
	var index=0;
	while(index<_Qu.length) 
	{
		var _Z3=0;
		var _2z=_Qu.charCodeAt(index++);
		if((_2z&0x80)==0)
		{
			_Z3=_2z;
		}
		else if((_2z&0xe0)==0xc0)
		{
			_Z3=(_2z&0x1f)<<6;
			_2z=_Qu.charCodeAt(index++);
			_Z3|=(_2z&0x3f);
		}
		else if((_2z&0xf0)==0xe0)
		{
			_Z3=(_2z&0x0f)<<12;
			_2z=_Qu.charCodeAt(index++);
			_Z3|=(_2z&0x3f)<<6;
			_2z=_Qu.charCodeAt(index++);
			_Z3|=(_2z&0x3f);
		}
		else 
		{
			_Z3=(_2z&0x07)<<18;
			_2z=_Qu.charCodeAt(index++);
			_Z3|=(_2z&0x3f)<<12;
			_2z=_Qu.charCodeAt(index++);
			_Z3|=(_2z&0x3f)<<6;
			_2z=_Qu.charCodeAt(index++);
			_Z3|=(_2z&0x3f);
		}
		if(_Z3==0x00)break;
		var chr=String.fromCharCode(_Z3);
		_ta+=chr;
	}
	return _ta;
}

function base64_decode(data)
{
	var _kf="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var _lf,_mf,_nf,_of,_pf,_qf,_rf,_sf;
	var i=0;
	var _tf=0;
	var _3z="";
	var _vf=[];
	if(!data)
	{
		return data;
	}
	data=yyGetString(data);
	data+='';
	do 
	{
		_of=_kf.indexOf(data.charAt(i++));
		_pf=_kf.indexOf(data.charAt(i++));
		_qf=_kf.indexOf(data.charAt(i++));
		_rf=_kf.indexOf(data.charAt(i++));
		_sf=_of<<18|_pf<<12|_qf<<6|_rf;
		_lf=_sf>>16&0xff;
		_mf=_sf>>8&0xff;
		_nf=_sf&0xff;
		if(_qf==64)
		{
			_vf[_tf++]=String.fromCharCode(_lf);
		}
		else if(_rf==64)
		{
			_vf[_tf++]=String.fromCharCode(_lf,_mf);
		}
		else 
		{
			_vf[_tf++]=String.fromCharCode(_lf,_mf,_nf);
		}
	}
	while(i<data.length);
	_3z=_vf.join('');
	return _1z(_3z);
}

function _4z(data)
{
	var _kf="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var _lf,_mf,_nf,_of,_pf,_qf,_rf,_sf;
	var i=0;
	var _tf=0;
	var _3z="";
	var _vf=[];
	if(!data)
	{
		return data;
	}
	data=yyGetString(data);
	data+='';
	do 
	{
		_of=_kf.indexOf(data.charAt(i++));
		_pf=_kf.indexOf(data.charAt(i++));
		_qf=_kf.indexOf(data.charAt(i++));
		_rf=_kf.indexOf(data.charAt(i++));
		_sf=_of<<18|_pf<<12|_qf<<6|_rf;
		_lf=_sf>>16&0xff;
		_mf=_sf>>8&0xff;
		_nf=_sf&0xff;
		if(_qf==64)
		{
			_vf[_tf++]=String.fromCharCode(_lf);
		}
		else if(_rf==64)
		{
			_vf[_tf++]=String.fromCharCode(_lf,_mf);
		}
		else 
		{
			_vf[_tf++]=String.fromCharCode(_lf,_mf,_nf);
		}
	}
	while(i<data.length);
	_3z=_vf.join('');
	return _3z;
}

function md5_string_unicode(string)
{
	return _5z(_6z(yyGetString(string)));
}

function md5_string_utf8(string)
{
	return _5z(yyGetString(string));
}

function md5_file(_7z)
{
	return "unsupported";
}

function os_is_network_connected()
{
	if(navigator!=null&&navigator!=undefined)
	{
		return navigator["onLine"]?1.0:0.0;
	}
	return 1.0;
}

function os_powersave_enable(enable)
{
}

function os_lock_orientation(enable)
{
}

function analytics_event(_f2)
{
	_f2=yyGetString(_f2);
	try
	{
		if(_nu.Options.TrackingID)
		{
			_gaq.push(['_trackEvent','GMEvent',_f2]);
		}
		else if(_nu.Options.FlurryId)
		{
			FlurryAgent.logEvent(_f2);
		}
	}
	catch(_wu)
	{
		show_debug_message("caught unhandled exception "+_wu.message);
	}
}

function analytics_event_ext(_f2)
{
	_f2=yyGetString(_f2);
	try
	{
		var arguments=arguments;
		if(_nu.Options.TrackingID)
		{
			if(arguments.length>=3)
			{
				_gaq.push(['_trackEvent','GMEvent',_f2,arguments[1],arguments[2]]);
			}
			else 
			{
				_gaq.push(['_trackEvent','GMEvent',_f2]);
			}
		}
		else if(_nu.Options.FlurryId)
		{
			if((arguments.length>=3)&&(arguments.length&1)==1)
			{
				var _Ar=
				{
				}
				;
				var _8z=arguments.length-1;
				if(_8z>10)
				{
					_8z=10;
				}
				for(var i=0;i<_8z;i+=2)
				{
					_Ar[arguments[i+1]]=arguments[i+2].toString();
				}
				FlurryAgent.logEvent(_f2,_Ar);
			}
			else 
			{
				FlurryAgent.logEvent(_f2);
			}
		}
	}
	catch(_wu)
	{
		show_debug_message("caught unhandled exception "+_wu.message);
	}
}

function sha1_string_unicode(_Lw)
{
	return _9z(_6z(yyGetString(_Lw)));
}

function sha1_string_utf8(_Lw)
{
	return _9z(yyGetString(_Lw));
}

function sha1_file(_hw)
{
	return "unsupported";
}
var _az=0;
var _bz="";

function _5z(_hg)
{
	return _cz(_dz(_ez(_hg)));
}

function _fz(_hg)
{
	return _gz(_dz(_ez(_hg)));
}

function _hz(_hg,e)
{
	return _iz(_dz(_ez(_hg)),e);
}

function _jz(_ij,_en)
{
	return _cz(_kz(_ez(_ij),_ez(_en)));
}

function _lz(_ij,_en)
{
	return _gz(_kz(_ez(_ij),_ez(_en)));
}

function _mz(_ij,_en,e)
{
	return _iz(_kz(_ez(_ij),_ez(_en)),e);
}

function _nz()
{
	return _5z("abc").toLowerCase()=="900150983cd24fb0d6963f7d28e17f72";
}

function _dz(_hg)
{
	return _oz(_pz(_qz(_hg),_hg.length*8));
}

function _kz(key,data)
{
	var _rz=_qz(key);
	if(_rz.length>16)_rz=_pz(_rz,key.length*8);
	var _sz=Array(16),_tz=Array(16);
	for(var i=0;i<16;i++)
	{
		_sz[i]=_rz[i]^0x36363636;
		_tz[i]=_rz[i]^0x5C5C5C5C;
	}
	var hash=_pz(_sz.concat(_qz(data)),512+data.length*8);
	return _oz(_pz(_tz.concat(hash),512+128));
}

function _cz(input)
{
	var _uz=_az?"0123456789ABCDEF":"0123456789abcdef";
	var output="";
	var x;
	for(var i=0;i<input.length;i++)
	{
		x=input.charCodeAt(i);
		output+=_uz.charAt((x>>>4)&0x0F)+_uz.charAt(x&0x0F);
	}
	return output;
}

function _gz(input)
{
	var _vz="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	var output="";
	var _Sg=input.length;
	for(var i=0;i<_Sg;i+=3)
	{
		var _wz=(input.charCodeAt(i)<<16)|(i+1<_Sg?input.charCodeAt(i+1)<<8:0)|(i+2<_Sg?input.charCodeAt(i+2):0);
		for(var _05=0;_05<4;_05++)
		{
			if(i*8+_05*6>input.length*8)output+=_bz;
			else output+=_vz.charAt((_wz>>>6*(3-_05))&0x3F);
		}
	}
	return output;
}

function _iz(input,_xz)
{
	var _yz=_xz.length;
	var i,_05,q,x,_zz;
	var _Az=Array(Math.ceil(input.length/2));
	for(i=0;i<_Az.length;i++)
	{
		_Az[i]=(input.charCodeAt(i*2)<<8)|input.charCodeAt(i*2+1);
	}
	var _Bz=Math.ceil(input.length*8/(Math.log(_xz.length)/Math.log(2)));
	var _Cz=Array(_Bz);
	for(_05=0;_05<_Bz;_05++)
	{
		_zz=Array();
		x=0;
		for(i=0;i<_Az.length;i++)
		{
			x=(x<<16)+_Az[i];
			q=Math.floor(x/_yz);
			x-=q*_yz;
			if(_zz.length>0||q>0)_zz[_zz.length]=q;
		}
		_Cz[_05]=x;
		_Az=_zz;
	}
	var output="";
	for(i=_Cz.length-1;i>=0;i--)output+=_xz.charAt(_Cz[i]);
	return output;
}

function _ez(input)
{
	var output="";
	var i=-1;
	var x,y;
	while(++i<input.length) 
	{
		x=input.charCodeAt(i);
		y=i+1<input.length?input.charCodeAt(i+1):0;
		if(0xD800<=x&&x<=0xDBFF&&0xDC00<=y&&y<=0xDFFF)
		{
			x=0x10000+((x&0x03FF)<<10)+(y&0x03FF);
			i++;
		}
		if(x<=0x7F)output+=String.fromCharCode(x);
		else if(x<=0x7FF)output+=String.fromCharCode(0xC0|((x>>>6)&0x1F),0x80|(x&0x3F));
		else if(x<=0xFFFF)output+=String.fromCharCode(0xE0|((x>>>12)&0x0F),0x80|((x>>>6)&0x3F),0x80|(x&0x3F));
		else if(x<=0x1FFFFF)output+=String.fromCharCode(0xF0|((x>>>18)&0x07),0x80|((x>>>12)&0x3F),0x80|((x>>>6)&0x3F),0x80|(x&0x3F));
	}
	return output;
}

function _6z(input)
{
	var output="";
	for(var i=0;i<input.length;i++)output+=String.fromCharCode(input.charCodeAt(i)&0xFF,(input.charCodeAt(i)>>>8)&0xFF);
	return output;
}

function _Dz(input)
{
	var output="";
	for(var i=0;i<input.length;i++)output+=String.fromCharCode((input.charCodeAt(i)>>>8)&0xFF,input.charCodeAt(i)&0xFF);
	return output;
}

function _qz(input)
{
	var output=Array(input.length>>2);
	for(var i=0;i<output.length;i++)output[i]=0;
	for(var i=0;i<input.length*8;i+=8)output[i>>5]|=(input.charCodeAt(i/8)&0xFF)<<(i%32);
	return output;
}

function _oz(input)
{
	var output="";
	for(var i=0;i<input.length*32;i+=8)output+=String.fromCharCode((input[i>>5]>>>(i%32))&0xFF);
	return output;
}

function _pz(x,_Sg)
{
	x[_Sg>>5]|=0x80<<((_Sg)%32);
	x[(((_Sg+64)>>>9)<<4)+14]=_Sg;
	var _i3=1732584193;
	var _h3=-271733879;
	var c=-1732584194;
	var _en=271733878;
	for(var i=0;i<x.length;i+=16)
	{
		var _Ez=_i3;
		var _Fz=_h3;
		var _Gz=c;
		var _Hz=_en;
		_i3=_Iz(_i3,_h3,c,_en,x[i+0],7,-680876936);
		_en=_Iz(_en,_i3,_h3,c,x[i+1],12,-389564586);
		c=_Iz(c,_en,_i3,_h3,x[i+2],17,606105819);
		_h3=_Iz(_h3,c,_en,_i3,x[i+3],22,-1044525330);
		_i3=_Iz(_i3,_h3,c,_en,x[i+4],7,-176418897);
		_en=_Iz(_en,_i3,_h3,c,x[i+5],12,1200080426);
		c=_Iz(c,_en,_i3,_h3,x[i+6],17,-1473231341);
		_h3=_Iz(_h3,c,_en,_i3,x[i+7],22,-45705983);
		_i3=_Iz(_i3,_h3,c,_en,x[i+8],7,1770035416);
		_en=_Iz(_en,_i3,_h3,c,x[i+9],12,-1958414417);
		c=_Iz(c,_en,_i3,_h3,x[i+10],17,-42063);
		_h3=_Iz(_h3,c,_en,_i3,x[i+11],22,-1990404162);
		_i3=_Iz(_i3,_h3,c,_en,x[i+12],7,1804603682);
		_en=_Iz(_en,_i3,_h3,c,x[i+13],12,-40341101);
		c=_Iz(c,_en,_i3,_h3,x[i+14],17,-1502002290);
		_h3=_Iz(_h3,c,_en,_i3,x[i+15],22,1236535329);
		_i3=_Jz(_i3,_h3,c,_en,x[i+1],5,-165796510);
		_en=_Jz(_en,_i3,_h3,c,x[i+6],9,-1069501632);
		c=_Jz(c,_en,_i3,_h3,x[i+11],14,643717713);
		_h3=_Jz(_h3,c,_en,_i3,x[i+0],20,-373897302);
		_i3=_Jz(_i3,_h3,c,_en,x[i+5],5,-701558691);
		_en=_Jz(_en,_i3,_h3,c,x[i+10],9,38016083);
		c=_Jz(c,_en,_i3,_h3,x[i+15],14,-660478335);
		_h3=_Jz(_h3,c,_en,_i3,x[i+4],20,-405537848);
		_i3=_Jz(_i3,_h3,c,_en,x[i+9],5,568446438);
		_en=_Jz(_en,_i3,_h3,c,x[i+14],9,-1019803690);
		c=_Jz(c,_en,_i3,_h3,x[i+3],14,-187363961);
		_h3=_Jz(_h3,c,_en,_i3,x[i+8],20,1163531501);
		_i3=_Jz(_i3,_h3,c,_en,x[i+13],5,-1444681467);
		_en=_Jz(_en,_i3,_h3,c,x[i+2],9,-51403784);
		c=_Jz(c,_en,_i3,_h3,x[i+7],14,1735328473);
		_h3=_Jz(_h3,c,_en,_i3,x[i+12],20,-1926607734);
		_i3=_Kz(_i3,_h3,c,_en,x[i+5],4,-378558);
		_en=_Kz(_en,_i3,_h3,c,x[i+8],11,-2022574463);
		c=_Kz(c,_en,_i3,_h3,x[i+11],16,1839030562);
		_h3=_Kz(_h3,c,_en,_i3,x[i+14],23,-35309556);
		_i3=_Kz(_i3,_h3,c,_en,x[i+1],4,-1530992060);
		_en=_Kz(_en,_i3,_h3,c,x[i+4],11,1272893353);
		c=_Kz(c,_en,_i3,_h3,x[i+7],16,-155497632);
		_h3=_Kz(_h3,c,_en,_i3,x[i+10],23,-1094730640);
		_i3=_Kz(_i3,_h3,c,_en,x[i+13],4,681279174);
		_en=_Kz(_en,_i3,_h3,c,x[i+0],11,-358537222);
		c=_Kz(c,_en,_i3,_h3,x[i+3],16,-722521979);
		_h3=_Kz(_h3,c,_en,_i3,x[i+6],23,76029189);
		_i3=_Kz(_i3,_h3,c,_en,x[i+9],4,-640364487);
		_en=_Kz(_en,_i3,_h3,c,x[i+12],11,-421815835);
		c=_Kz(c,_en,_i3,_h3,x[i+15],16,530742520);
		_h3=_Kz(_h3,c,_en,_i3,x[i+2],23,-995338651);
		_i3=_Lz(_i3,_h3,c,_en,x[i+0],6,-198630844);
		_en=_Lz(_en,_i3,_h3,c,x[i+7],10,1126891415);
		c=_Lz(c,_en,_i3,_h3,x[i+14],15,-1416354905);
		_h3=_Lz(_h3,c,_en,_i3,x[i+5],21,-57434055);
		_i3=_Lz(_i3,_h3,c,_en,x[i+12],6,1700485571);
		_en=_Lz(_en,_i3,_h3,c,x[i+3],10,-1894986606);
		c=_Lz(c,_en,_i3,_h3,x[i+10],15,-1051523);
		_h3=_Lz(_h3,c,_en,_i3,x[i+1],21,-2054922799);
		_i3=_Lz(_i3,_h3,c,_en,x[i+8],6,1873313359);
		_en=_Lz(_en,_i3,_h3,c,x[i+15],10,-30611744);
		c=_Lz(c,_en,_i3,_h3,x[i+6],15,-1560198380);
		_h3=_Lz(_h3,c,_en,_i3,x[i+13],21,1309151649);
		_i3=_Lz(_i3,_h3,c,_en,x[i+4],6,-145523070);
		_en=_Lz(_en,_i3,_h3,c,x[i+11],10,-1120210379);
		c=_Lz(c,_en,_i3,_h3,x[i+2],15,718787259);
		_h3=_Lz(_h3,c,_en,_i3,x[i+9],21,-343485551);
		_i3=_Mz(_i3,_Ez);
		_h3=_Mz(_h3,_Fz);
		c=_Mz(c,_Gz);
		_en=_Mz(_en,_Hz);
	}
	return Array(_i3,_h3,c,_en);
}

function _Nz(q,_i3,_h3,x,_hg,_K5)
{
	return _Mz(_Oz(_Mz(_Mz(_i3,q),_Mz(x,_K5)),_hg),_h3);
}

function _Iz(_i3,_h3,c,_en,x,_hg,_K5)
{
	return _Nz((_h3&c)|((~_h3)&_en),_i3,_h3,x,_hg,_K5);
}

function _Jz(_i3,_h3,c,_en,x,_hg,_K5)
{
	return _Nz((_h3&_en)|(c&(~_en)),_i3,_h3,x,_hg,_K5);
}

function _Kz(_i3,_h3,c,_en,x,_hg,_K5)
{
	return _Nz(_h3^c^_en,_i3,_h3,x,_hg,_K5);
}

function _Lz(_i3,_h3,c,_en,x,_hg,_K5)
{
	return _Nz(c^(_h3|(~_en)),_i3,_h3,x,_hg,_K5);
}

function _Mz(x,y)
{
	var _Pz=(x&0xFFFF)+(y&0xFFFF);
	var _Qz=(x>>16)+(y>>16)+(_Pz>>16);
	return(_Qz<<16)|(_Pz&0xFFFF);
}

function _Oz(_vn,_Rz)
{
	return(_vn<<_Rz)|(_vn>>>(32-_Rz));
}

function _9z(_hg)
{
	return _cz(_Sz(_ez(_hg)));
}

function _Tz(_hg)
{
	return _gz(_Sz(_ez(_hg)));
}

function _Uz(_hg,e)
{
	return _iz(_Sz(_ez(_hg)),e);
}

function _Vz(_ij,_en)
{
	return _cz(_Wz(_ez(_ij),_ez(_en)));
}

function _Xz(_ij,_en)
{
	return _gz(_Wz(_ez(_ij),_ez(_en)));
}

function _Yz(_ij,_en,e)
{
	return _iz(_Wz(_ez(_ij),_ez(_en)),e);
}

function _Zz()
{
	return _9z("abc").toLowerCase()=="a9993e364706816aba3e25717850c26c9cd0d89d";
}

function _Sz(_hg)
{
	return __z(_0A(_1A(_hg),_hg.length*8));
}

function _Wz(key,data)
{
	var _rz=_1A(key);
	if(_rz.length>16)_rz=_0A(_rz,key.length*8);
	var _sz=Array(16),_tz=Array(16);
	for(var i=0;i<16;i++)
	{
		_sz[i]=_rz[i]^0x36363636;
		_tz[i]=_rz[i]^0x5C5C5C5C;
	}
	var hash=_0A(_sz.concat(_1A(data)),512+data.length*8);
	return __z(_0A(_tz.concat(hash),512+160));
}

function _1A(input)
{
	var output=Array(input.length>>2);
	for(var i=0;i<output.length;i++)output[i]=0;
	for(var i=0;i<input.length*8;i+=8)output[i>>5]|=(input.charCodeAt(i/8)&0xFF)<<(24-i%32);
	return output;
}

function __z(input)
{
	var output="";
	for(var i=0;i<input.length*32;i+=8)output+=String.fromCharCode((input[i>>5]>>>(24-i%32))&0xFF);
	return output;
}

function _0A(x,_Sg)
{
	x[_Sg>>5]|=0x80<<(24-_Sg%32);
	x[((_Sg+64>>9)<<4)+15]=_Sg;
	var w=Array(80);
	var _i3=1732584193;
	var _h3=-271733879;
	var c=-1732584194;
	var _en=271733878;
	var e=-1009589776;
	for(var i=0;i<x.length;i+=16)
	{
		var _Ez=_i3;
		var _Fz=_h3;
		var _Gz=c;
		var _Hz=_en;
		var _2A=e;
		for(var _05=0;_05<80;_05++)
		{
			if(_05<16)w[_05]=x[i+_05];
			else w[_05]=_Oz(w[_05-3]^w[_05-8]^w[_05-14]^w[_05-16],1);
			var _K5=_Mz(_Mz(_Oz(_i3,5),_3A(_05,_h3,c,_en)),_Mz(_Mz(e,w[_05]),_4A(_05)));
			e=_en;
			_en=c;
			c=_Oz(_h3,30);
			_h3=_i3;
			_i3=_K5;
		}
		_i3=_Mz(_i3,_Ez);
		_h3=_Mz(_h3,_Fz);
		c=_Mz(c,_Gz);
		_en=_Mz(_en,_Hz);
		e=_Mz(e,_2A);
	}
	return Array(_i3,_h3,c,_en,e);
}

function _3A(_K5,_h3,c,_en)
{
	if(_K5<20)return(_h3&c)|((~_h3)&_en);
	if(_K5<40)return _h3^c^_en;
	if(_K5<60)return(_h3&c)|(_h3&_en)|(c&_en);
	return _h3^c^_en;
}

function _4A(_K5)
{
	return(_K5<20)?1518500249:(_K5<40)?1859775393:(_K5<60)?-1894007588:-899497514;
}

function _5A(_O2,_dj)
{
	for(var index=0;index<_dj.length;index++)
	{
		var _6A=_dj[index];
		if(_6A&&(_6A.pName==_O2))
		{
			return index;
		}
	}
	return -1;
}

function _7A(_O2,_dj)
{
	for(var index=0;index<_dj.length;index++)
	{
		var _6A=_dj[index];
		if(_6A&&(_6A.name==_O2))
		{
			return index;
		}
	}
	return -1;
}

function _8A(_O2,_dj)
{
	var _9A="gml_Script_"+_O2;
	var _aA=-1;
	for(var index=0;index<_dj.length;index++)
	{
		var _bA=_dj[index];
		if(_bA&&_bA.endsWith(_O2))
		{
			if(_bA==_9A)return index+100000;
			else if(_bA==_O2)_aA=index+100000;
		}
	}
	if(_aA==-1)
	{
		var _cA="gml_GlobalScript_"+_O2;
		for(var index=0;index<_dj.length;index++)
		{
			var _bA=_dj[index];
			if(_bA&&_bA.endsWith(_O2))
			{
				if(_bA==_cA)return index+100000;
			}
		}
	}
	return _aA;
}

function _dA(_O2)
{
	_O2=yyGetString(_O2);
	var _eA=
	{
		type:-1,id:-1	}
	;
	if((_r3=_5A(_O2,_nu.GMObjects))>=0)
	{
		_eA.type=_fA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_5A(_O2,_nu.Sprites))>=0)
	{
		_eA.type=_gA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_5A(_O2,_nu.GMRooms))>=0)
	{
		_eA.type=_hA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_5A(_O2,_nu.Sounds))>=0)
	{
		_eA.type=_iA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_5A(_O2,_nu.Backgrounds))>=0)
	{
		_eA.type=_jA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_5A(_O2,_nu.Paths))>=0)
	{
		_eA.type=_kA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_5A(_O2,_nu.Fonts))>=0)
	{
		_eA.type=_lA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_5A(_O2,_nu.Timelines))>=0)
	{
		_eA.type=_mA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_8A(_O2,_nu.ScriptNames))>=0)
	{
		_eA.type=_nA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_7A(_O2,_nu.Shaders))>=0)
	{
		_eA.type=_oA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_5A(_O2,_nu.Sequences))>=0)
	{
		_eA.type=_pA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_5A(_O2,_nu.AnimCurves))>=0)
	{
		_eA.type=_qA;
		_eA.id=_r3;
		return _eA;
	}
	if((_r3=_rA._sA(_O2))>=0)
	{
		_eA.type=_tA;
		_eA.id=_r3;
		return _eA;
	}
	return _eA;
}

function _uA(_K2,_vA)
{
	switch(_vA)
	{
		case _fA:return(object_exists(_K2))?object_get_name(_K2):"";
		case _gA:return(sprite_exists(_K2))?sprite_get_name(_K2):"";
		case _iA:return(_wA(_K2))?_xA(_K2):"";
		case _hA:return(room_exists(_K2))?room_get_name(_K2):"";
		case _jA:return(_fk(_K2))?_kk(_K2):"";
		case _kA:return(path_exists(_K2))?path_get_name(_K2):"";
		case _nA:return(script_exists(_K2))?script_get_name(_K2):"";
		case _lA:return(font_exists(_K2))?font_get_name(_K2):"";
		case _mA:return(timeline_exists(_K2))?timeline_get_name(_K2):"";
		case _oA:return(_yA(_K2))?shader_get_name(_K2):"";
		case _pA:return(_zA(_K2))?_AA(_K2):"";
		case _qA:return(_BA(_K2))?_CA(_K2):"";
		case _tA:
		{
			var _DA=_rA._F4(_K2);
			return(_DA!=null)?_DA.name:"";
		}
	}
	return "";
}

function asset_get_index(_O2)
{
	_O2=yyGetString(_O2);
	var _eA=_dA(_O2);
	if(_eA.id>=0)return _eA.id;
	var _0j=Object.getOwnPropertyNames(g_pBuiltIn);
	for(var i=0;i>_0j;i++)
	{
		if(_0j[i]==_O2)
		{
			return i;
		}
	}
	return -1;
}

function asset_get_type(_O2)
{
	_O2=yyGetString(_O2);
	var _eA=_dA(_O2);
	return _eA.type;
}

function asset_get_ids(_vA)
{
	var ids;
	var _EA=false;
	switch(_vA)
	{
		case _FA:break;
		case _fA:ids=_j2._GA();
		_EA=true;
		break;
		case _gA:ids=_E4._GA();
		break;
		case _hA:ids=_HA._GA();
		break;
		case _jA:ids=_ik._GA();
		_EA=true;
		break;
		case _kA:ids=_IA._GA();
		break;
		case _nA:
		{
			ids=[];
			for(var i=0;i<_nu.Scripts.length;++i)
			{
				if(_nu.Scripts[i])
				{
					ids.push(100000+i);
				}
			}
		}
		break;
		case _lA:ids=_Su._GA();
		break;
		case _mA:ids=_Gy._GA();
		break;
		case _oA:
		{
			ids=[];
			for(var i=0;i<_JA.length;++i)
			{
				if(_JA[i])
				{
					ids.push(i);
				}
			}
		}
		break;
		case _pA:ids=_KA._GA();
		break;
		case _qA:ids=_Uj._GA();
		break;
		case _iA:ids=_LA._GA();
		break;
		case _tA:ids=_rA._GA();
		_EA=true;
		break;
		default :break;
	}
	if(_EA)
	{
		for(var i=0;i<ids.length;++i)
		{
			ids[i]=_dm(_vA|_MA,ids[i]);
		}
	}
	return ids;
}

function alarm_get(_Uv,index)
{
	return _Uv.alarm[yyGetInt32(index)];
}

function alarm_set(_Uv,index,_u7)
{
	_Uv.alarm[yyGetInt32(index)]=yyGetInt32(_u7);
}

function game_set_speed(_NA,_if)
{
	_NA=yyGetReal(_NA);
	if(_NA<0)return;
	if(_NA==0)_y2._OA(_NA);
	if(yyGetInt32(_if)==0)_y2._OA(_NA);
	else _y2._OA(1000000.0/_NA);
}
;

function game_get_speed(_NA)
{
	if(!_y2._PA())return 0;
	if(yyGetInt32(_NA)==0)return _y2._z2();
	else return 1000000.0/_y2._z2();
}
/*@constructor */
function _QA()
{
	this._RA=0;
	this._SA=0;
	this._TA=false;
	this._UA=0;
	this._VA=0;
}
;
_QA.prototype._OA=
function(_NA)
{
	this._UA=_NA;
	this._WA();
}
;
_QA.prototype._XA=
function(_NA)
{
	this._TA=_NA;
}
;
_QA.prototype._YA=
function()
{
	return this._RA;
}
;
_QA.prototype._ZA=
function()
{
	return this._RA*0.000001;
}
;
_QA.prototype.__A=
function(_NA)
{
	return this._RA/_NA;
}
;
_QA.prototype._PA=
function()
{
	if(this._UA>0.0)return true;
	return true;
}
;
_QA.prototype._WA=
function()
{
	this._RA=0;
	if(this._UA>0.0)
	{
		this._SA=get_timer();
	}
	else 
	{
		this._SA=0;
	}
	this._VA=0;
	this._TA=false;
}
;
_QA.prototype._te=
function()
{
	var current;
	if(this._UA>0.0)
	{
		current=this._SA+1000000.0/this._UA;
	}
	else current=get_timer();
	this._VA=current-this._SA;
	if(!this._TA)this._RA+=this._VA;
	this._SA=current;
}
;
_QA.prototype._z2=
function()
{
	if(this._UA>0)return this._UA;
	if(this._VA>0)
	{
		return 1000000.0/this._VA;
	}
	return 30.0;
}
;
var _y2=new _QA();

function gamepad_is_supported()
{
	return _Pc._ne();
}

function gamepad_get_device_count()
{
	return _Pc._je();
}

function gamepad_is_connected(_le)
{
	return _Pc._ue(yyGetInt32(_le));
}

function gamepad_get_button_threshold(_le)
{
	return _Pc._1d(yyGetInt32(_le));
}

function gamepad_set_button_threshold(_le,_pe)
{
	_Pc._oe(yyGetInt32(_le),yyGetReal(_pe));
}

function gamepad_get_axis_deadzone(_le)
{
	return _Pc.__c(yyGetInt32(_le));
}

function gamepad_set_axis_deadzone(_le,_re)
{
	_Pc._qe(yyGetInt32(_le),yyGetReal(_re));
}

function gamepad_get_description(_le)
{
	return _Pc._ke(yyGetInt32(_le));
}

function gamepad_button_count(_le)
{
	return _Pc._6d(yyGetInt32(_le));
}

function gamepad_button_check(_le,_8d)
{
	return _Pc._cd(yyGetInt32(_le),yyGetInt32(_8d));
}

function gamepad_button_check_pressed(_le,_8d)
{
	return _Pc._7d(yyGetInt32(_le),yyGetInt32(_8d));
}

function gamepad_button_check_released(_le,_8d)
{
	return _Pc._bd(yyGetInt32(_le),yyGetInt32(_8d));
}

function gamepad_button_value(_le,_8d)
{
	return _Pc._dd(yyGetInt32(_le),yyGetInt32(_8d));
}

function gamepad_axis_count(_le)
{
	return _Pc._ed(yyGetInt32(_le));
}

function gamepad_axis_value(_le,_gd)
{
	return _Pc._fd(yyGetInt32(_le),yyGetInt32(_gd));
}

function gamepad_set_vibration(_le,_0B,_1B)
{
}

function gamepad_set_color(_le,_9l)
{
}

function gamepad_set_colour(_le,_nb)
{
}

function gamepad_hat_count(_le)
{
	return 0;
}

function gamepad_hat_value(_le,_K2)
{
	return 0;
}

function gamepad_remove_mapping(_le)
{
}

function gamepad_test_mapping(_le,_2B)
{
}

function gamepad_get_mapping(_le)
{
	_le=yyGetInt32(_le);
	if((_le<0)||(_le>=_Pc._je()))
	{
		return "device index out of range";
	}
	return "no mapping";
}

function gamepad_get_guid(_le)
{
	_le=yyGetInt32(_le);
	if((_le<0)||(_le>=_Pc._je()))
	{
		return "device index out of range";
	}
	return "none";
}

function gamepad_set_option()
{
}

function gamepad_get_option()
{
	return 0;
}
var _Ms=1,_Ks=2,_3B=3,_Ls=4,_Is=5,_Js=6,_4B=7,_5B=8,_6B=9,_7B=10,_8B=11;
var _9B=0.0;

function display_get_gui_height()
{
	var _aB=_bB;
	var scale=_cB;
	if(_aB<0)_aB=window_get_height();
	if(scale==0.0)scale=1.0;
	return _aB/scale;
}

function display_get_gui_width()
{
	var _dB=_eB;
	var scale=_fB;
	if(_dB<0)_dB=window_get_width();
	if(scale==0.0)scale=1.0;
	return _dB/scale;
}

function display_set_gui_size(_q7,_r7)
{
	_eB=yyGetInt32(_q7);
	_bB=yyGetInt32(_r7);
	_gB=false;
	_hB=0;
	_iB=0;
	_fB=1;
	_cB=1;
	if(_jB)
	{
		_kB();
	}
}

function display_set_gui_maximise(_7l,_8l,_lB,_mB)
{
	_gB=true;
	_hB=0;
	_iB=0;
	_fB=1;
	_cB=1;
	_eB=-1;
	_bB=-1;
	if(_7l==-1&&_8l==-1&&_lB==undefined&&_mB==undefined)
	{
		if(_jB)
		{
			_kB();
		}
		return;
	}
	if(_7l!=undefined)_fB=yyGetReal(_7l);
	if(_8l!=undefined)_cB=yyGetReal(_8l);
	if(_lB!=undefined)_hB=yyGetReal(_lB);
	if(_mB!=undefined)_iB=yyGetReal(_mB);
	if(_jB)
	{
		_kB();
	}
}
var display_set_gui_maximize=display_set_gui_maximise;
var _nB=96;

function display_get_dpi_x()
{
	return _nB*window.devicePixelRatio;
}
var _oB=96;

function display_get_dpi_y()
{
	return _oB;
}

function display_get_width()
{
	return _pB();
}

function display_get_height()
{
	return _qB();
}

function display_get_orientation()
{
	return 0;
}

function draw_clear(_ec)
{
	_rB(_ob(yyGetInt32(_ec)));
}

function draw_clear_alpha()
{
}
draw_clear_alpha=(_ec,_y8)=>
{
	_ec=yyGetInt32(_ec);
	_y8=yyGetReal(_y8);
	_sB();
	var _tB=[];
	_tB[0]=1;
	_tB[1]=0;
	_tB[2]=0;
	_tB[3]=1;
	_tB[4]=0;
	_tB[5]=0;
	_59._uB(_tB[0],_tB[1],_tB[2],_tB[3],_tB[4],_tB[5]);
	if(!_59.clearRect||_ec!=0||_y8!=0)
	{
		_59.globalAlpha=_y8;
		_59.fillStyle=_Gk(_ob(_ec),_y8);
		_59.globalCompositeOperation='copy';
		_59.fillRect(_vB,_wB,_xB,_yB);
	}
	else 
	{
		_59.clearRect(_vB,_wB,_xB,_yB);
	}
	_zB();
}
;

function make_color_rgb(_Zr,__r,_0s)
{
	return(yyGetInt32(_Zr))|(yyGetInt32(__r)<<8)|(yyGetInt32(_0s)<<16);
}
var make_colour_rgb=make_color_rgb;

function color_get_blue(_ec)
{
	return(yyGetInt32(_ec)>>16)&0xff;
}
var colour_get_blue=color_get_blue;

function color_get_green(_ec)
{
	return(yyGetInt32(_ec)>>8)&0xff;
}
var colour_get_green=color_get_green;

function color_get_red(_ec)
{
	return(yyGetInt32(_ec)&0xff);
}
var colour_get_red=color_get_red;

function _AB(_ec)
{
	_ec=yyGetInt32(_ec);
	var _BB=0.0;
	var _CB=0.0;
	var _DB=0.0;
	var _56=0.0;
	var _66=0.0;
	var _EB=0.0;
	var _en=0.0;
	var _w5=0.0;
	_BB=(_ec&0xff)/255.0;
	_CB=((_ec>>8)&0xff)/255.0;
	_DB=((_ec>>16)&0xff)/255.0;
	_w5=_J5(_J5(_BB,_CB),_DB);
	_EB=_I5(_I5(_BB,_CB),_DB);
	_en=_EB-_w5;
	if(_EB==0)_66=0.0;
	else _66=1.0*_en/_EB;
	if(_66==0)_56=0.0;
	else if(_BB==_EB)_56=60.0*(_CB-_DB)/_en;
	else if(_CB==_EB)_56=120.0+60.0*(_DB-_BB)/_en;
	else _56=240.0+60.0*(_BB-_CB)/_en;
	if(_56<0)_56=_56+360.0;
	var _Z3=Math.min(255,Math.max(0,_EB*255.0));
	var _hg=Math.min(255,Math.max(0,_66*255.0));
	var h=Math.min(255,Math.max(0,(_56*255.0)/360.0));
	var _on=
	{
		h:h,_hg:_hg,_Z3:_Z3	}
	;
	return _on;
}

function color_get_hue(_ec)
{
	var _FB=_AB(_ec);
	return _FB.h;
}
var colour_get_hue=color_get_hue;

function color_get_saturation(_ec)
{
	var _FB=_AB(_ec);
	return _FB._hg;
}
var colour_get_saturation=color_get_saturation;

function color_get_value(_ec)
{
	var _FB=_AB(_ec);
	return _FB._Z3;
}
var colour_get_value=color_get_value;

function merge_color(_Jk,_Kk,_Lt)
{
	_Jk=yyGetInt32(_Jk);
	_Kk=yyGetInt32(_Kk);
	_Lt=yyGetReal(_Lt);
	var _ly=(_Jk>>16)&0xff;
	var _ny=(_Jk>>8)&0xff;
	var _Of=_Jk&0xff;
	var _my=(_Kk>>16)&0xff;
	var _oy=(_Kk>>8)&0xff;
	var _Pf=_Kk&0xff;
	var _GB=1.0-_Lt;
	var _f3=~~(_ly*_GB+_my*_Lt);
	var _g3=~~(_ny*_GB+_oy*_Lt);
	var _h3=~~(_Of*_GB+_Pf*_Lt);
	return((_f3<<16)&0xff0000)|((_g3<<8)&0xff00)|(_h3&0xff);
}

function merge_colour()
{
}
compile_if_used(merge_colour=merge_color);

function make_color_hsv(_HB,_IB,_5k)
{
	var _BB=0.0;
	var _CB=0.0;
	var _DB=0.0;
	var _56=0.0;
	var _66=0.0;
	var _EB=0.0;
	var _At=0.0;
	var _fx=0.0;
	var q=0.0;
	var _K5=0.0;
	var i=0;
	var _on;
	_56=yyGetReal(_HB)*360.0/255.0;
	if(_56==360.0)_56=0.0;
	_66=yyGetReal(_IB)/255.0;
	_EB=yyGetReal(_5k)/255.0;
	if(_66==0)
	{
		_BB=_EB;
		_CB=_EB;
		_DB=_EB;
	}
	else 
	{
		_56=_56/60.0;
		i=Math.floor(_56);
		_At=_56-i;
		_fx=_EB*(1.0-_66);
		q=_EB*(1.0-(_66*_At));
		_K5=_EB*(1.0-(_66*(1.0-_At)));
		switch(i)
		{
			case 0:
			{
				_BB=_EB;
				_CB=_K5;
				_DB=_fx;
			}
			break;
			case 1:
			{
				_BB=q;
				_CB=_EB;
				_DB=_fx;
			}
			break;
			case 2:
			{
				_BB=_fx;
				_CB=_EB;
				_DB=_K5;
			}
			break;
			case 3:
			{
				_BB=_fx;
				_CB=q;
				_DB=_EB;
			}
			break;
			case 4:
			{
				_BB=_K5;
				_CB=_fx;
				_DB=_EB;
			}
			break;
			default :
			{
				_BB=_EB;
				_CB=_fx;
				_DB=q;
			}
		}
	}
	_BB=Math.max(0,Math.min(255,Math.floor((_BB*255.0)+0.5)));
	_CB=Math.max(0,Math.min(255,Math.floor((_CB*255.0)+0.5)));
	_DB=Math.max(0,Math.min(255,Math.floor((_DB*255.0)+0.5)));
	_on=_BB|(_CB<<8)|(_DB<<16);
	return _on;
}

function make_colour_hsv()
{
}
compile_if_used(make_colour_hsv=make_color_hsv);

function draw_set_alpha(_y8)
{
	_y8=yyGetReal(_y8);
	_lb=_y8<0?0:(_y8>1?1:_y8);
	_JB=_Gk(_mb,_lb);
}

function draw_get_alpha()
{
	return _lb;
}

function draw_get_color()
{
	return _qx;
}

function draw_get_colour()
{
}
compile_if_used(draw_get_colour=draw_get_color);

function draw_set_color(_nb)
{
	_nb=yyGetInt32(_nb);
	_qx=_nb;
	_mb=_ob(_nb);
	_KB=_LB(_mb);
	_JB=_Gk(_mb,_lb);
}
var draw_set_colour=draw_set_color;

function draw_set_lighting(_Np)
{
	_En(_Np);
}
;

function draw_light_enable(_o8,_Np)
{
	_Hn(_o8,_Np);
}
;

function draw_light_define_direction(_o8,_ha,_ia,_0q,_n3)
{
	_Fn(_o8,_ha,_ia,_0q,_n3);
}
;

function draw_light_define_ambient(colour)
{
	_In(colour);
}
;

function draw_light_define_point(_o8,x,y,z,_f3,_n3)
{
	_Gn(_o8,x,y,z,_f3,_n3);
}
;

function draw_light_get_ambient()
{
	return _Ln();
}

function draw_light_get(_o8)
{
	return _Kn(yyGetInt32(_o8));
}
;

function draw_get_lighting()
{
	return _Mn();
}

function draw_roundrect(_X5,_Y5,_p5,_q5,_MB)
{
	draw_roundrect_color_ext(_X5,_Y5,_p5,_q5,10,10,_qx,_qx,_MB);
}

function draw_roundrect_ext(_X5,_Y5,_p5,_q5,_NB,_OB,_MB)
{
	draw_roundrect_color_ext(_X5,_Y5,_p5,_q5,_NB,_OB,_qx,_qx,_MB);
}

function draw_roundrect_color(_X5,_Y5,_p5,_q5,_Jk,_Kk,_MB)
{
	draw_roundrect_color_ext(_X5,_Y5,_p5,_q5,10,10,_Jk,_Kk,_MB);
}
var draw_roundrect_colour=draw_roundrect_color;

function draw_roundrect_color_ext()
{
}

function draw_roundrect_colour_ext()
{
}

function _PB(_X5,_Y5,_p5,_q5,_NB,_OB,_Jk,_Kk,_MB)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_NB=yyGetReal(_NB);
	_OB=yyGetReal(_OB);
	_Jk=yyGetReal(_Jk);
	_Kk=yyGetReal(_Kk);
	_MB=yyGetBool(_MB);
	if(_9B!=0.0)
	{
		_X5+=_9B;
		_Y5+=_9B;
		_p5+=_9B;
		_q5+=_9B;
	}
	if(_q5<_Y5)
	{
		var _QB=_Y5;
		_Y5=_q5;
		_q5=_QB;
	}
	if(_p5<_X5)
	{
		var _QB=_X5;
		_X5=_p5;
		_p5=_QB;
	}
	var width=_p5-_X5;
	var height=_q5-_Y5;
	var _RB=_NB;
	var _SB=_OB;
	var _n3=_59.globalAlpha=_lb;
	_59.beginPath();
	_59.moveTo(_X5+_RB,_Y5);
	_59.lineTo(_X5+width-_RB,_Y5);
	_59.quadraticCurveTo(_X5+width,_Y5,_X5+width,_Y5+_SB);
	_59.lineTo(_X5+width,_Y5+height-_SB);
	_59.quadraticCurveTo(_X5+width,_Y5+height,_X5+width-_RB,_Y5+height);
	_59.lineTo(_X5+_RB,_Y5+height);
	_59.quadraticCurveTo(_X5,_Y5+height,_X5,_Y5+height-_SB);
	_59.lineTo(_X5,_Y5+_SB);
	_59.quadraticCurveTo(_X5,_Y5,_X5+_RB,_Y5);
	_59.closePath();
	if(_MB)
	{
		_59.strokeStyle=_Gk(_ob(_Jk),1.0);
		_59.stroke();
	}
	else 
	{
		_59.fillStyle=_Gk(_ob(_Jk),1.0);
		_59.fill();
	}
}
draw_roundrect_color_ext=_PB;
compile_if_used(draw_roundrect_colour_ext=_PB);

function draw_rectangle()
{
}

function _TB(_X5,_Y5,_p5,_q5,_MB)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_MB=yyGetBool(_MB);
	_59.globalAlpha=_lb;
	if(_MB)
	{
		if(_9B!=0.0)
		{
			_X5+=_9B;
			_Y5+=_9B;
			_p5+=_9B;
			_q5+=_9B;
		}
		_59.lineWidth=1;
		_59.strokeStyle=_JB;
		_59._UB(_X5+0.5,_Y5+0.5,(_p5-_X5),(_q5-_Y5));
	}
	else 
	{
		if(_9B!=0.0)
		{
			_p5+=_9B;
			_q5+=_9B;
		}
		_59.fillStyle=_JB;
		_59._VB(_X5,_Y5,_p5-_X5+1,_q5-_Y5+1);
	}
}
draw_rectangle=_TB;

function draw_rectangle_color()
{
}

function draw_rectangle_colour()
{
}

function _WB(_X5,_Y5,_p5,_q5,_Jk,_Kk,_XB,_YB,_MB)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_Jk=yyGetInt32(_Jk);
	_Kk=yyGetInt32(_Kk);
	_XB=yyGetInt32(_XB);
	_YB=yyGetInt32(_YB);
	_MB=yyGetBool(_MB);
	var _n3=_Gk(_ob(_Jk),1.0);
	_59.globalAlpha=_lb;
	if(_MB)
	{
		if(_9B!=0.0)
		{
			_X5+=_9B;
			_Y5+=_9B;
			_p5+=_9B;
			_q5+=_9B;
		}
		_59.lineWidth=1;
		_59.strokeStyle=_n3;
		_59._UB(_X5+0.5,_Y5+0.5,(_p5-_X5),(_q5-_Y5));
	}
	else 
	{
		if(_9B!=0.0)
		{
			_p5+=_9B;
			_q5+=_9B;
		}
		_59.fillStyle=_n3;
		_59._VB(_X5+0.5,_Y5+0.5,(_p5-_X5),(_q5-_Y5));
	}
}
draw_rectangle_color=_WB;
compile_if_used(draw_rectangle_colour=_WB);

function draw_point()
{
}
draw_point=(_r4,_s4)=>
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	if(_9B!=0.0)
	{
		_r4+=_9B;
		_s4+=_9B;
	}
	_59.globalAlpha=_lb;
	_59.fillStyle=_JB;
	_59._VB(_r4,_s4,1,1);
}
;

function draw_line_width()
{
}
draw_line_width=(_X5,_Y5,_p5,_q5,_eh)=>
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	if(_9B!=0.0)
	{
		_X5+=_9B;
		_Y5+=_9B;
		_p5+=_9B;
		_q5+=_9B;
	}
	_59.globalAlpha=_lb;
	_59.strokeStyle=_KB;
	_59.lineWidth=yyGetReal(_eh);
	_59._ZB();
	_59.__B(_X5+0.5,_Y5+0.5);
	_59._0C(_p5+0.5,_q5+0.5);
	_59._1C();
	_59._2C();
	_59._VB(_p5,_q5,1,1);
}
;

function draw_line(_X5,_Y5,_p5,_q5)
{
	draw_line_width(_X5,_Y5,_p5,_q5,1);
}

function draw_getpixel()
{
}

function draw_getpixel_ext()
{
}

function _3C(_r4,_s4)
{
	var _4C=canvas.width/_5C;
	var _6C=canvas.height/_7C;
	var _n3=_8C(canvas,yyGetReal(_r4)*_4C,yyGetReal(_s4)*_6C);
	return _n3;
}
compile_if_used(draw_getpixel=(_r4,_s4)=>_3C(yyGetReal(_r4),yyGetReal(_s4))&0x00ffffff);
compile_if_used(draw_getpixel_ext=_3C);

function draw_triangle()
{
}

function _9C(_X5,_Y5,_p5,_q5,_8n,_9n,_MB)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_8n=yyGetReal(_8n);
	_9n=yyGetReal(_9n);
	if(_9B!=0.0)
	{
		_X5+=_9B;
		_Y5+=_9B;
		_p5+=_9B;
		_q5+=_9B;
		_8n+=_9B;
		_9n+=_9B;
	}
	_59.globalAlpha=_lb;
	_59.lineWidth=1;
	if(yyGetBool(_MB))
	{
		_59.strokeStyle=_JB;
		_59._ZB();
		_59.__B(_X5,_Y5);
		_59._0C(_p5,_q5);
		_59._0C(_8n,_9n);
		_59._0C(_X5,_Y5);
		_59._2C();
		_59._1C();
	}
	else 
	{
		_59.strokeStyle=_JB;
		_59.lineJoin="bevel";
		_59.fillStyle=_JB;
		_59._ZB();
		_59.__B(_X5,_Y5);
		_59._0C(_p5,_q5);
		_59._0C(_8n,_9n);
		_59._0C(_X5,_Y5);
		_59._aC();
		_59._2C();
		_59._1C();
		_59.lineJoin="miter";
	}
}
draw_triangle=_9C;

function draw_triangle_color()
{
}

function draw_triangle_colour()
{
}

function _bC(_X5,_Y5,_p5,_q5,_8n,_9n,_Jk,_Kk,_XB,_MB)
{
	var _cC=_LB(_ob(_Jk)|0xff000000);
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_Jk=yyGetInt32(_Jk);
	_Kk=yyGetInt32(_Kk);
	_XB=yyGetInt32(_XB);
	_MB=yyGetBool(_MB);
	if(_9B!=0.0)
	{
		_X5+=_9B;
		_Y5+=_9B;
		_p5+=_9B;
		_q5+=_9B;
		_8n+=_9B;
		_9n+=_9B;
	}
	_59.globalAlpha=_lb;
	_59.lineWidth=1;
	if(_MB)
	{
		_59.strokeStyle=_cC;
		_59._ZB();
		_59.__B(_X5,_Y5);
		_59._0C(_p5,_q5);
		_59._0C(_8n,_9n);
		_59._0C(_X5,_Y5);
		_59._2C();
		_59._1C();
	}
	else 
	{
		_59.strokeStyle=_cC;
		_59.lineJoin="bevel";
		_59.fillStyle=_cC;
		_59._ZB();
		_59.__B(_X5,_Y5);
		_59._0C(_p5,_q5);
		_59._0C(_8n,_9n);
		_59._0C(_X5,_Y5);
		_59._aC();
		_59._2C();
		_59._1C();
		_59.lineJoin="miter";
	}
}
compile_if_used(draw_triangle_color=_bC);
compile_if_used(draw_triangle_colour=_bC);

function _dC(_X5,_Y5,_p5,_q5,_Lt,_eC,_fC,_gC,_hC,_iC,_jC,_kC)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_Lt=yyGetReal(_Lt);
	_eC=yyGetInt32(_eC);
	_fC=yyGetInt32(_fC);
	_gC=yyGetInt32(_gC);
	_hC=yyGetInt32(_hC);
	_iC=yyGetInt32(_iC);
	_jC=yyGetBool(_jC);
	_kC=yyGetBool(_kC);
	var _lC;
	var _mC;
	var _nC;
	var _oC;
	var _n3;
	if(_jC)
	{
		draw_rectangle_color(_X5,_Y5,_p5,_q5,_eC,_eC,_eC,_eC,false);
		if(_kC)
		{
			draw_rectangle_color(_X5,_Y5,_p5,_q5,_pC,_pC,_pC,_pC,true);
		}
	}
	if(_Lt<0)
	{
		_Lt=0;
	}
	if(_Lt>100)
	{
		_Lt=100;
	}
	var _qC=_Lt/100;
	switch(_iC)
	{
		case 0:_lC=_X5;
		_nC=_Y5;
		_mC=_X5+_qC*(_p5-_X5);
		_oC=_q5;
		break;
		case 1:_lC=_p5-_qC*(_p5-_X5);
		_nC=_Y5;
		_mC=_p5;
		_oC=_q5;
		break;
		case 2:_lC=_X5;
		_nC=_Y5;
		_mC=_p5;
		_oC=_Y5+_qC*(_q5-_Y5);
		break;
		case 3:_lC=_X5;
		_nC=_q5-_qC*(_q5-_Y5);
		_mC=_p5;
		_oC=_q5;
		break;
		default :_lC=_X5;
		_nC=_Y5;
		_mC=_X5+_qC*(_p5-_X5);
		_oC=_q5;
		break;
	}
	if(_Lt>50)
	{
		_n3=_ky(_gC,_hC,(_Lt-50.0)/50.0);
	}
	else 
	{
		_n3=_ky(_fC,_gC,_Lt/50.0);
	}
	draw_rectangle_color(_lC,_nC,_mC,_oC,_n3,_n3,_n3,_n3,false);
	if(_kC)
	{
		draw_rectangle_color(_lC,_nC,_mC,_oC,_pC,_pC,_pC,_pC,true);
	}
}

function draw_healthbar(_X5,_Y5,_p5,_q5,_Lt,_eC,_fC,_hC,_iC,_jC,_kC)
{
	var _n3=merge_color(_fC,_hC,0.5);
	_dC(_X5,_Y5,_p5,_q5,_Lt,_eC,_fC,_n3,_hC,_iC,_jC,_kC);
}

function draw_set_circle_precision(_rC)
{
	_sC(yyGetInt32(_rC));
}

function _tC()
{
	return _uC();
}

function draw_arrow(_x5,_y5,_z5,_A5,size)
{
	_x5=yyGetReal(_x5);
	_y5=yyGetReal(_y5);
	_z5=yyGetReal(_z5);
	_A5=yyGetReal(_A5);
	size=yyGetReal(size);
	var _vC=Math.sqrt(((_z5-_x5)*(_z5-_x5))+((_A5-_y5)*(_A5-_y5)));
	if(_vC!=0)
	{
		if(size>_vC)
		{
			size=_vC;
		}
		var _O5=size*(_z5-_x5)/_vC;
		var _Q5=size*(_A5-_y5)/_vC;
		draw_line(_x5,_y5,_z5,_A5);
		draw_triangle(_z5-_O5-_Q5/3.0,_A5-_Q5+_O5/3.0,_z5,_A5,_z5-_O5+_Q5/3.0,_A5-_Q5-_O5/3.0,false);
	}
}

function draw_ellipse(_X5,_Y5,_p5,_q5,_MB)
{
	draw_ellipse_color(_X5,_Y5,_p5,_q5,_qx,_qx,_MB);
}

function draw_ellipse_color()
{
}

function draw_ellipse_colour()
{
}

function _wC(x,y,_x5,_y5,_Jk,_Kk,_xC)
{
	x=yyGetReal(x);
	y=yyGetReal(y);
	_x5=yyGetReal(_x5);
	_y5=yyGetReal(_y5);
	_Jk=yyGetInt32(_Jk);
	_Kk=yyGetInt32(_Kk);
	_xC=yyGetBool(_xC);
	if(_9B!=0.0)
	{
		x+=_9B;
		y+=_9B;
		_x5+=_9B;
		_y5+=_9B;
	}
	var w=_x5-x;
	var h=_y5-y;
	var _yC=0.5522848;
	var _zC=(w/2)*_yC;
	var _AC=(h/2)*_yC;
	var _BC=x+w;
	var _CC=y+h;
	var _DC=x+w/2;
	var _EC=y+h/2;
	_59.beginPath();
	_59.moveTo(x,_EC);
	_59.bezierCurveTo(x,_EC-_AC,_DC-_zC,y,_DC,y);
	_59.bezierCurveTo(_DC+_zC,y,_BC,_EC-_AC,_BC,_EC);
	_59.bezierCurveTo(_BC,_EC+_AC,_DC+_zC,_CC,_DC,_CC);
	_59.bezierCurveTo(_DC-_zC,_CC,x,_EC+_AC,x,_EC);
	_59.closePath();
	var _cC=_Gk(_ob(_Jk),1.0);
	var _FC=_Gk(_ob(_Kk),1.0);
	if(w<=0)w*=-1;
	if(h<=0)h*=-1;
	var _GC=_59.createRadialGradient(_DC,_EC,0,_DC,_EC,min(w/2,h/2));
	_GC.addColorStop(0,_cC);
	_GC.addColorStop(1,_FC);
	_59.globalAlpha=_lb;
	if(_xC)
	{
		_59.lineWidth=1;
		_59.strokeStyle=_GC;
		_59.stroke();
	}
	else 
	{
		_59.fillStyle=_GC;
		_59.fill();
	}
}
draw_ellipse_color=_wC;
compile_if_used(draw_ellipse_colour=_wC);

function draw_circle_color()
{
}

function draw_circle_colour()
{
}

function _HC(_r4,_s4,_Dh,_Jk,_Kk,_MB)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_Dh=yyGetReal(_Dh);
	_Jk=yyGetInt32(_Jk);
	_Kk=yyGetInt32(_Kk);
	_MB=yyGetBool(_MB);
	if(_9B!=0.0)
	{
		_r4+=_9B;
		_s4+=_9B;
	}
	_59.globalAlpha=_lb;
	var _cC=_Gk(_ob(_Jk),1.0);
	var _FC=_Gk(_ob(_Kk),1.0);
	var _GC=_59.createRadialGradient(_r4,_s4,0,_r4,_s4,_Dh);
	_GC.addColorStop(0,_cC);
	_GC.addColorStop(1,_FC);
	_59._ZB();
	if(_MB)
	{
		_59.lineWidth=1;
		_59.strokeStyle=_GC;
		_59._IC(_r4,_s4,_Dh,0,Math.PI*2,true);
		_59._2C();
	}
	else 
	{
		_59.fillStyle=_GC;
		_59._IC(_r4,_s4,_Dh,0,Math.PI*2,false);
		_59._aC();
	}
	_59._1C();
}
draw_circle_color=_HC;
compile_if_used(draw_circle_colour=_HC);

function draw_circle(_r4,_s4,_Dh,_MB)
{
	draw_circle_color(_r4,_s4,_Dh,_qx,_qx,_MB);
}

function draw_point_color()
{
}
;

function draw_point_colour()
{
}
;

function _JC(_r4,_s4,_ec)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	if(_9B!=0.0)
	{
		_r4+=_9B;
		_s4+=_9B;
	}
	var _cC=_Gk(_ob(yyGetInt32(_ec)),1.0);
	_59.globalAlpha=_lb;
	_59.fillStyle=_cC;
	_59._VB(_r4,_s4,1,1);
}
compile_if_used(draw_point_color=_JC);
compile_if_used(draw_point_colour=_JC);

function draw_line_width_color()
{
}

function draw_line_width_colour()
{
}

function _KC(_X5,_Y5,_p5,_q5,_eh,_Jk,_Kk)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_eh=yyGetReal(_eh);
	_Jk=yyGetInt32(_Jk);
	_Kk=yyGetInt32(_Kk);
	if(_9B!=0.0)
	{
		_X5+=_9B;
		_Y5+=_9B;
		_p5+=_9B;
		_q5+=_9B;
	}
	_59.globalAlpha=_lb;
	var _cC=_Gk(_ob(_Jk),1.0);
	var _FC=_Gk(_ob(_Kk),1.0);
	var _GC=_59.createLinearGradient(_X5,_Y5,_p5,_q5);
	_GC.addColorStop(0,_cC);
	_GC.addColorStop(1,_FC);
	_59.strokeStyle=_GC;
	_59._ZB();
	_59.__B(_X5+0.5,_Y5+0.5);
	_59._0C(_p5+0.5,_q5+0.5);
	_59.lineWidth=_eh;
	_59._2C();
	_59._1C();
}
draw_line_width_color=_KC;
compile_if_used(draw_line_width_colour=_KC);

function draw_line_color(_X5,_Y5,_p5,_q5,_Jk,_Kk)
{
	draw_line_width_color(_X5,_Y5,_p5,_q5,1,_Jk,_Kk);
}
var draw_line_colour=draw_line_color;

function draw_button(_X5,_Y5,_p5,_q5,_LC)
{
	if(_9B!=0.0)
	{
		_X5+=_9B;
		_Y5+=_9B;
		_p5+=_9B;
		_q5+=_9B;
	}
	if(_LC)
	{
		draw_line_width_color(_X5,_Y5,_p5,_Y5,2,0xffffff,0xffffff);
		draw_line_width_color(_X5,_Y5,_X5,_q5,2,0xffffff,0xffffff);
		draw_line_width_color(_p5,_Y5,_p5,_q5,2,0x404040,0x404040);
		draw_line_width_color(_p5,_q5,_X5,_q5,2,0x404040,0x404040);
	}
	else 
	{
		draw_line_width_color(_X5,_Y5,_p5,_Y5,2,0x404040,0x404040);
		draw_line_width_color(_X5,_Y5,_X5,_q5,2,0x404040,0x404040);
		draw_line_width_color(_p5,_Y5,_p5,_q5,2,0xffffff,0xffffff);
		draw_line_width_color(_p5,_q5,_X5,_q5,2,0xffffff,0xffffff);
	}
	draw_rectangle_color(_X5,_Y5,_p5,_q5,_qx,_qx,_qx,_qx,false);
}

function _MC(_NC)
{
	switch(_NC)
	{
		case 1:_OC(_Is,_Ks);
		break;
		case 2:_OC(_Is,_Ls);
		break;
		case 3:_OC(_Ms,_Ls);
		break;
		default :_OC(_Is,_Js);
		break;
	}
}

function _OC(src,_f9)
{
	_0b("Blend modes only available in WebGL mode.");
}

function draw_texture_flush()
{
	if(_i7==null)return;
	_PC();
}

function draw_enable_drawevent(_QC)
{
	_RC=yyGetBool(_QC);
}

function skeleton_animation_set(_g6,_O2,_P2=true)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_SC._n2(yyGetString(_O2),_P2);
		_g6.image_index=0;
		_g6._TC=0;
		_SC._J2(0,0);
	}
}

function skeleton_animation_mix(_g6,_UC,_VC,_23)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_SC.__2(yyGetString(_UC),yyGetString(_VC),yyGetReal(_23));
	}
}

function skeleton_animation_set_ext(_g6,_I6,_s2,_P2=true)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_s2=yyGetInt32(_s2);
		_SC._Q2(yyGetString(_I6),_s2,_P2);
		if(_s2==0)
		{
			_g6.image_index=0;
			_g6._TC=0;
			_SC._J2(0,0);
		}
	}
}

function skeleton_animation_get_ext(_g6,_s2)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._B6(yyGetInt32(_s2));
	}
	return "";
}

function skeleton_attachment_set(_g6,_WC,_XC)
{
	_WC=yyGetString(_WC);
	var _SC=_g6._68();
	if(_SC)
	{
		if(typeof(_XC)=="string")
		{
			_SC._43(_WC,_XC);
		}
		else 
		{
			_XC=yyGetInt32(_XC);
			if(sprite_exists(_XC))
			{
				var _1w=_E4._F4(_XC);
				if(_SC._p3(_WC,_1w.pName)===undefined)
				{
					_SC._s3(_1w.pName,_1w,0,_1w.xOrigin,_1w.yOrigin,1,1,0,undefined,0xffffffff,1.0,false);
				}
				_SC._43(_WC,_1w.pName);
			}
			else 
			{
				_SC._43(_WC,-1);
			}
		}
	}
}

function skeleton_attachment_get(_g6,_WC)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._S6(yyGetString(_WC));
	}
	return "";
}

function skeleton_attachment_create(_g6,_O2,_r2,_u3,_v3,_w3,_x3,_y3,_z3)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_u3=yyGetInt32(_u3);
		if(sprite_exists(_r2)&&(_u3>=0))
		{
			var _1w=_E4._F4(_r2);
			if((_1w._YC!=undefined)||(_1w._ZC!=undefined))
			{
				console.log("ERROR: Sprite '"+_1w.pName+"' is not valid for use as an attachment (must be a bitmap)\n");
				return -1.0;
			}
			_SC._s3(yyGetString(_O2),_1w,_u3,yyGetReal(_v3),yyGetReal(_w3),yyGetReal(_x3),yyGetReal(_y3),yyGetReal(_z3),undefined,undefined,undefined,false);
			return 1.0;
		}
	}
	return -1.0;
}

function skeleton_attachment_create_colour(_g6,_O2,_r2,_u3,_v3,_w3,_x3,_y3,_z3,_ec,_y8)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_u3=yyGetInt32(_u3);
		if(sprite_exists(_r2)&&(_u3>=0))
		{
			var _1w=_E4._F4(_r2);
			if((_1w._YC!=undefined)||(_1w._ZC!=undefined))
			{
				console.log("ERROR: Sprite '"+_1w.pName+"' is not valid for use as an attachment (must be a bitmap)\n");
				return -1.0;
			}
			_SC._s3(yyGetString(_O2),_1w,_u3,yyGetReal(_v3),yyGetReal(_w3),yyGetReal(_x3),yyGetReal(_y3),yyGetReal(_z3),undefined,yyGetInt32(_ec),yyGetReal(_y8),false);
			return 1.0;
		}
	}
	return -1.0;
}

function skeleton_attachment_create_color(_g6,_O2,_r2,_u3,_v3,_w3,_x3,_y3,_z3,_ec,_y8)
{
	skeleton_attachment_create_colour(_g6,_O2,_r2,_u3,_v3,_w3,_x3,_y3,_z3,_ec,_y8);
}

function skeleton_attachment_replace(_g6,_O2,_r2,_u3,_v3,_w3,_x3,_y3,_z3)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_u3=yyGetInt32(_u3);
		if(sprite_exists(_r2)&&(_u3>=0))
		{
			var _1w=_E4._F4(_r2);
			if((_1w._YC!=undefined)||(_1w._ZC!=undefined))
			{
				console.log("ERROR: Sprite '"+_1w.pName+"' is not valid for use as an attachment (must be a bitmap)\n");
				return -1.0;
			}
			_SC._s3(yyGetString(_O2),_1w,_u3,yyGetReal(_v3),yyGetReal(_w3),yyGetReal(_x3),yyGetReal(_y3),yyGetReal(_z3),undefined,undefined,undefined,true);
			return 1.0;
		}
	}
	return -1.0;
}

function skeleton_attachment_replace_colour(_g6,_O2,_r2,_u3,_v3,_w3,_x3,_y3,_z3,_ec,_y8)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_u3=yyGetInt32(_u3);
		if(sprite_exists(_r2)&&(_u3>=0))
		{
			var _1w=_E4._F4(_r2);
			if((_1w._YC!=undefined)||(_1w._ZC!=undefined))
			{
				console.log("ERROR: Sprite '"+_1w.pName+"' is not valid for use as an attachment (must be a bitmap)\n");
				return -1.0;
			}
			_SC._s3(yyGetString(_O2),_1w,_u3,yyGetReal(_v3),yyGetReal(_w3),yyGetReal(_x3),yyGetReal(_y3),yyGetReal(_z3),undefined,yyGetInt32(_ec),yyGetReal(_y8),true);
			return 1.0;
		}
	}
	return -1.0;
}

function skeleton_attachment_destroy(_g6,_O2)
{
	var name=yyGetString(_O2);
	var _SC=_g6._68();
	if(_SC)
	{
		var __C=_SC._m4(name);
		if(!__C)
		{
			console.log("skeleton_attachment_destroy: Attempted to destroy non-existant attachment '"+name+"'");
		}
	}
}

function skeleton_attachment_exists(_g6,_O2)
{
	var name=yyGetString(_O2);
	var _SC=_g6._68();
	if(_SC)
	{
		var __C=(_SC._p3(null,name,true)!==undefined);
		return __C;
	}
}

function skeleton_attachment_replace_color(_g6,_O2,_r2,_u3,_v3,_w3,_x3,_y3,_z3,_ec,_y8)
{
	skeleton_attachment_replace_colour(_g6,_O2,_r2,_u3,_v3,_w3,_x3,_y3,_z3,_ec,_y8);
}

function skeleton_slot_colour_set(_g6,_WC,_ec,_y8)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_WC=yyGetString(_WC);
		_SC._d3(_WC,yyGetInt32(_ec));
		_SC._k3(_WC,yyGetReal(_y8));
	}
}

function skeleton_slot_color_set(_g6,_WC,_ec,_y8)
{
	skeleton_slot_colour_set(_g6,_WC,_ec,_y8);
}

function skeleton_slot_colour_get(_g6,_WC)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._m3(yyGetString(_WC));
	}
	return 0xffffffff;
}

function skeleton_slot_color_get(_g6,_WC)
{
	return skeleton_slot_colour_get(_g6,_WC);
}

function skeleton_slot_alpha_get(_g6,_WC)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._o3(yyGetString(_WC));
	}
	return 1.0;
}

function skeleton_skin_set(_g6,_O2)
{
	var _SC=_g6._68();
	if(_SC)
	{
		if(_O2.__type=="[SkeletonSkin]")
		{
			_SC._o2(_O2);
		}
		else 
		{
			_SC._o2(yyGetString(_O2));
		}
	}
}

function skeleton_skin_get(_g6)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._s6();
	}
	return "";
}

function skeleton_skin_create(_g6,_O2,_0D)
{
	var name=yyGetString(_O2);
	if(!Array.isArray(_0D))
	{
		_I3("skeleton_skin_create argument 2 incorrect type (expecting an Array)");
	}
	var _1D=[];
	for(var i=0;i<_0D.length;++i)
	{
		_1D.push(yyGetString(_0D[i]));
	}
	var _SC=_g6._68();
	if(_SC)
	{
		var _v6=_SC._t6(name,_1D);
		return _v6;
	}
}

function skeleton_animation_get(_g6)
{
	return skeleton_animation_get_ext(_g6,0);
}

function skeleton_animation_get_duration(_g6,__7)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._H6(yyGetString(__7));
	}
	return 0.0;
}

function skeleton_animation_get_frames(_g6,__7)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._J6(yyGetString(__7));
	}
	return 0.0;
}

function skeleton_animation_get_frame(_g6,_s2)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._G2(yyGetInt32(_s2));
	}
	return 0;
}

function skeleton_animation_set_frame(_g6,_s2,_K2)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_SC._J2(yyGetInt32(_s2),yyGetInt32(_K2));
	}
}

function skeleton_animation_get_position(_g6,_s2)
{
	var _N2=yyGetInt32(_s2);
	var _SC=_g6._68();
	if(_SC)
	{
		var _2D=_SC._q2(undefined,_N2);
		var _3D=_SC._G2(_N2);
		if(_2D!=0)
		{
			var _4D=_3D/_2D;
			if(_4D<0.0)_4D=0.0;
			if(_4D>1.0)_4D=1.0;
			return _4D;
		}
	}
	return -1;
}

function skeleton_animation_set_position(_g6,_s2,_5D)
{
	var _N2=yyGetInt32(_s2);
	var _4D=yyGetReal(_5D);
	if(_4D>=1.0||_4D<=1.0)
	{
		_4D-=Math.floor(_4D/1.0);
	}
	if(_4D<0.0)
	{
		_4D=1.0+_4D;
	}
	var _SC=_g6._68();
	if(_SC)
	{
		var _2D=_SC._q2(undefined,_N2);
		if(_2D!=0)
		{
			var _6D=Math.floor(_4D*_2D);
			if(_6D<0)_6D=0;
			if(_6D>=_2D)_6D=_2D-1;
			_SC._J2(_N2,_6D);
		}
	}
}

function skeleton_animation_get_event_frames(_g6,_I6,_f2)
{
	var frames=[];
	var _SC=_g6._68();
	if(_SC)
	{
		var _7D=_SC._K6(_I6,_f2);
		if(_7D==null)
		{
			frames.push(-1);
		}
		else 
		{
			frames=_7D;
		}
	}
	else 
	{
		frames.push(-1);
	}
	return frames;
}

function skeleton_animation_clear(_g6,_s2,_D6,_E6)
{
	if(_D6===undefined)
	{
		_D6=false;
	}
	else 
	{
		_D6=yyGetBool(_D6);
	}
	if(_E6===undefined)
	{
		_E6=0.0;
	}
	else 
	{
		_E6=yyGetReal(_E6);
	}
	var _SC=_g6._68();
	if(_SC)
	{
		_SC._C6(yyGetInt32(_s2),_D6,_E6);
	}
}

function skeleton_animation_is_looping(_g6,_s2)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._L2(yyGetInt32(_s2));
	}
	return false;
}

function skeleton_animation_is_finished(_g6,_s2)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._M2(yyGetInt32(_s2));
	}
	return false;
}

function skeleton_collision_draw_set(_g6,_C2)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_SC._p4(yyGetReal(_C2)>0.5?true:false);
	}
}

function skeleton_bone_data_get(_g6,_96,_a6)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_SC._86(yyGetString(_96),yyGetInt32(_a6));
	}
}

function skeleton_bone_data_set(_g6,_96,_a6)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_SC._e6(yyGetString(_96),yyGetInt32(_a6));
	}
}

function skeleton_bone_state_get(_g6,_96,_a6)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_SC._f6(_g6,yyGetString(_96),yyGetInt32(_a6));
	}
}

function skeleton_bone_state_set(_g6,_96,_a6)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_SC._p6(_g6,yyGetString(_96),yyGetInt32(_a6));
	}
}

function draw_skeleton(_r2,_8D,_9D,_aD,_r4,_s4,_7l,_8l,_z3,_nb,_y8)
{
	var _1w=_E4._F4(yyGetInt32(_r2));
	if(_1w!=null&&_1w!=undefined)
	{
		if(_1w._ZC)
		{
			_1w._ZC._Z7(yyGetString(_8D),yyGetString(_9D),yyGetInt32(_aD),yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_7l),yyGetReal(_8l),yyGetReal(_z3),yyGetInt32(_nb),yyGetReal(_y8));
		}
	}
}

function draw_skeleton_time(_r2,_8D,_9D,_a5,_r4,_s4,_7l,_8l,_z3,_nb,_y8)
{
	var _1w=_E4._F4(yyGetInt32(_r2));
	if(_1w!=null&&_1w!=undefined)
	{
		if(_1w._ZC)
		{
			_1w._ZC._48(yyGetString(_8D),yyGetString(_9D),yyGetReal(_a5),yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_7l),yyGetReal(_8l),yyGetReal(_z3),yyGetInt32(_nb),yyGetReal(_y8));
		}
	}
}

function draw_skeleton_instance(_97,_8D,_9D,_aD,_r4,_s4,_7l,_8l,_z3,_nb,_y8)
{
	var _rm=_Sv._F4(_97);
	var _SC=_rm._68();
	if(_SC)
	{
		var _1w=_E4._F4(_rm.sprite_index);
		_1w._ZC._Z7(yyGetString(_8D),yyGetString(_9D),yyGetInt32(_aD),yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_7l),yyGetReal(_8l),yyGetReal(_z3),yyGetInt32(_nb),yyGetReal(_y8));
	}
}

function draw_skeleton_collision(_r2,_8D,_aD,_r4,_s4,_7l,_8l,_z3,_nb)
{
	var _1w=_E4._F4(yyGetInt32(_r2));
	if(_1w!=null&&_1w!=undefined)
	{
		if(_1w._ZC)
		{
			_1w._ZC._n8(yyGetString(_8D),yyGetInt32(_aD),yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_7l),yyGetReal(_8l),yyGetReal(_z3),yyGetInt32(_nb),_1w);
		}
	}
}

function draw_enable_skeleton_blendmodes(_Np)
{
	_X6=yyGetBool(_Np);
}

function draw_get_enable_skeleton_blendmodes()
{
	return _X6;
}

function skeleton_animation_list(_r2,_U6)
{
	var _1w=_E4._F4(yyGetInt32(_r2));
	if(_1w!=null&&_1w!=undefined)
	{
		if(_1w._ZC)
		{
			_1w._ZC._Ca(yyGetInt32(_U6));
		}
	}
}
;

function skeleton_skin_list(_r2,_U6)
{
	var _1w=_E4._F4(yyGetInt32(_r2));
	if(_1w!=null&&_1w!=undefined)
	{
		if(_1w._ZC)
		{
			_1w._ZC._Da(yyGetInt32(_U6));
		}
	}
}
;

function skeleton_bone_list(_r2,_U6)
{
	var _1w=_E4._F4(yyGetInt32(_r2));
	if(_1w!=null&&_1w!=undefined)
	{
		if(_1w._ZC)
		{
			_1w._ZC._Ea(yyGetInt32(_U6));
		}
	}
}
;

function skeleton_slot_list(_r2,_U6)
{
	var _1w=_E4._F4(yyGetInt32(_r2));
	if(_1w!=null&&_1w!=undefined)
	{
		if(_1w._ZC)
		{
			_1w._ZC._Fa(yyGetInt32(_U6));
		}
	}
}
;

function skeleton_slot_data(_r2,_U6)
{
	var _1w=_E4._F4(yyGetInt32(_r2));
	if(_1w!=null&&_1w!=undefined)
	{
		if(_1w._ZC)
		{
			_1w._ZC._T6(yyGetInt32(_U6));
			return 1;
		}
	}
	return -1;
}
;

function skeleton_slot_data_instance(_g6,_U6)
{
	var _SC=_g6._68();
	if(_SC)
	{
		_SC._T6(yyGetInt32(_U6));
		return 1;
	}
	return -1;
}
;

function _bD(_g6,_s2)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._G2(_s2);
	}
	return 0.0;
}
;

function skeleton_get_minmax(_g6)
{
	var _SC=_g6._68();
	if(_SC)
	{
		var rect=new _Lv(0,0,0,0);
		if(_SC._g5(rect))
		{
			var _l5=[];
			_l5.push(rect.left,rect.top,rect.right,rect.bottom);
			return _l5;
		}
	}
	var _l5=[];
	_l5.push(0.0,0.0,0.0,0.0);
	return _l5;
}
;

function skeleton_get_num_bounds(_g6)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._h5();
	}
	return 0.0;
}
;

function skeleton_get_bounds(_g6,_K2)
{
	var _SC=_g6._68();
	if(_SC)
	{
		return _SC._i5(yyGetInt32(_K2));
	}
	var _l5=[];
	_l5.push(0,"");
	return _l5;
}
;

function skeleton_find_slot(_g6,_r4,_s4,_U6)
{
	var _SC=_g6._68();
	if(_SC)
	{
		var _1w=_E4._F4(_g6.sprite_index);
		if(_1w!=null&&_1w!=undefined)
		{
			if(_1w._ZC)
			{
				_1w._cD(_g6,yyGetReal(_r4),yyGetReal(_s4),yyGetInt32(_U6));
			}
		}
	}
}

function draw_enable_swf_aa(_dD)
{
	_eD=yyGetBool(_dD);
}
;

function draw_set_swf_aa_level(_fD)
{
	_gD=yyGetReal(_fD);
}
;

function draw_get_swf_aa_level()
{
	return _gD;
}
;

function _hD(xview,yview,wview,hview,angle)
{
	if(Math.abs(angle)<0.001)
	{
		_iD.left=xview;
		_iD.top=yview;
		_iD.right=xview+wview;
		_iD.bottom=yview+hview;
	}
	else 
	{
		var _kn=angle*(Math.PI/180.0);
		var _hg=Math.abs(sin(_kn));
		var c=Math.abs(cos(_kn));
		var _5i=(c*wview)+(_hg*hview);
		var _jD=(_hg*wview)+(c*hview);
		_iD.left=(xview+(wview-_5i)/2);
		_iD.right=(xview+(wview+_5i)/2);
		_iD.top=(yview+(hview-_jD)/2);
		_iD.bottom=(yview+(hview+_jD)/2);
	}
}
;

function _xq(_kD,_lD,_mD,_nD)
{
	var _oD=(_lD._w5[11]==0);
	if(_oD)
	{
		if(_mD===undefined)
		{
			_mD=new _Gp();
			_mD._pD(_kD);
		}
		if(_nD===undefined)
		{
			var _qD=new _Gp();
			_qD.Multiply(_kD,_lD);
			_nD=new _Gp();
			_nD._pD(_qD);
		}
		var _rD=new _Up();
		_rD._5q=_mD._w5[_5r];
		_rD._6q=_mD._w5[_8r];
		_rD._7q=_mD._w5[_dr];
		var _sD,_tD,_uD,_vD;
		_sD=_nD._wD(new _Up(-1.0,0.0,0.0));
		_tD=_nD._wD(new _Up(1.0,0.0,0.0));
		_uD=_nD._wD(new _Up(0.0,1.0,0.0));
		_vD=_nD._wD(new _Up(0.0,-1.0,0.0));
		var _xD=_tD._yD(_sD);
		var _zD=_uD._yD(_vD);
		_AD=_xD.Length();
		_BD=_zD.Length();
		_CD=_rD._5q-(_AD*0.5);
		_DD=_rD._6q-(_BD*0.5);
		var _ED=_zD;
		_ED._2q();
		var angle=Math.acos(_ED._6q);
		if(_ED._5q<0.0)
		{
			angle=(2.0*Math.PI)-angle;
		}
		var _FD=(angle/(2.0*Math.PI))*360.0;
		_hD(_CD,_DD,_AD,_BD,_FD);
	}
	else 
	{
		_CD=0;
		_DD=0;
		_AD=_u2!=null?_u2._GD():1;
		_BD=_u2!=null?_u2._HD():1;
		_hD(_CD,_DD,_AD,_BD,0);
	}
}

function _ID()
{
	if(_JD)
	{
		var _KD=new _Gp();
		_KD.Multiply(_mq[_pq],_mq[_tq]);
		_LD._MD(_KD);
		_JD=false;
	}
	return _LD;
}

function _ND()
{
	_OD=true;
}
;

function _PD()
{
	if(_OD)
	{
		var _QD=new _Gp();
		_QD._pD(_mq[_RD]);
		var _Z9=[];
		var __9=[];
		_Z9[0]=_iD.left;
		_Z9[1]=_iD.right;
		_Z9[2]=_iD.right;
		_Z9[3]=_iD.left;
		__9[0]=_iD.top;
		__9[1]=_iD.top;
		__9[2]=_iD.bottom;
		__9[3]=_iD.bottom;
		_SD.left=Number.MAX_SAFE_INTEGER;
		_SD.top=Number.MAX_SAFE_INTEGER;
		_SD.right=Number.MIN_SAFE_INTEGER;
		_SD.bottom=Number.MIN_SAFE_INTEGER;
		for(var i=0;i<4;i++)
		{
			var _TD=((_Z9[i]*_QD._w5[0])+(__9[i]*_QD._w5[4])+_QD._w5[12]);
			var _UD=((_Z9[i]*_QD._w5[1])+(__9[i]*_QD._w5[5])+_QD._w5[13]);
			_SD.left=_J5(_SD.left,_TD);
			_SD.top=_J5(_SD.top,_UD);
			_SD.right=_I5(_SD.right,_TD);
			_SD.bottom=_I5(_SD.bottom,_UD);
		}
		_OD=false;
	}
}
;

function view_get_camera(_Tp)
{
	return g_pBuiltIn.view_camera[yyGetInt32(_Tp)];
}
;

function view_get_visible(_Tp)
{
	return g_pBuiltIn.view_visible[yyGetInt32(_Tp)];
}
;

function view_get_xport(_Tp)
{
	return g_pBuiltIn.view_xport[yyGetInt32(_Tp)];
}
;

function view_get_yport(_Tp)
{
	return g_pBuiltIn.view_yport[yyGetInt32(_Tp)];
}
;

function view_get_wport(_Tp)
{
	return g_pBuiltIn.view_wport[yyGetInt32(_Tp)];
}
;

function view_get_hport(_Tp)
{
	return g_pBuiltIn.view_hport[yyGetInt32(_Tp)];
}
;

function view_get_surface_id(_Tp)
{
	return g_pBuiltIn.view_surface_id[yyGetInt32(_Tp)];
}
;

function view_set_camera(_Tp,_VD)
{
	g_pBuiltIn.view_camera[yyGetInt32(_Tp)]=yyGetInt32(_VD);
}
;

function view_set_visible(_Tp,visible)
{
	g_pBuiltIn.view_visible[yyGetInt32(_Tp)]=yyGetInt32(visible);
}
;

function view_set_xport(_Tp,xport)
{
	g_pBuiltIn.view_xport[yyGetInt32(_Tp)]=yyGetInt32(xport);
}
;

function view_set_yport(_Tp,yport)
{
	g_pBuiltIn.view_yport[yyGetInt32(_Tp)]=yyGetInt32(yport);
}
;

function view_set_wport(_Tp,wport)
{
	g_pBuiltIn.view_wport[yyGetInt32(_Tp)]=yyGetInt32(wport);
}
;

function view_set_hport(_Tp,hport)
{
	g_pBuiltIn.view_hport[yyGetInt32(_Tp)]=yyGetInt32(hport);
}
;

function view_set_surface_id(_Tp,_WD)
{
	g_pBuiltIn.view_surface_id[yyGetInt32(_Tp)]=yyGetInt32(_WD);
}
;

function _XD()
{
	return 0;
}
;

function _YD()
{
	return 0;
}
;

function _ZD()
{
}
;

function display_set_windows_alternate_sync()
{
}
;

function display_set_ui_visibility()
{
}
;

function display_set_sleep_margin()
{
}

function display_get_sleep_margin()
{
	return 0;
}

function __D(_0E,_1E)
{
	if((_0E.status<200)||(_0E.status>=300))
	{
		_1E._fe=_2E;
	}
	else 
	{
		_1E._fe=_3E;
	}
	try
	{
		_1E._4E=_0E.responseText;
	}
	catch(e)
	{
		_1E._4E="";
	}
}

function _5E(_0E,_6E)
{
	if(_0E.readyState!=4)return;
	var _ae=_nv(_0E);
	if(_ae)
	{
		_ae._7E=_0E.status;
		_ae._ge=true;
		_ae._8E=ds_map_create();
		var _9E=_0E.getAllResponseHeaders().split("\r\n");
		for(var _u5 in _9E)
		{
			if(!_9E.hasOwnProperty(_u5))continue;
			var _aE=_9E[_u5].split(": ");
			if(_aE.length==2)
			{
				ds_map_add(_ae._8E,_aE[0],_aE[1]);
			}
		}
		if(_6E)
		{
			_6E(_0E,_ae);
		}
	}
}

function _bE(_cE)
{
	var _dE=
	{
	}
	;
	_be._ce(_eE,_cE,_fE,_dE);
	setTimeout(
function()
	{
		var _ae=_nv(_dE);
		if(_ae)
		{
			_ae._7E=404;
			_ae._ge=true;
			_ae._fe=_2E;
			_ae._4E="";
		}
	}
	,500);
	return _eE++;
}

function _gE(_Ob,_cE,_hE,_Pl,_6E,_iE)
{
	try
	{
		var _jE=_kE(_cE,_hE);
		_be._ce(_eE,_cE,_fE,_jE._lE);
		if(_iE!==undefined)
		{
			_jE._lE.responseType=_iE;
		}
		if(_jE._mE)
		{
			_nE(_Ob,_cE,_hE,_Pl,_jE._lE,_jE._oE,_6E);
		}
		else 
		{
			_pE(_Ob,_cE,_hE,_Pl,_jE._lE,_6E);
		}
	}
	catch(e)
	{
		return _bE(_cE);
	}
	return _eE++;
}

function _kE(_cE,_hE)
{
	var _jE=
	{
		_lE:null,_oE:true,_mE:false	}
	;
	if((_cE.substring(0,7)!="http://")&&(_cE.substring(0,8)!="https://"))
	{
		_jE._oE=false;
	}
	else 
	{
		var _qE="";
		if(_cE.substring(0,7)=="http://")
		{
			_qE=_cE.substring(7);
		}
		if(_cE.substring(0,8)=="https://")
		{
			_qE=_cE.substring(8);
		}
		if(_qE.substring(0,document.domain.length)==document.domain)
		{
			_jE._oE=false;
		}
	}
	if((_jE._oE)&&(window.XDomainRequest))
	{
		_jE._lE=new XDomainRequest();
		_jE._oE=true;
		_jE._mE=true;
	}
	else 
	{
		if(window.XMLHttpRequest)
		{
			_jE._lE=new XMLHttpRequest();
			_jE._oE=false;
			_jE._mE=(_rE==_sE)&&(_tE._uE<=9.0);
		}
		else if(window.ActiveXObject)
		{
			if(new ActiveXObject("Microsoft.XMLHTTP"))
			{
				_jE._lE=new ActiveXObject("Microsoft.XMLHTTP");
			}
			else 
			{
				_jE._lE=new ActiveXObject("Msxml2.XMLHTTP");
			}
		}
		if(_vE==="use-credentials")
		{
			_jE._lE._wE=true;
		}
	}
	return _jE;
}

function _pE(_Ob,_cE,_hE,_Pl,_0E,_6E)
{
	try
	{
		_0E.open(_Ob,_cE,true);
		if(_hE!==null)
		{
			for(var _aE in _hE)
			{
				if(!_hE.hasOwnProperty(_aE))continue;
				try
				{
					_0E.setRequestHeader(_hE[_aE].key,_hE[_aE].value);
				}
				catch(e)
				{
					debug("Unable to set request header "+_hE[_aE].key+":"+_hE[_aE].value+" "+e.message);
				}
			}
		}
		else if(_Ob=="POST")
		{
			_0E.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		}
		_0E.onreadystatechange=
function()
		{
			_5E(_0E,_6E);
		}
		;
		_0E.send(_Pl);
	}
	catch(e)
	{
		debug(e.message);
	}
}

function _nE(_Ob,_cE,_hE,_Pl,_0E,_xE,_6E)
{
	_0E.open(_Ob,_cE);
	_0E.ontimeout=
function(_f2)
	{
		_yE(_f2,_0E);
	}
	;
	_0E.onerror=
function(_f2)
	{
		_yE(_f2,_0E);
	}
	;
	if(_xE)
	{
		_0E.onload=
function(_f2)
		{
			_zE(_f2,_0E,200);
		}
		;
	}
	else 
	{
		_0E.onload=
function(_f2)
		{
		}
		;
		_0E.onreadystatechange=
function()
		{
			if(_0E.readyState==4)
			{
				_zE(null,_0E,_0E.status);
			}
		}
		;
	}
	if(_hE!==null)
	{
		for(var _aE in _hE)
		{
			if(!_hE.hasOwnProperty(_aE))continue;
			try
			{
				_0E.setRequestHeader(_hE[_aE].key,_hE[_aE].value);
			}
			catch(e)
			{
				debug("Unable to set request header "+_hE[_aE].key+":"+_hE[_aE].value+" "+e.message);
			}
		}
	}
	_0E._AE=
function()
	{
	}
	;
	_0E.send(_Pl);
}

function _zE(_f2,_0E,_BE)
{
	var _ae=_nv(_0E);
	if(_ae)
	{
		_ae._ge=true;
		if((_BE>=200)&&(_BE<300))
		{
			_ae._fe=_3E;
			_ae._7E=_BE;
		}
		else 
		{
			_ae._fe=_2E;
			_ae._7E=404;
		}
		_ae._4E=_0E.responseText;
		_ae._8E=-1;
	}
}

function _yE(_f2,_0E)
{
	var _ae=_nv(_0E);
	if(_ae)
	{
		_ae._ge=true;
		_ae._fe=_2E;
		_ae._4E="";
		_ae._7E=404;
		_ae._8E=-1;
	}
}

function http_get(_cE)
{
	return _gE("GET",yyGetString(_cE),null,"",__D);
}

function http_get_file(_cE,_CE)
{
	_CE=yyGetString(_CE);
	var _DE=
function(_0E,_1E)
	{
		if(_0E.response)
		{
			try
			{
				var _EE=String.fromCharCode.apply(null,new Uint8Array(_0E.response));
				_nj(_CE,_EE);
				_1E._fe=_3E;
				_1E._4E=_CE;
			}
			catch(e)
			{
				debug(e.message);
				_1E._fe=_2E;
			}
		}
		else 
		{
			_1E._fe=_2E;
		}
	}
	;
	return _gE("GET",yyGetString(_cE),null,"",_DE,'arraybuffer');
}

function http_post_string(_cE,_Lw)
{
	if(!_Lw)
	{
		_Lw="";
	}
	else 
	{
		_Lw=yyGetString(_Lw);
	}
	return _gE('POST',yyGetString(_cE),null,_Lw,__D);
}

function http_request(_cE,_7y,_FE,_GE)
{
	_cE=yyGetString(_cE);
	_7y=yyGetString(_7y);
	_FE=yyGetInt32(_FE);
	var _HE=[];
	var _c6=_d6._F4(_FE);
	if(_c6!==null)
	{
		for(const [key,_fj] of _c6)
		{
			var _Z3=key;
			if(_c6._9j&&_c6._9j.has(key))_Z3=_c6._9j.get(key);
			_HE.push(
			{
				key:_Z3,value:_fj			}
			);
		}
	}
	if(typeof(_GE)==='number')
	{
		return _IE(_cE,_7y,_HE,_GE);
	}
	else 
	{
		if(!_GE)
		{
			_GE="";
		}
		return _gE(_7y,_cE,_HE,_GE,__D);
	}
}

function _IE(_cE,_7y,_hE,_GE)
{
	var _G9=_JE._F4(_GE);
	if(!_G9)
	{
		return _bE(_cE);
	}
	else if(_G9._KE!=0)
	{
		var _LE=new Uint8Array(_G9._ME,0,_G9._KE);
		return _gE(_7y,_cE,_hE,_LE,__D);
	}
	else 
	{
		var _NE=
function(_0E,_1E)
		{
			_1E._4E=_G9._KE;
			if(_0E.response)
			{
				_1E._fe=_3E;
				var _Al=new Uint8Array(_0E.response);
				for(var i=0,_Sg=_Al.length;i<_Sg;++i)
				{
					_G9._OE(_PE,_Al[i]);
				}
				_1E._4E=_Al.length;
			}
			else 
			{
				_1E._fe=_2E;
			}
		}
		;
		return _gE(_7y,_cE,_hE,_GE,_NE,'arraybuffer');
	}
}
;

function http_set_request_crossorigin(_QE)
{
	_vE=yyGetString(_QE);
}

function http_get_request_crossorigin()
{
	return _vE;
}
var _RE=null;

function ini_open_from_string(_SE)
{
	if(_RE)
	{
		ini_close();
	}
	_RE=_TE(yyGetString(_SE));
}

function ini_open(_UE)
{
	_UE=yyGetString(_UE);
	if(_RE)
	{
		ini_close();
	}
	var _VE=null;
	if(_mw)
	{
		_VE=_WE(_UE,true);
	}
	if(_VE==null)
	{
		_VE=_WE(_UE,false);
	}
	if(_VE==null)
	{
		_VE=new _XE(_UE);
	}
	_RE=_VE;
}

function ini_close()
{
	if(!_RE)return;
	var _ay=_RE._YE();
	_RE=null;
	return _ay;
}

function ini_read_string(_ZE,_aj,__E)
{
	if(!_RE)_I3("ini_read_string : Trying to read from undefined INI file");
	return _RE._0F(yyGetString(_ZE),yyGetString(_aj),yyGetString(__E));
}

function ini_read_real(_ZE,_aj,__E)
{
	if(!_RE)_I3("ini_read_real : Trying to read from undefined INI file");
	return _RE._1F(yyGetString(_ZE),yyGetString(_aj),yyGetString(__E));
}

function ini_write_string(_ZE,_aj,_5k)
{
	if(!_RE)_I3("ini_write_string : Trying to write to undefined INI file");
	_RE._2F(yyGetString(_ZE),yyGetString(_aj),yyGetString(_5k));
	return true;
}

function ini_write_real(_ZE,_aj,_5k)
{
	if(!_RE)_I3("ini_write_real : Trying to write to undefined INI file");
	_RE._2F(yyGetString(_ZE),yyGetString(_aj),""+yyGetReal(_5k));
	return true;
}

function ini_key_exists(_ZE,_aj)
{
	if(!_RE)_I3("ini_key_exists : Trying to read from undefined INI file");
	var _3F=_RE._4F(yyGetString(_ZE),yyGetString(_aj));
	if(_3F!=null&&_3F!=undefined)return true;
	return false;
}

function ini_section_exists(_ZE)
{
	if(!_RE)_I3("ini_section_exists : Trying to read from undefined INI file");
	var _5F=_RE._6F[yyGetString(_ZE)];
	if(_5F!=null&&_5F!=undefined)return true;
	return false;
}

function ini_key_delete(_ZE,_aj)
{
	if(!_RE)_I3("ini_key_delete : Trying to write to undefined INI file");
	return _RE._7F(yyGetString(_ZE),yyGetString(_aj));
}

function ini_section_delete(_ZE)
{
	if(!_RE)_I3("ini_section_delete : Trying to write to undefined INI file");
	return _RE._8F(yyGetString(_ZE));
}

function instance_find(_ui,_9F)
{
	_9F=yyGetInt32(_9F);
	var _aF=GetWithArray(yyGetInt32(_ui));
	if(_aF==null)return _9m;
	if(_9F>=_aF.length)return _9m;
	var _Uv=_aF[_9F];
	if((_Uv.active)&&(!_Uv.marked))return _dm(_em,_Uv.id);
	return _9m;
}

function instance_id_get(_g6,_K2)
{
	return _u2._bF._F4(yyGetInt32(_K2)).id;
}

function instance_exists(_ui)
{
	var _Ow=GetWithArray(yyGetInt32(_ui));
	if(_Ow!=null&&_Ow.length>0)
	{
		for(var _Uv=0;_Uv<_Ow.length;_Uv++)
		{
			var _rm=_Ow[_Uv];
			if(!_rm.marked&&_rm.active)return true;
		}
	}
	return false;
}

function instance_number(_ui)
{
	var _aF=GetWithArray(yyGetInt32(_ui));
	if(_aF==null)return 0;
	var _u7=0;
	for(var i=0;i<_aF.length;i++)
	{
		if((_aF[i].active)&&(!_aF[i].marked))_u7++;
	}
	return _u7;
}

function instance_position(_r4,_s4,_ui)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			if(_jm(_r4,_s4,_ui,null,true))
			{
				return _ui;
			}
		}
		else 
		{
			var id=_cF(_r4,_s4,_ui,null);
			if(id!=_9m)return id;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				if(_jm(_r4,_s4,_km,null,true))
				{
					return _km;
				}
			}
			else 
			{
				var id=_cF(_r4,_s4,_km,null);
				if(id!=_9m)return id;
			}
		}
	}
	else 
	{
		var id=_cF(_r4,_s4,_ui,null);
		if(id!=_9m)return id;
	}
	return _9m;
}

function instance_position_list(_r4,_s4,_ui,_U6,_Am)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	var _Ai=_yi._F4(yyGetInt32(_U6));
	if(!_Ai)
	{
		_I3("Error: invalid ds_list ID (instance_position_list)");
		return 0;
	}
	var _Bm=false;
	var _Cm=[];
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			_jm(_r4,_s4,_ui,_Cm,true);
			_Bm=true;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				_jm(_r4,_s4,_km,_Cm,true);
			}
			else 
			{
				_cF(_r4,_s4,_km,_Cm);
			}
		}
		_Bm=true;
	}
	if(!_Bm)_cF(_r4,_s4,_ui,_Cm);
	var _u7=_Cm.length;
	_lm(_Cm,_Ai,_r4,_s4,_Am);
	return _u7;
}

function instance_nearest(_g6,_r4,_s4,_ui)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	var _zm=10000000000;
	var i=_9m;
	var _dF=_eF(null,yyGetInt32(_ui),false,_9m,_r4,_s4,
function(_am)
	{
		var _O5=_r4-_am.x;
		var _Q5=_s4-_am.y;
		var _en=Math.sqrt(_O5*_O5+_Q5*_Q5);
		if(_en<_zm)
		{
			i=_dm(_em,_am.id);
			_zm=_en;
		}
	}
	);
	return i;
}

function instance_furthest(_g6,_r4,_s4,_ui)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	var _zm=-10000000000;
	var i=_9m;
	var _dF=_eF(null,yyGetInt32(_ui),false,_9m,_r4,_s4,
function(_am)
	{
		var _O5=_r4-_am.x;
		var _Q5=_s4-_am.y;
		var _en=Math.sqrt(_O5*_O5+_Q5*_Q5);
		if(_en>_zm)
		{
			i=_dm(_em,_am.id);
			_zm=_en;
		}
	}
	);
	return i;
}

function _fF(_gF,_hF,_iF,tilewidth,tileheight,_jF)
{
	_gF[3]._Y3=_gF[0]._Y3=_iF*tilewidth;
	_gF[1]._Y3=_gF[2]._Y3=_gF[0]._Y3+tilewidth;
	_gF[0]._Z3=_gF[1]._Z3=_hF*tileheight;
	_gF[2]._Z3=_gF[3]._Z3=_gF[0]._Z3+tileheight;
	if(_jF&_kF)
	{
		if(_jF&_lF)
		{
			var _QB=new _mF();
			_QB=_gF[1];
			_gF[1]=_gF[0];
			_gF[0]=_QB;
			_QB=_gF[2];
			_gF[2]=_gF[3];
			_gF[3]=_QB;
		}
		if(_jF&_nF)
		{
			var _QB=new _mF();
			_QB=_gF[3];
			_gF[3]=_gF[0];
			_gF[0]=_QB;
			_QB=_gF[2];
			_gF[2]=_gF[1];
			_gF[1]=_QB;
		}
		var _oF=(3<<_pF);
		var _qF=(_jF&_oF)>>_pF;
		if(_qF==1)
		{
			var _QB=new _mF();
			_QB=_gF[3];
			_gF[3]=_gF[2];
			_gF[2]=_gF[1];
			_gF[1]=_gF[0];
			_gF[0]=_QB;
		}
		else if(_qF==2)
		{
			var _QB=new _mF();
			var _rF=new _mF();
			_QB=_gF[3];
			_rF=_gF[0];
			_gF[3]=_gF[1];
			_gF[0]=_gF[2];
			_gF[2]=_rF;
			_gF[1]=_QB;
		}
		else if(_qF==3)
		{
			var _QB=new _mF();
			var _rF=new _mF();
			_QB=_gF[3];
			_rF=_gF[0];
			_gF[1]=_gF[2];
			_gF[0]=_gF[1];
			_gF[3]=_rF;
			_gF[2]=_QB;
		}
	}
}

function _Fm(_r4,_s4,_p5,_q5,_sF,_tF,_uF)
{
	var _sm=_tm._um();
	var _vF=null;
	var _wF=null;
	var _vm=_tm._wm(_sm,_sF.value);
	if(_vm!=null)
	{
		_vF=_vm._xF;
		_wF=_vm;
	}
	if((_wF!=null)&&(_wF._yF===_zF)&&(_wF._AF!=null)&&(_vF!=null))
	{
		var _lk=_ik._jk(_wF._BF);
		if(_lk==null)
		{
			_I3("Tilemap_CollisionLine() - could not find tileset for this map",false);
			return false;
		}
		var _CF=_E4._F4(_lk._DF);
		if((_CF==null)||(_CF._u7==0))
		{
			return false;
		}
		var _EF=_CF._GD()/_lk.tilewidth;
		var _FF=_CF._GD();
		var tilewidth,tileheight;
		var _GF=_CF._G5[0];
		tilewidth=_lk.tilewidth;
		tileheight=_lk.tileheight;
		var _HF=1.0/tilewidth;
		var _IF=1.0/tileheight;
		var _JF=new _Lv();
		_JF.left=_wF._KF+_vF._LF;
		_JF.top=_wF._MF+_vF._NF;
		_JF.right=_JF.left+(_wF._OF*tilewidth);
		_JF.bottom=_JF.top+(_wF._PF*tileheight);
		var _H5=_r4;
		var _K5=_s4;
		var _f3=_p5;
		var _h3=_q5;
		var _QF=_wF._KF+_vF._LF;
		var _RF=_wF._MF+_vF._NF;
		_H5-=_QF;
		_H5*=_HF;
		_f3-=_QF;
		_f3*=_HF;
		_K5-=_RF;
		_K5*=_IF;
		_h3-=_RF;
		_h3*=_IF;
		if(_f3<_H5)
		{
			var _QB=_H5;
			_H5=_f3;
			_f3=_QB;
		}
		if(_K5>_h3)
		{
			var _QB=_K5;
			_K5=_h3;
			_h3=_QB;
		}
		_f3=~~_J5(_f3,_wF._OF-1);
		_h3=~~_J5(_h3,_wF._PF-1);
		var _SF=_tm._TF();
		_SF&=_wF._UF;
		_H5=~~_I5(_H5,0);
		_K5=~~_I5(_K5,0);
		for(var x=_H5;x<=_f3;x++)
		{
			for(var y=_K5;y<=_h3;y++)
			{
				var index=(y*_wF._OF)+x;
				index=~~index;
				var _jF=_wF._AF[index];
				_jF&=_SF;
				var _VF=(_jF>>_WF)&_XF;
				if(_VF==0)continue;
				_VF=_lk._YF(_VF,_wF._ZF);
				if(_VF>0)
				{
					var __F=[new _0G(),new _0G(),new _0G(),new _0G()];
					__F[3].x=__F[0].x=_JF.left+tilewidth*x;
					__F[1].x=__F[2].x=__F[0].x+tilewidth;
					__F[0].y=__F[1].y=_JF.top+tileheight*y;
					__F[2].y=__F[3].y=__F[1].y+tileheight;
					var _x5=_r4;
					var _z5=_p5;
					var _y5=_s4;
					var _A5=_q5;
					if(_CF._1G()&&_uF)
					{
						var _gF=[new _mF(),new _mF(),new _mF(),new _mF()];
						var _hF=~~(_VF/_EF);
						var _iF=~~(_VF%_EF);
						_fF(_gF,_hF,_iF,tilewidth,tileheight,_jF);
						if(_CF._2G(_GF,__F,_gF,_x5,_y5,_z5,_A5))
						{
							if(_tF!=null)_tF.push(_sF);
							return true;
						}
					}
					else 
					{
						if(_tF!=null)_tF.push(_sF);
						return true;
					}
				}
			}
		}
	}
	return false;
}

function _Tm(_r4,_s4,_p5,_q5,_sF,_tF,_uF)
{
	var _sm=_tm._um();
	var _vF=null;
	var _wF=null;
	var _vm=_tm._wm(_sm,_sF.value);
	if(_vm!=null)
	{
		_vF=_vm._xF;
		_wF=_vm;
	}
	if((_wF!=null)&&(_wF._yF===_zF)&&(_wF._AF!=null)&&(_vF!=null))
	{
		var _lk=_ik._jk(_wF._BF);
		if(_lk==null)
		{
			_I3("Tilemap_CollisionLine() - could not find tileset for this map",false);
			return false;
		}
		var _CF=_E4._F4(_lk._DF);
		if((_CF==null)||(_CF._u7==0))
		{
			return false;
		}
		var _EF=_CF._GD()/_lk.tilewidth;
		var _FF=_CF._GD();
		var tilewidth,tileheight;
		var _GF=_CF._G5[0];
		tilewidth=_lk.tilewidth;
		tileheight=_lk.tileheight;
		var _HF=1.0/tilewidth;
		var _IF=1.0/tileheight;
		var _JF=new _Lv();
		_JF.left=_wF._KF+_vF._LF;
		_JF.top=_wF._MF+_vF._NF;
		_JF.right=_JF.left+(_wF._OF*tilewidth);
		_JF.bottom=_JF.top+(_wF._PF*tileheight);
		if(_p5<_r4)
		{
			var _0d=_p5;
			_p5=_r4;
			_r4=_0d;
			_0d=_q5;
			_q5=_s4;
			_s4=_0d;
		}
		var _H5=_r4;
		var _K5=_s4;
		var _f3=_p5;
		var _h3=_q5;
		var _QF=_wF._KF+_vF._LF;
		var _RF=_wF._MF+_vF._NF;
		_H5-=_QF;
		_H5*=_HF;
		_f3-=_QF;
		_f3*=_HF;
		_K5-=_RF;
		_K5*=_IF;
		_h3-=_RF;
		_h3*=_IF;
		if(_f3<_H5)
		{
			var _QB=_H5;
			_H5=_f3;
			_f3=_QB;
		}
		if(_K5>_h3)
		{
			var _QB=_K5;
			_K5=_h3;
			_h3=_QB;
		}
		_f3=~~_J5(_f3,_wF._OF-1);
		_h3=~~_J5(_h3,_wF._PF-1);
		var _SF=_tm._TF();
		_SF&=_wF._UF;
		_H5=~~_I5(_H5,0);
		_K5=~~_I5(_K5,0);
		for(var x=_H5;x<=_f3;x++)
		{
			for(var y=_K5;y<=_h3;y++)
			{
				var index=(y*_wF._OF)+x;
				index=~~index;
				var _jF=_wF._AF[index];
				_jF&=_SF;
				var _VF=(_jF>>_WF)&_XF;
				if(_VF==0)continue;
				_VF=_lk._YF(_VF,_wF._ZF);
				if(_VF>0)
				{
					var __F=[new _0G(),new _0G(),new _0G(),new _0G()];
					__F[3].x=__F[0].x=_JF.left+tilewidth*x;
					__F[1].x=__F[2].x=__F[0].x+tilewidth;
					__F[0].y=__F[1].y=_JF.top+tileheight*y;
					__F[2].y=__F[3].y=__F[1].y+tileheight;
					var _x5=_r4;
					var _z5=_p5;
					var _y5=_s4;
					var _A5=_q5;
					if(_CF._1G()&&_uF)
					{
						var _gF=[new _mF(),new _mF(),new _mF(),new _mF()];
						var _hF=~~(_VF/_EF);
						var _iF=~~(_VF%_EF);
						_fF(_gF,_hF,_iF,tilewidth,tileheight,_jF);
						if(_CF._3G(_GF,__F,_gF,_x5,_y5,_z5,_A5,_CF._GD()))
						{
							if(_tF!=null)_tF.push(_sF);
							return true;
						}
					}
					else 
					{
						if(_CF._4G(__F,_x5,_y5,_z5,_A5))
						{
							if(_tF!=null)_tF.push(_sF);
							return true;
						}
					}
				}
			}
		}
	}
	return false;
}

function _Pm(_r4,_s4,_p5,_q5,_sF,_tF,_uF)
{
	var _sm=_tm._um();
	var _vF=null;
	var _wF=null;
	var _vm=_tm._wm(_sm,_sF.value);
	if(_vm!=null)
	{
		_vF=_vm._xF;
		_wF=_vm;
	}
	if((_wF!=null)&&(_wF._yF===_zF)&&(_wF._AF!=null)&&(_vF!=null))
	{
		var _lk=_ik._jk(_wF._BF);
		if(_lk==null)
		{
			_I3("Tilemap_CollisionEllipse() - could not find tileset for this map",false);
			return false;
		}
		var _CF=_E4._F4(_lk._DF);
		if((_CF==null)||(_CF._u7==0))
		{
			return false;
		}
		var _EF=_CF._GD()/_lk.tilewidth;
		var _FF=_CF._GD();
		var tilewidth,tileheight;
		var _GF=_CF._G5[0];
		tilewidth=_lk.tilewidth;
		tileheight=_lk.tileheight;
		var _HF=1.0/tilewidth;
		var _IF=1.0/tileheight;
		var _JF=new _Lv();
		_JF.left=_wF._KF+_vF._LF;
		_JF.top=_wF._MF+_vF._NF;
		_JF.right=_JF.left+(_wF._OF*tilewidth);
		_JF.bottom=_JF.top+(_wF._PF*tileheight);
		var _H5=_r4;
		var _K5=_s4;
		var _f3=_p5;
		var _h3=_q5;
		var _QF=_wF._KF+_vF._LF;
		var _RF=_wF._MF+_vF._NF;
		_H5-=_QF;
		_H5*=_HF;
		_f3-=_QF;
		_f3*=_HF;
		_K5-=_RF;
		_K5*=_IF;
		_h3-=_RF;
		_h3*=_IF;
		if(_f3<_H5)
		{
			var _QB=_H5;
			_H5=_f3;
			_f3=_QB;
		}
		if(_K5>_h3)
		{
			var _QB=_K5;
			_K5=_h3;
			_h3=_QB;
		}
		_f3=~~_J5(_f3,_wF._OF-1);
		_h3=~~_J5(_h3,_wF._PF-1);
		var _SF=_tm._TF();
		_SF&=_wF._UF;
		_H5=~~_I5(_H5,0);
		_K5=~~_I5(_K5,0);
		for(var x=_H5;x<=_f3;x++)
		{
			for(var y=_K5;y<=_h3;y++)
			{
				var index=(y*_wF._OF)+x;
				index=~~index;
				var _jF=_wF._AF[index];
				_jF&=_SF;
				var _VF=(_jF>>_WF)&_XF;
				if(_VF==0)continue;
				_VF=_lk._YF(_VF,_wF._ZF);
				if(_VF>0)
				{
					var __F=[new _0G(),new _0G(),new _0G(),new _0G()];
					__F[3].x=__F[0].x=_JF.left+tilewidth*x;
					__F[1].x=__F[2].x=__F[0].x+tilewidth;
					__F[0].y=__F[1].y=_JF.top+tileheight*y;
					__F[2].y=__F[3].y=__F[1].y+tileheight;
					var _x5=_r4;
					var _z5=_p5;
					var _y5=_s4;
					var _A5=_q5;
					if(_CF._1G()&&_uF)
					{
						var _gF=[new _mF(),new _mF(),new _mF(),new _mF()];
						var _hF=~~(_VF/_EF);
						var _iF=~~(_VF%_EF);
						_fF(_gF,_hF,_iF,tilewidth,tileheight,_jF);
						if(_CF._5G(_GF,__F,_gF,_x5,_y5,_z5,_A5,_CF._GD()))
						{
							if(_tF!=null)_tF.push(_sF);
							return true;
						}
					}
					else 
					{
						if(_CF._6G(__F,_x5,_y5,_z5,_A5))
						{
							if(_tF!=null)_tF.push(_sF);
							return true;
						}
					}
				}
			}
		}
	}
	return false;
}

function _jm(_r4,_s4,_sF,_tF,_uF)
{
	var _sm=_tm._um();
	var _vF=null;
	var _wF=null;
	var _vm=_tm._wm(_sm,_sF.value);
	if(_vm!=null)
	{
		_vF=_vm._xF;
		_wF=_vm;
	}
	if((_wF!=null)&&(_wF._yF===_zF)&&(_wF._AF!=null)&&(_vF!=null))
	{
		var _lk=_ik._jk(_wF._BF);
		if(_lk==null)
		{
			_Uv._8c(_O5,_Q5);
			_Uv._7G=_8G;
			_I3("Tilemap_InstancePlace() - could not find tileset for this map",false);
			return false;
		}
		var _CF=_E4._F4(_lk._DF);
		if((_CF==null)||(_CF._u7==0))
		{
			return false;
		}
		var _EF=_CF._GD()/_lk.tilewidth;
		var _FF=_CF._GD();
		var tilewidth,tileheight;
		var _GF=_CF._G5[0];
		tilewidth=_lk.tilewidth;
		tileheight=_lk.tileheight;
		var _HF=1.0/tilewidth;
		var _IF=1.0/tileheight;
		var _JF=new _Lv();
		_JF.left=_wF._KF+_vF._LF;
		_JF.top=_wF._MF+_vF._NF;
		_JF.right=_JF.left+(_wF._OF*tilewidth);
		_JF.bottom=_JF.top+(_wF._PF*tileheight);
		var _H5=_r4;
		var _K5=_s4;
		var _QF=_wF._KF+_vF._LF;
		var _RF=_wF._MF+_vF._NF;
		_H5-=_QF;
		_H5*=_HF;
		_K5-=_RF;
		_K5*=_IF;
		var _SF=_tm._TF();
		_SF&=_wF._UF;
		_H5=~~_I5(_H5,0);
		_K5=~~_I5(_K5,0);
		_H5=~~_J5(_H5,_wF._OF-1);
		_K5=~~_J5(_K5,_wF._PF-1);
		var index=(_K5*_wF._OF)+_H5;
		index=~~index;
		var _jF=_wF._AF[index];
		_jF&=_SF;
		var _VF=(_jF>>_WF)&_XF;
		if(_VF==0)return false;
		_VF=_lk._YF(_VF,_wF._ZF);
		if(_VF>0)
		{
			if(_CF._1G()&&_uF)
			{
				var __F=[new _0G(),new _0G(),new _0G(),new _0G()];
				var _gF=[new _mF(),new _mF(),new _mF(),new _mF()];
				__F[3].x=__F[0].x=_JF.left+tilewidth*_H5;
				__F[1].x=__F[2].x=__F[0].x+tilewidth;
				__F[0].y=__F[1].y=_JF.top+tileheight*_K5;
				__F[2].y=__F[3].y=__F[1].y+tileheight;
				var _hF=~~(_VF/_EF);
				var _iF=~~(_VF%_EF);
				_fF(_gF,_hF,_iF,tilewidth,tileheight,_jF);
				var _9G=((_r4+0.5)-__F[0].x)/tilewidth;
				var _aG=((_s4+0.5)-__F[0].y)/tileheight;
				var _bG=_gF[0]._Y3+_9G*(_gF[1]._Y3-_gF[0]._Y3)+_aG*(_gF[3]._Y3-_gF[0]._Y3);
				var _cG=_gF[0]._Z3+_9G*(_gF[1]._Z3-_gF[0]._Z3)+_aG*(_gF[3]._Z3-_gF[0]._Z3);
				var ui=~~_bG;
				var _dG=~~_cG;
				if((ui<0)||(ui>=_CF._GD()))return false;
				if((_dG<0)||(_dG>=_CF._HD()))return false;
				if(_CF._eG(ui,_dG,_GF))
				{
					if(_tF!=null)
					{
						_tF.push(_sF);
					}
					return true;
				}
			}
			else 
			{
				if(_tF!=null)
				{
					_tF.push(_sF);
				}
				return true;
			}
		}
	}
	return false;
}

function _fG(_gG,_Dh,_hG,_iG,_jG,_kG,_lG,_mG)
{
	var _H5=(_I5(_gG,_jG));
	var _K5=(_I5(_hG,_lG));
	var _f3=(_J5(_Dh,_kG));
	var _h3=(_J5(_iG,_mG));
	if(Math.floor(_H5+0.49999)==Math.floor(_f3+0.5))return false;
	if(Math.floor(_K5+0.49999)==Math.floor(_h3+0.5))return false;
	return true;
}

function _nG(_Uv,_r4,_s4,_sF,_tF,_uF)
{
	var _O5,_Q5;
	var _8G=new _Lv();
	_8G=_Uv._7G;
	_O5=_Uv.x;
	_Q5=_Uv.y;
	_Uv._8c(_r4,_s4);
	if(_Uv._oG)_Uv._pG(false);
	var _qG=null;
	if(_Uv.mask_index<0)
	{
		_qG=_E4._F4(_Uv.sprite_index);
	}
	else 
	{
		_qG=_E4._F4(_Uv.mask_index);
	}
	if((_qG==null)||(_qG._u7==0))
	{
		return false;
	}
	var _sm=_tm._um();
	var _vF=null;
	var _wF=null;
	var _vm=_tm._wm(_sm,_sF.value);
	if(_vm!=null)
	{
		_vF=_vm._xF;
		_wF=_vm;
	}
	if((_wF!=null)&&(_wF._yF===_zF)&&(_wF._AF!=null)&&(_vF!=null))
	{
		var _lk=_ik._jk(_wF._BF);
		if(_lk==null)
		{
			_Uv._8c(_O5,_Q5);
			_Uv._7G=_8G;
			_I3("Tilemap_InstancePlace() - could not find tileset for this map",false);
			return false;
		}
		var _CF=_E4._F4(_lk._DF);
		if((_CF==null)||(_CF._u7==0))
		{
			return false;
		}
		var _EF=_CF._GD()/_lk.tilewidth;
		var _FF=_CF._GD();
		var tilewidth,tileheight;
		var _GF=_CF._G5[0];
		tilewidth=_lk.tilewidth;
		tileheight=_lk.tileheight;
		var _HF=1.0/tilewidth;
		var _IF=1.0/tileheight;
		var _JF=new _Lv();
		_JF.left=_wF._KF+_vF._LF;
		_JF.top=_wF._MF+_vF._NF;
		_JF.right=_JF.left+(_wF._OF*tilewidth);
		_JF.bottom=_JF.top+(_wF._PF*tileheight);
		var _rG=(_Uv._7G);
		var _H5=(_I5(_rG.left,_JF.left));
		var _K5=(_I5(_rG.top,_JF.top));
		var _f3=(_J5(_rG.right,_JF.right));
		var _h3=(_J5(_rG.bottom,_JF.bottom));
		var _QF=_wF._KF+_vF._LF;
		var _RF=_wF._MF+_vF._NF;
		_H5-=_QF;
		_f3-=_QF;
		_H5*=_HF;
		_f3*=_HF;
		_K5-=_RF;
		_h3-=_RF;
		_K5*=_IF;
		_h3*=_IF;
		var _SF=_tm._TF();
		_SF&=_wF._UF;
		_f3=~~_J5(_f3,_wF._OF-1);
		_h3=~~_J5(_h3,_wF._PF-1);
		_H5=~~_I5(_H5,0);
		_K5=~~_I5(_K5,0);
		for(var x=_H5;x<=_f3;x++)
		{
			for(var y=_K5;y<=_h3;y++)
			{
				var index=(y*_wF._OF)+x;
				index=~~index;
				var _jF=_wF._AF[index];
				_jF&=_SF;
				var _VF=(_jF>>_WF)&_XF;
				if(_VF==0)continue;
				_VF=_lk._YF(_VF,_wF._ZF);
				if(_VF>0)
				{
					if(_CF._1G()||_qG._1G()&&_uF)
					{
						var __F=[new _0G(),new _0G(),new _0G(),new _0G()];
						var _gF=[new _mF(),new _mF(),new _mF(),new _mF()];
						__F[3].x=__F[0].x=_JF.left+tilewidth*x;
						__F[1].x=__F[2].x=__F[0].x+tilewidth;
						__F[0].y=__F[1].y=_JF.top+tileheight*y;
						__F[2].y=__F[3].y=__F[1].y+tileheight;
						var _hF=~~(_VF/_EF);
						var _iF=~~(_VF%_EF);
						_fF(_gF,_hF,_iF,tilewidth,tileheight,_jF);
						if(_qG._sG(_Uv.image_index,_rG,_Uv.x,_Uv.y,_Uv.image_xscale,_Uv.image_yscale,_Uv.image_angle,__F,_gF,_GF,_CF))
						{
							_Uv._8c(_O5,_Q5);
							_Uv._7G=_8G;
							if(_tF!=null)
							{
								_tF.push(_sF);
							}
							return true;
						}
					}
					else 
					{
						var _tG=_JF.left+tilewidth*x;
						var _uG=_tG+tilewidth;
						var _vG=_JF.top+tileheight*y;
						var _wG=_vG+tileheight;
						if(_fG(_rG.left,_rG.right,_rG.top,_rG.bottom,_tG,_uG,_vG,_wG))
						{
							_Uv._8c(_O5,_Q5);
							_Uv._7G=_8G;
							if(_tF!=null)
							{
								_tF.push(_sF);
							}
							return true;
						}
					}
				}
			}
		}
	}
	_Uv._8c(_O5,_Q5);
	_Uv._7G=_8G;
	return false;
}

function _xG(_a8,_r4,_s4,_ui)
{
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			if(_nG(_a8,_r4,_s4,_ui,null,true))
			{
				return _ui;
			}
			return -1;
		}
		else 
		{
			var id=_yG(_a8,_r4,_s4,_ui,null);
			return id;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				if(_nG(_a8,_r4,_s4,_km,null,true))
				{
					return _km;
				}
			}
			else 
			{
				var id=_yG(_a8,_r4,_s4,_km,null);
				if(id!=_9m)return id;
			}
		}
		return -1;
	}
	else 
	{
		var id=_yG(_a8,_r4,_s4,_ui,null);
		return id;
	}
}

function instance_place(_6m,_r4,_s4,_ui)
{
	var id=_xG(_6m,_r4,_s4,_ui,null);
	return id;
}

function instance_place_list(_6m,_r4,_s4,_ui,_U6,_Am)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	var _Ai=_yi._F4(yyGetInt32(_U6));
	if(!_Ai)
	{
		_I3("Error: invalid ds_list ID (instance_place_list)");
		return 0;
	}
	var _Cm=[];
	var _Bm=false;
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			_nG(_6m,_r4,_s4,_ui,_Cm,true);
			_Bm=true;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				_nG(_6m,_r4,_s4,_km,_Cm,true);
			}
			else 
			{
				_yG(_6m,_r4,_s4,_km,_Cm);
			}
		}
		_Bm=true;
	}
	if(!_Bm)_yG(_6m,_r4,_s4,_ui,_Cm);
	var _u7=_Cm.length;
	_lm(_Cm,_Ai,_r4,_s4,_Am);
	return _u7;
}

function _zG(_6m,_AG)
{
	if(!_6m.marked&&_6m.active)
	{
		if((_AG===undefined)||(_AG))
		{
			_BG(_6m);
		}
		else 
		{
			_6m._O4(_CG,0,_6m,_6m);
			_6m.marked=true;
		}
	}
}

function instance_destroy(_6m,_Qe,_AG)
{
	_AG=_AG!==undefined?yyGetBool(_AG):true;
	if(_Qe===undefined)
	{
		_zG(_6m,_AG);
	}
	else 
	{
		var _Ow=GetWithArray(yyGetInt32(_Qe));
		if(_Ow!=null&&_Ow.length>0)
		{
			for(var _Uv=0;_Uv<_Ow.length;_Uv++)
			{
				var _rm=_Ow[_Uv];
				_zG(_rm,_AG);
			}
		}
	}
}

function position_destroy(_g6,_r4,_s4)
{
	var _Qi=_u2._bF._Qi;
	var _0t=[];
	for(var i=0;i<_Qi.length;i++)
	{
		var _rm=_Qi[i];
		if(_rm._cm(yyGetReal(_r4),yyGetReal(_s4),true))
		{
			_0t.push(_rm);
		}
	}
	for(var i=0;i<_0t.length;i++)
	{
		instance_destroy(_0t[i]);
	}
}

function position_change(_g6,_r4,_s4,_DG,_EG)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	var bottom,top;
	var _FG=[];
	var _GG=_u2._bF;
	for(var i=0;i<_GG._Qi.length;i++)
	{
		var _rm=_GG._Qi[i];
		if(_rm._oG)_rm._pG();
		var _7G=_rm._7G;
		if(!((_r4>_7G.right)||(_r4<_7G.left)||(_s4>_7G.bottom)||(_s4<_7G.top)))
		{
			_FG[_FG.length]=_rm;
		}
	}
	var _GG=_u2._bF;
	for(var i=0;i<_FG.length;i++)
	{
		instance_change(_FG[i],yyGetInt32(_DG),_EG);
	}
}

function motion_set(_g6,_HG,_IG)
{
	_g6.direction=yyGetReal(_HG);
	_g6.speed=yyGetReal(_IG);
}

function motion_add(_g6,_HG,_IG)
{
	_g6._JG(yyGetReal(_HG),yyGetReal(_IG));
}

function instance_copy(_g6,_KG)
{
	var _LG=new _MG(0,0,_NG++,_g6.object_index,true);
	var _OG=_LG.id;
	_LG._PG(_g6,true);
	_LG.id=_OG;
	_LG._QG=false;
	var _rm=_u2._RG(_LG);
	if(yyGetBool(_KG))
	{
		_LG._O4(_SG,0,_LG,_LG);
		_LG._O4(_TG,0,_LG,_LG);
	}
	return _dm(_em,_LG.id);
}

function _UG(_g6,_DG,_EG)
{
	_EG=yyGetBool(_EG);
	if(_EG)
	{
		_g6._O4(_VG,0,_g6,_g6);
		_g6._O4(_CG,0,_g6,_g6);
	}
	_g6._WG(yyGetInt32(_DG),true,false);
	_g6._XG(_g6.__v._YG);
	_g6._ZG(_u2);
	if(_EG)
	{
		_g6._O4(_SG,0,_g6,_g6);
		_g6._O4(_TG,0,_g6,_g6);
	}
}

function __G(_g6,_DG,_EG)
{
	_DG=yyGetInt32(_DG);
	if(!_j2._0H(_DG))
	{
		debug("Error: Trying to change an instance to an nonexistent object type.");
		return;
	}
	_UG(_g6,_DG,yyGetBool(_EG));
}
var instance_change=__G;

function instance_deactivate_all(_g6,_7m)
{
	var _Ai=[];
	_Ai=_u2._bF._Qi;
	_u2._bF._se();
	var _1H=_u2._2H;
	for(var i=0;i<_Ai.length;i++)
	{
		if(_Ai[i]==_g6)
		{
			if(yyGetBool(_7m)==false)
			{
				_u2._3H(_Ai[i]);
			}
			else 
			{
				_u2._bF._ce(_Ai[i]);
			}
		}
		else 
		{
			_u2._3H(_Ai[i]);
		}
	}
}

function instance_activate_all(_g6)
{
	var _Ai=[];
	_Ai=_u2._2H._Qi;
	_u2._2H._se();
	var _GG=_u2._bF;
	for(var i=0;i<_Ai.length;i++)
	{
		_u2._4H(_Ai[i]);
	}
}

function _5H(_ui,_6H)
{
	if(_ui._7H>=0)
	{
		_6H=yyGetInt32(_6H);
		var _8H=_j2._F4(_ui._7H);
		if(_8H)
		{
			if(_8H._9H==_6H)
			{
				return true;
			}
			else 
			{
				return _5H(_8H,_6H);
			}
		}
	}
	return false;
}
;

function instance_activate_object(_g6,_DG)
{
	_DG=yyGetInt32(_DG);
	var i;
	var _FG=[];
	var _1H=_u2._2H;
	if(_DG==_aH)
	{
		for(var i=0;i<_1H._Qi;i++)
		{
			var _rm=_1H._Qi[i];
			_FG[_FG.length]=_rm;
		}
	}
	else 
	{
		for(var i=0;i<_1H._Qi.length;i++)
		{
			var _rm=_1H._Qi[i];
			if(_rm.object_index==_DG||_rm.id==_DG)
			{
				_FG[_FG.length]=_rm;
			}
			else if(_5H(_j2._F4(_rm.object_index),_DG))
			{
				_FG[_FG.length]=_rm;
			}
		}
	}
	var _GG=_u2._bF;
	for(i=0;i<_FG.length;i++)
	{
		_u2._4H(_FG[i]);
	}
}

function instance_deactivate_object(_g6,_DG)
{
	_DG=yyGetInt32(_DG);
	var i;
	var _FG=[];
	var _GG=_u2._bF;
	if(_DG==_aH)
	{
		for(var i=0;i<_GG._Qi.length;i++)
		{
			var _rm=_GG._Qi[i];
			_FG[_FG.length]=_rm;
		}
	}
	else 
	{
		for(var i=0;i<_GG._Qi.length;i++)
		{
			var _rm=_GG._Qi[i];
			if(_rm.object_index==_DG||_rm.id==_DG)
			{
				_FG[_FG.length]=_rm;
			}
			else if(_5H(_j2._F4(_rm.object_index),_DG))
			{
				_FG[_FG.length]=_rm;
			}
		}
	}
	var _1H=_u2._2H;
	for(i=0;i<_FG.length;i++)
	{
		_u2._3H(_FG[i]);
	}
}

function instance_deactivate_region(_g6,_2l,_3l,_q7,_r7,_bH,_7m)
{
	_2l=yyGetReal(_2l);
	_3l=yyGetReal(_3l);
	_q7=yyGetReal(_q7);
	_r7=yyGetReal(_r7);
	var bottom,top,right;
	var _FG=[];
	var _GG=_u2._bF;
	right=_2l+_q7-1;
	bottom=_3l+_r7-1;
	for(var i=0;i<_GG._Qi.length;i++)
	{
		var _cH=false;
		var _rm=_GG._Qi[i];
		if(_rm._oG)_rm._pG();
		var _7G=_rm._7G;
		if((_7G)&&((_rm.sprite_index>=0)||(_rm.mask_index>=0)))
		{
			if((_2l>_7G.right)||(right<_7G.left)||(_3l>_7G.bottom)||(bottom<_7G.top))
			{
				_cH=true;
			}
		}
		else 
		{
			if((_rm.x>right)||(_rm.x<_2l)||(_rm.y>bottom)||(_rm.y<_3l))
			{
				_cH=true;
			}
		}
		if(_cH!=yyGetBool(_bH))_FG[_FG.length]=_rm;
	}
	var _1H=_u2._2H;
	for(i=0;i<_FG.length;i++)
	{
		if(_g6==_FG[i])
		{
			if(!yyGetBool(_7m))
			{
				_u2._3H(_FG[i]);
			}
		}
		else 
		{
			_u2._3H(_FG[i]);
		}
	}
}

function _dH(_g6,_r4,_s4,_q7,_r7,_7m,_eH,_fH)
{
	_I3("not implemented yet!");
}

function instance_deactivate_layer(_g6,_if)
{
	var room=_u2;
	if(room==null)
	{
		return -1;
	}
	var _vF=null;
	if((typeof(_if)==="string"))_vF=_tm._gH(room,yyGetString(_if).toLowerCase());
	else _vF=_tm._hH(room,yyGetInt32(_if));
	if(_vF===null)return;
	for(var _05=0;_05<_vF._iH.length;_05++)
	{
		var _wF=_vF._iH._F4(_05);
		if(_wF==null)continue;
		if(_wF._yF==_jH)
		{
			room._3H(_wF._kH);
		}
	}
}

function instance_activate_layer(_Uv,_if)
{
	var room=_u2;
	if(room==null)
	{
		return -1;
	}
	var _vF=null;
	if((typeof(_if)==="string"))_vF=_tm._gH(room,yyGetString(_if).toLowerCase());
	else _vF=_tm._hH(room,yyGetInt32(_if));
	if(_vF===null)return;
	for(var _05=0;_05<_vF._iH.length;_05++)
	{
		var _wF=_vF._iH._F4(_05);
		if(_wF==null)continue;
		if(_wF._yF==_jH)
		{
			room._4H(_wF._kH);
		}
	}
}

function instance_activate_region(_g6,_2l,_3l,_q7,_r7,_bH)
{
	_2l=yyGetReal(_2l);
	_3l=yyGetReal(_3l);
	_q7=yyGetReal(_q7);
	_r7=yyGetReal(_r7);
	var i;
	var bottom,top,right;
	var _FG=[];
	var _1H=_u2._2H;
	right=_2l+_q7-1;
	bottom=_3l+_r7-1;
	for(var i=0;i<_1H._Qi.length;i++)
	{
		var _cH=false;
		var _rm=_1H._Qi[i];
		if(_rm._oG)_rm._pG();
		var _7G=_rm._7G;
		if((_rm.sprite_index>=0)||(_rm.mask_index>=0))
		{
			if(_7G.right<_2l||_7G.left>right||_7G.bottom<_3l||_7G.top>bottom)
			{
				_cH=true;
			}
		}
		else 
		{
			if((_rm.x>right)||(_rm.x<_2l)||(_rm.y>bottom)||(_rm.y<_3l))
			{
				_cH=true;
			}
		}
		if(_cH!=yyGetBool(_bH))_FG[_FG.length]=_rm;
	}
	var _GG=_u2._bF;
	for(i=0;i<_FG.length;i++)
	{
		_u2._4H(_FG[i]);
	}
}

function keyboard_key_press(_aj)
{
	_aj=yyGetInt32(_aj);
	if(_lH[_aj])
	{
		return;
	}
	_lH[_aj]=1;
	_mH[_aj]=1;
	_nH=_aj;
}

function keyboard_key_release(_aj)
{
	_aj=yyGetInt32(_aj);
	_oH[_aj]=1;
	_lH[_aj]=0;
}

function _pH(_qH)
{

		{
		switch(yyGetInt32(_qH))
		{
			case 0:if(_0f._rH==0)return 0;
			else return 1;
			case 1:if((_0f._rH&1)==0)return 0;
			else return 1;
			case 2:if((_0f._rH&2)==0)return 0;
			else return 1;
			case 3:if((_0f._rH&4)==0)return 0;
			else return 1;
			case -1:if(_0f._rH==0)return 1;
			else return 0;
		}
	}
	return 0;
}

function mouse_check_button(_qH)
{

		{
		switch(yyGetInt32(_qH))
		{
			case 0:if(_0f._cd[0]||_0f._cd[1]||_0f._cd[2]||_0f._cd[3]||_0f._cd[4])return 0;
			else return 1;
			case 1:if(_0f._cd[0])return 1;
			else return 0;
			case 2:if(_0f._cd[1])return 1;
			else return 0;
			case 3:if(_0f._cd[2])return 1;
			else return 0;
			case 4:if(_0f._cd[3])return 1;
			else return 0;
			case 5:if(_0f._cd[4])return 1;
			else return 0;
			case -1:if(_0f._cd[0]||_0f._cd[1]||_0f._cd[2]||_0f._cd[3]||_0f._cd[4])return 1;
			else return 0;
		}
	}
	return 0;
}

function mouse_check_button_pressed(_qH)
{

		{
		switch(yyGetInt32(_qH))
		{
			case 0:if(_0f._7d[0]||_0f._7d[1]||_0f._7d[2]||_0f._7d[3]||_0f._7d[4])return 0;
			else return 1;
			case 1:if(_0f._7d[0])return 1;
			else return 0;
			case 2:if(_0f._7d[1])return 1;
			else return 0;
			case 3:if(_0f._7d[2])return 1;
			else return 0;
			case 4:if(_0f._7d[3])return 1;
			else return 0;
			case 5:if(_0f._7d[4])return 1;
			else return 0;
			case -1:if(_0f._7d[0]||_0f._7d[1]||_0f._7d[2]||_0f._7d[3]||_0f._7d[4])return 1;
			else return 0;
		}
	}
	return 0;
}

function mouse_check_button_released(_qH)
{

		{
		switch(yyGetInt32(_qH))
		{
			case 0:if(_0f._bd[0]||_0f._bd[1]||_0f._bd[2]||_0f._bd[3]||_0f._bd[4])return 0;
			else return 1;
			case 1:if(_0f._bd[0])return 1;
			else return 0;
			case 2:if(_0f._bd[1])return 1;
			else return 0;
			case 3:if(_0f._bd[2])return 1;
			else return 0;
			case 4:if(_0f._bd[3])return 1;
			else return 0;
			case 5:if(_0f._bd[4])return 1;
			else return 0;
			case -1:if(_0f._bd[0]||_0f._bd[1]||_0f._bd[2]||_0f._bd[3]||_0f._bd[4])return 1;
			else return 0;
		}
		return 0;
	}
}

function mouse_wheel_up()
{
	return _sH;
}

function mouse_wheel_down()
{
	return _tH;
}

function mouse_clear(_3m)
{
	_3m=yyGetInt32(_3m);
	if(_3m==-1)
	{
		mouse_clear(1);
		mouse_clear(2);
		mouse_clear(3);
	}
	else if(_3m>=1&&_3m<=3)
	{
		var i=_3m-1;
		_0f._cd[i]=0;
		_0f._7d[i]=0;
		_0f._bd[i]=0;
		_3f&=~(1<<i);
	}
}

function io_clear()
{
	_0f._se();
}

function keyboard_check(_aj)
{
	return _0f._uH[yyGetInt32(_aj)];
}

function keyboard_check_pressed(_aj)
{
	return _0f._vH[yyGetInt32(_aj)];
}

function keyboard_clear(_aj)
{
	_aj=yyGetInt32(_aj);
	_0f._uH[_aj]=false;
	_0f._vH[_aj]=false;
	_0f._wH[_aj]=false;
}

function keyboard_check_released(_aj)
{
	return _0f._wH[yyGetInt32(_aj)];
}

function keyboard_check_direct(_aj)
{
	return _0f._uH[yyGetInt32(_aj)];
}

function display_mouse_get_x()
{
	return(_0f._xH-_Ie.left);
}

function display_mouse_get_y()
{
	return(_0f._yH-_Ie.top);
}

function keyboard_set_map(_03,_13)
{
	_03=yyGetInt32(_03);
	_13=yyGetInt32(_13);
	if((_03<0)||(_03>_zH))return 0;
	if((_13<0)||(_13>_zH))return 0;
	_0f._AH[_03]=_13;
}

function keyboard_get_map(_aj)
{
	_aj=yyGetInt32(_aj);
	if((_aj<0)||(_aj>_zH))return 0;
	return _0f._AH[_aj];
}

function keyboard_unset_map()
{
	for(var _H5=0;_H5<_zH;_H5++)
	{
		_0f._AH[_H5]=_H5;
	}
}

function keyboard_virtual_show()
{
	_0b("keyboard_virtual_show()");
}

function keyboard_virtual_hide()
{
	_0b("keyboard_virtual_hide()");
}

function keyboard_virtual_status()
{
	_0b("keyboard_virtual_status()");
}

function keyboard_virtual_height()
{
	_0b("keyboard_virtual_height()");
}

function gesture_drag_time(_C2)
{
}

function gesture_drag_distance(_C2)
{
}

function gesture_flick_speed(_C2)
{
}

function gesture_double_tap_time(_C2)
{
}

function gesture_double_tap_distance(_C2)
{
}

function gesture_pinch_distance(_C2)
{
}

function gesture_pinch_angle_towards(_C2)
{
}

function gesture_pinch_angle_away(_C2)
{
}

function gesture_rotate_time(_C2)
{
}

function gesture_rotate_angle(_C2)
{
}

function gesture_tap_count(_C2)
{
}

function gesture_get_drag_time()
{
}

function gesture_get_drag_distance()
{
}

function gesture_get_flick_speed()
{
}

function gesture_get_double_tap_time()
{
}

function gesture_get_double_tap_distance()
{
}

function gesture_get_pinch_distance()
{
}

function gesture_get_pinch_angle_towards()
{
}

function gesture_get_pinch_angle_away()
{
}

function gesture_get_rotate_time()
{
}

function gesture_get_rotate_angle()
{
}

function gesture_get_tap_count()
{
}
var _BH=0,_CH=1,_DH=2,_EH=3,_FH=4,_GH=5,_HH=6;
var _IH=0,_JH=1,_jH=2,_KH=3,_LH=4,_zF=5,_MH=6,_NH=7,_OH=8,_PH=9;
var _QH=31;
var _RH=29;
var _SH=28;
var _pF=30;
var _TH=(1<<_QH);
var _nF=(1<<_RH);
var _lF=(1<<_SH);
var _UH=(1<<_pF);
var _VH=_SH;
var _kF=(0x7<<_VH);
var _WH=0x7;
var _WF=0;
var _XH=(0x7ffff<<_WF);
var _XF=(0x7ffff);
/*@constructor */
function _YH()
{
	this.visible=true;
	this.foreground=false;
	this.index=0;
	this.htiled=false;
	this.vtiled=false;
	this._ZH=1.0;
	this.__H=1.0;
	this.stretch=false;
	this._0I=0;
	this.alpha=1.0;
	this.playbackspeedtype=_1I;
	this.playbackspeed=0;
	this.image_speed=0;
	this.image_index=0;
}
;
/*@constructor */
function _2I()
{
	this._Uc=0;
	this.depth=0;
	this._LF=0;
	this._NF=0;
	this._3I=0;
	this._4I=0;
	this._5I=true;
	this._6I=0;
	this._7I="";
	this._8I=null;
	this._9I=null;
	this._aI=-1;
	this._bI=null;
	this._iH=new _wi();
	this._cI=true;
	this._dI=true;
	this._eI=null;
	this._fI=null;
	this._gI=-1;
}
;
_2I.prototype._hI=
function(_iI)
{
	this._eI=_iI;
}
;
_2I.prototype._jI=
function()
{
	this._eI=null;
}
;
_2I.prototype._kI=
function()
{
	return this._eI;
}
;
_2I.prototype._lI=
function()
{
	return this._eI!=null;
}
;
_2I.prototype._mI=
function()
{
	return this._fI;
}
;
/*@constructor */
function _nI()
{
	this.pName="";
	this.id=0;
	this.type=0;
	this.depth=0;
	this.x=0;
	this.y=0;
	this.hspeed=0;
	this.vspeed=0;
	this.visible=0;
}
;
/*@constructor */
function _oI()
{
	this.x=0;
	this.y=0;
	this.index=0;
	this.xo=0;
	this.yo=0;
	this.w=0;
	this.h=0;
	this.depth=0;
	this.id=0;
	this.scaleX=0;
	this.scaleY=0;
	this.colour=0;
}
;
/*@constructor */
function _pI()
{
	this._qI=-1;
	this._kH=null;
	this._yF=_jH;
	this._rI=false;
	this._1k="";
}
;
/*@constructor */
function _sI()
{
	this._tI=null;
	this._yF=_JH;
	this._rI=false;
	this._1k="";
	this._Uc=0;
}
;
/*@constructor */
function _uI()
{
	this._yF=_zF;
	this._BF=-1;
	this._KF=0;
	this._MF=0;
	this._OF=0;
	this._PF=0;
	this._ZF=0;
	this._AF=[];
	this._rI=false;
	this._1k="";
	this._Uc=0;
	this._UF=~_TH;
}
;
/*@constructor */
function _vI()
{
	this._yF=_KH;
	this._wI=[];
	this._xI=[];
	this._1k="";
	this._Uc=0;
	this._rI=false;
}
;
/*@constructor */
function _yI()
{
	this._zI=-1;
	this._AI=1;
	this._BI=_1I;
	this._CI=0;
	this._DI=1;
	this._EI=0;
	this._FI=1;
	this._GI=1;
	this._HI=0;
	this._II=0xffffffff;
	this._JI=1;
	this._KF=0;
	this._MF=0;
	this._yF=_LH;
	this._1k="";
	this._Uc=0;
	this._rI=false;
}
;
/*@constructor */
function _KI()
{
	this._LI=-1;
	this._MI=-1;
	this._AI=1;
	this._NI=0;
	this._II=0xffffffff;
	this._JI=1;
	this._OI=1;
	this._PI=1;
	this._KF=0;
	this._MF=0;
	this._W1=0;
	this._yF=_OH;
	this._1k="";
	this._Uc=0;
	this._rI=false;
	this._xF=null;
	this._QI=new _RI();
}
;
/*@constructor */
function _SI()
{
	this._yF=_MH;
	this._TI=-1;
	this._1k="";
	this._Uc=0;
	this._rI=false;
	this._UI=-1;
	this._FI=1.0;
	this._GI=1.0;
	this._HI=0.0;
	this._II=0xffffffff;
	this._JI=1.0;
	this._KF=0;
	this._MF=0;
}
;
/*@constructor */
function _VI()
{
	this._5I=true;
	this._8w=-1;
	this._KF=0;
	this._MF=0;
	this._WI=0;
	this._XI=0;
	this._FI=1.0;
	this._GI=1.0;
	this._HI=0.0;
	this._II=0xffffffff;
	this._JI=1.0;
	this._YI=0;
	this._ZI=0;
	this._yF=_NH;
	this._1k="";
	this._Uc=0;
	this._rI=false;
}
;
/*@constructor */
function __I()
{
	this._KF=0;
	this._MF=0;
	this._0J=-1;
	this._OI=1;
	this._PI=1;
	this._W1=0;
	this._1J=0xffffffff;
	this._2J=1;
	this._3J=1;
	this._4J=1;
	this._5J="";
	this._6J=0;
	this._7J=0;
	this._8J=0;
	this._9J=-1;
	this._aJ=-1;
	this._bJ=false;
	this._yF=_PH;
	this._1k="";
	this._Uc=0;
	this._rI=false;
}
;
/*@constructor */
function _cJ()
{
	this.pName=null;
	this.type=0;
	this.elements=0;
	this._dJ=null;
}
;
/*@constructor */
function _eJ()
{
	this.pName="";
	this._8z=0;
	this._fJ=[];
	this._gJ=false;
}
;
var _hJ=0;
var _iJ=1;
var _jJ=2;
var _kJ=3;
var _lJ=32;
/*@constructor */
function _mJ()
{
	this._nJ=0;
	this._oJ=0;
	this._pJ=0;
	this._qJ=false;
	this._rJ=0xffffffff;
	this._sJ=-1;
	this._tJ=false;
	this._uJ=0;
	this._vJ=null;
}
;
_mJ.prototype._wJ=
function()
{
	return this._nJ;
}
;
_mJ.prototype._xJ=
function(_Qe)
{
	this._yJ=_Qe;
}
;
_mJ.prototype._zJ=
function(_AJ)
{
	this._tJ=_AJ;
}
;
_mJ.prototype._BJ=
function(_wj)
{
	this._uJ=_wj;
}
;
_mJ.prototype._CJ=
function()
{
	return this._tJ;
}
;
_mJ.prototype._DJ=
function()
{
	return this._uJ;
}
;
_mJ.prototype._TF=
function()
{
	return this._rJ;
}
;
_mJ.prototype._EJ=
function(_if)
{
	this._rJ=_if;
}
;
_mJ.prototype._FJ=
function()
{
	if(!this._qJ)
	{
		this._qJ=true;
	}
}
;
_mJ.prototype._GJ=
function(_HJ,_IJ)
{
	if(_IJ._tI!=null)
	{
		delete(_IJ._tI);
		_IJ._tI=null;
	}
	_HJ._iH._JJ(_IJ);
}
;
_mJ.prototype._KJ=
function(_HJ,_IJ,_LJ)
{
	if(_IJ._kH)
	{
		_IJ._kH._MJ(false);
	}
	if(_LJ)
	{
		if(_IJ._qI>=0)
		{
			var _Uv=_Sv._F4(_IJ._qI);
			if(_Uv!=null)
			{
				instance_destroy(_Uv);
			}
		}
	}
	_HJ._iH._JJ(_IJ);
}
;
_mJ.prototype._NJ=
function(_HJ,_IJ)
{
	_HJ._iH._JJ(_IJ);
}
;
_mJ.prototype._OJ=
function(_HJ,_IJ)
{
	_HJ._iH._JJ(_IJ);
}
;
_mJ.prototype._PJ=
function(_HJ,_IJ)
{
	_HJ._iH._JJ(_IJ);
}
;
_mJ.prototype._QJ=
function(_HJ,_IJ)
{
	_HJ._iH._JJ(_IJ);
}
;
_mJ.prototype._RJ=
function(_HJ,_IJ)
{
	_HJ._iH._JJ(_IJ);
}
;
_mJ.prototype._SJ=
function(_HJ,_IJ)
{
	_HJ._iH._JJ(_IJ);
}
;
_mJ.prototype._TJ=
function(_HJ,_IJ)
{
	_HJ._iH._JJ(_IJ);
}
;
_mJ.prototype._UJ=
function(_VJ,_WJ,_HJ,_XJ,_YJ)
{
	if(_VJ==null)return;
	var _Sb=_WJ;
	var layer=_HJ;
	if(_Sb===null)return;
	this._ZJ(_Sb);
	switch(_Sb._yF)
	{
		case _JH:this._GJ(layer,_Sb);
		break;
		case _jH:this._KJ(layer,_Sb,_YJ);
		break;
		case _KH:this._NJ(layer,_Sb);
		break;
		case _LH:this._OJ(layer,_Sb);
		break;
		case _zF:this._PJ(layer,_Sb);
		break;
		case _MH:this._QJ(layer,_Sb);
		break;
		case _NH:this._RJ(layer,_Sb);
		break;
		case _OH:this._SJ(layer,_Sb);
		break;
		case _PH:this._TJ(layer,_Sb);
		break;
	}
	;
	return;
}
;
_mJ.prototype.__J=
function(_VJ,_0K,_XJ,_YJ)
{
	if(_VJ==null)return;
	var _Sb=null;
	var layer=null;
	for(var i=0;i<_VJ._1K.length;i++)
	{
		layer=_VJ._1K._F4(i);
		_Sb=this._2K(layer,_0K);
		if(_Sb!=null)break;
	}
	if(_Sb===null)return;
	this._ZJ(_Sb);
	switch(_Sb._yF)
	{
		case _JH:this._GJ(layer,_Sb);
		break;
		case _jH:this._KJ(layer,_Sb,_YJ);
		break;
		case _KH:this._NJ(layer,_Sb);
		break;
		case _LH:this._OJ(layer,_Sb);
		break;
		case _zF:this._PJ(layer,_Sb);
		break;
		case _MH:this._QJ(layer,_Sb);
		break;
		case _NH:this._RJ(layer,_Sb);
		break;
		case _OH:this._SJ(layer,_Sb);
		break;
		case _PH:this._TJ(layer,_Sb);
		break;
	}
	;
	return;
}
;
_mJ.prototype._3K=
function(_VJ,_IJ,_4K)
{
	if(_VJ==null)return;
	if(_IJ==null)return;
	if(_4K==null)return;
	var _5K=_tm._6K(_VJ,_IJ._Uc);
	if(_5K!=null)
	{
		_5K.layer._iH._JJ(_IJ);
	}
	if(_IJ._yF==_jH)
	{
		if(_IJ._kH!=null)
		{
			_IJ._kH.layer=_4K._Uc;
			_IJ._kH._MJ(true);
		}
	}
	_4K._iH._ce(_IJ);
}
;
_mJ.prototype._um=
function()
{
	if(this._sJ==-1)return _u2;
	var room=_HA._F4(this._sJ);
	if(room==null)return _u2;
	return room;
}
;
_mJ.prototype._7K=
function()
{
}
;
_mJ.prototype._8K=
function(_VJ,_HJ,_IJ)
{
	_IJ._rI=true;
}
;
_mJ.prototype._9K=
function(_VJ,_HJ,_IJ)
{
	var _Uv=_Sv._F4(_IJ._qI);
	if(_Uv===null)return;
	_IJ._kH=_Uv;
	_Uv._aK=_HJ._Uc;
	_Uv._QG=true;
	_Uv.depth=_HJ.depth;
	_IJ._rI=true;
}
;
_mJ.prototype._bK=
function(_VJ,_HJ,_IJ)
{
	_IJ._rI=true;
}
;
_mJ.prototype._cK=
function(_VJ,_HJ,_IJ)
{
	_IJ._rI=true;
}
;
_mJ.prototype._dK=
function(_VJ,_HJ,_IJ)
{
	_IJ._rI=true;
}
;
_mJ.prototype._eK=
function(_VJ,_HJ,_IJ)
{
	if(_IJ._UI!=-1&&_IJ._TI==-1)
	{
		_rA._F4(_IJ._UI)._fK(_HJ._Uc,false,_IJ);
	}
	_IJ._rI=true;
}
;
_mJ.prototype._gK=
function(_VJ,_HJ,_IJ)
{
	_IJ._rI=true;
}
;
_mJ.prototype._hK=
function(_VJ,_HJ,_IJ)
{
	var _iK=_KA._jK();
	_iK._LI=_IJ._LI;
	_iK._NI=_IJ._NI;
	_iK._kK=_IJ._AI;
	_VJ._lK(_IJ._Uc);
	_IJ._MI=_iK.id;
	_KA._mK(_iK,_TG);
	_IJ._rI=true;
}
;
_mJ.prototype._nK=
function(_VJ,_HJ,_IJ)
{
	_IJ._rI=true;
}
;
_mJ.prototype._oK=
function(_VJ,_HJ,_IJ)
{
	if(_VJ===null)return;
	if(_HJ===null)return;
	if(_IJ===null)return;
	if(_IJ._rI)return;
	switch(_IJ._yF)
	{
		case _JH:this._8K(_VJ,_HJ,_IJ);
		break;
		case _jH:this._9K(_VJ,_HJ,_IJ);
		break;
		case _KH:this._bK(_VJ,_HJ,_IJ);
		break;
		case _LH:this._cK(_VJ,_HJ,_IJ);
		break;
		case _zF:this._dK(_VJ,_HJ,_IJ);
		break;
		case _MH:this._eK(_VJ,_HJ,_IJ);
		break;
		case _NH:this._gK(_VJ,_HJ,_IJ);
		break;
		case _OH:this._hK(_VJ,_HJ,_IJ);
		break;
		case _PH:this._nK(_VJ,_HJ,_IJ);
		break;
	}
}
;
_mJ.prototype._xJ=
function(_Qe)
{
	this._nJ=_Qe;
}
;
_mJ.prototype._pK=
function(_VJ)
{
	if((_VJ._1K===null)||(_VJ._1K.length===0))return;
	for(var i=0;i<_VJ._1K.length;i++)
	{
		var _qK=_VJ._1K._F4(i);
		_qK._bI=get_timer();
		for(var _05=0;_05<_qK._iH.length;_05++)
		{
			var _wF=_qK._iH._F4(_05);
			if(_wF==null)continue;
			this._oK(_VJ,_qK,_wF);
		}
	}
}
;
_mJ.prototype._rK=
function(_VJ,_HJ,_IJ,_sK)
{
	if(_VJ==null||_HJ==null||_IJ===null)return -1;
	_IJ._Uc=this._tK();
	_IJ._xF=_HJ;
	var _uK=0;
	if(_IJ._yF!=_jH)
	{
		for(var _vK=0;_vK<_HJ._iH._Qi.length;_vK++)
		{
			var _wK=_HJ._iH._Qi[_vK];
			if(_wK==null||_wK._yF!=_jH)
			{
				break;
			}
			else 
			{
				if(_wK._kH!==null&&_wK._kH.active)
				{
					_uK=_vK+1;
				}
				else 
				{
					break;
				}
			}
		}
	}
	_HJ._iH._Mi(_uK,_IJ);
	if(_sK)
	{
		this._oK(_VJ,_HJ,_IJ);
	}
	return _IJ._Uc;
}
;
_mJ.prototype._xK=
function(_VJ,_wj,_IJ,_sK,_yK)
{
	if(_VJ==null||_IJ===null)return -1;
	var layer=this._zK(_VJ,_wj,_yK);
	if((layer==null)&&(_yK))
	{
		layer=this._AK(_VJ,_wj);
	}
	if(layer==null)
	{
		return -1;
	}
	return this._rK(_VJ,layer,_IJ,_sK);
}
;
_mJ.prototype._gH=
function(_VJ,_O2)
{
	if(!_O2)return null;
	_O2=_O2.toLowerCase();
	for(var i=0;i<_VJ._1K.length;i++)
	{
		var layer=_VJ._1K._F4(i);
		if(layer===undefined||layer===null)continue;
		if(!layer._7I)continue;
		if(layer._7I.toLowerCase()===_O2)
		{
			return layer;
		}
	}
	return null;
}
;
_mJ.prototype._BK=
function(_VJ,_CK)
{
	if(_VJ==null)return -1;
	for(var i=0;i<_VJ._1K.length;i++)
	{
		var layer=_VJ._1K._F4(i);
		if(layer!=null)
		{
			for(var _05=0;i<layer._iH.length;_05++)
			{
				var _wF=layer._iH._F4(_05);
				if(_wF!=null)
				{
					if(_wF._yF===_jH)
					{
						if(_wF._qI==_CK)
						{
							return layer._Uc;
						}
					}
				}
			}
		}
	}
	return -1;
}
;
_mJ.prototype._ZJ=
function(_IJ)
{
	if(_IJ==null)return;
	switch(_IJ._yF)
	{
		case _JH:
		{
			this._DK(_IJ);
		}
		break;
		case _jH:
		{
			this._EK(_IJ);
		}
		break;
		case _KH:
		{
			this._FK(_IJ);
		}
		break;
		case _LH:
		{
			this._GK(_IJ);
		}
		break;
		case _zF:
		{
			this._HK(_IJ);
		}
		break;
		case _MH:
		{
			this._IK(_IJ);
		}
		break;
		case _NH:
		{
			this._JK(_IJ);
		}
		break;
		case _OH:
		{
			this._KK(_IJ);
		}
		break;
		case _PH:
		{
			this._LK(_IJ);
		}
		break;
	}
	_IJ._rI=false;
}
;
_mJ.prototype._DK=
function(_MK)
{
}
;
_mJ.prototype._EK=
function(_NK)
{
	var _Uv=_Sv._F4(_NK._qI);
	if(_Uv!=null)
	{
		_Uv._MJ(false);
	}
	_NK._kH=null;
}
;
_mJ.prototype._FK=
function(_OK)
{
}
;
_mJ.prototype._GK=
function(_PK)
{
}
;
_mJ.prototype._HK=
function(_OK)
{
}
;
_mJ.prototype._IK=
function(_QK)
{
}
;
_mJ.prototype._JK=
function(_RK)
{
}
;
_mJ.prototype._KK=
function(_SK)
{
	if(_u2!=null)
	{
		_u2._TK(_SK._Uc);
	}
	var _iK=_KA._UK(_SK._MI);
	_KA._mK(_iK,_CG);
	_KA._VK(_iK);
}
;
_mJ.prototype._LK=
function(_PK)
{
}
;
_mJ.prototype._AK=
function(_VJ,_wj)
{
	var _WK=new _2I();
	_WK._Uc=_tm._XK();
	_WK.depth=_wj;
	_WK._6I=true;
	_u2._1K._ce(_WK);
	return _WK;
}
;
_mJ.prototype._YK=
function(_VJ,_g6)
{
	if(_VJ==null||_g6===null)return;
	if(_g6._ZK()===false)
	{
		if(_g6._aK==-1)
		{
			var _HJ=this._zK(_VJ,_g6.depth,true);
			if(_HJ===null)
			{
				_HJ=this._AK(_VJ,_g6.depth);
			}
			this.__K(_VJ,_HJ,_g6);
		}
		else 
		{
			var layer=this._hH(_VJ,_g6._aK);
			if(layer===null)return;
			this.__K(_VJ,layer,_g6);
		}
	}
}
;
_mJ.prototype.__K=
function(_VJ,_HJ,_g6)
{
	if(_VJ==null||_HJ==null||_g6===null)return;
	if(_g6._ZK()===false)
	{
		var _0L=new _pI();
		_0L._qI=_g6.id;
		_0L._kH=_g6;
		_g6._aK=_HJ._Uc;
		_g6._MJ(true);
		_0L._rI=true;
		_tm._rK(_VJ,_HJ,_0L,false);
	}
}
;
_mJ.prototype._1L=
function(_VJ,_g6)
{
	if(_g6._ZK()===false)return;
	var layer=this._hH(_VJ,_g6._aK);
	if(layer===null)
	{
		_g6._MJ(false);
		return;
	}
	this._2L(_VJ,layer,_g6);
}
;
_mJ.prototype._3L=
function(_VJ,_g6)
{
	if(_VJ==null||_g6===null)return;
	if(_g6._ZK()===true)
	{
		for(var _05=0;_05<_VJ._1K.length;_05++)
		{
			var layer=_VJ._1K._F4(_05);
			for(var i=0;i<layer._iH.length;i++)
			{
				var _wF=layer._iH._F4(i);
				if(_wF!=null)
				{
					if(_wF._yF==_jH)
					{
						if(_wF._kH==_g6)
						{
							this._UJ(_VJ,_wF,layer,true,false);
							_g6._MJ(false);
							_g6._aK=-1;
							return;
						}
					}
				}
			}
		}
	}
}
;
_mJ.prototype._2L=
function(_VJ,_HJ,_g6)
{
	if(_VJ==null||_HJ==null||_g6===null)return;
	if(_g6._ZK()===true)
	{
		for(var i=0;i<_HJ._iH.length;i++)
		{
			var _wF=_HJ._iH._F4(i);
			if(_wF!=null)
			{
				if(_wF._yF==_jH)
				{
					if(_wF._kH==_g6)
					{
						this._UJ(_VJ,_wF,_HJ,true,false);
						_g6._MJ(false);
						_g6._aK=-1;
					}
				}
			}
		}
	}
}
;
_mJ.prototype._4L=
function(_VJ,_CK)
{
	if(_VJ==null)return;
	for(var _05=0;_05<_VJ._1K.length;_05++)
	{
		var layer=_VJ._1K._F4(_05);
		for(var i=0;i<layer._iH.length;i++)
		{
			var _wF=layer._iH._F4(i);
			if(_wF!=null)
			{
				if(_wF._yF==_jH)
				{
					if(_wF._qI==_CK)
					{
						this._UJ(_VJ,_wF,layer,true,false);
						return;
					}
				}
			}
		}
	}
}
;
_mJ.prototype._5L=
function(_VJ,_HJ,_CK)
{
	if(_VJ==null||_HJ==null)return;
	for(var i=0;i<_HJ._iH.length;i++)
	{
		var _wF=_HJ._iH._F4(i);
		if(_wF!=null)
		{
			if(_wF._yF==_jH)
			{
				if(_wF._qI==_CK)
				{
					this._UJ(_VJ,_wF,_HJ,true,false);
				}
			}
		}
	}
}
;
_mJ.prototype._6L=
function(_VJ,_wj,_O2)
{
	if(_VJ==null)return null;
	var _WK=new _2I();
	_WK._Uc=this._XK();
	_WK.depth=_wj;
	_WK._7I=_O2;
	_WK._6I=false;
	_VJ._1K._ce(_WK);
	return _WK;
}
;
_mJ.prototype._7L=
function(_VJ,_8L,_YJ)
{
	if(_YJ==undefined)
	{
		_YJ=true;
	}
	var layer=this._hH(_VJ,_8L);
	if(layer!=null)
	{
		for(var i=0;i<layer._iH.length;i++)
		{
			var _wF=layer._iH._F4(i);
			if(_wF!=null)
			{
				this._UJ(_VJ,_wF,layer,false,_YJ);
			}
		}
		_VJ._1K._Hj(layer);
	}
}
;
_mJ.prototype._9L=
function(_VJ,_HJ,_aL,_bL)
{
	if(_VJ==null)return;
	if(_HJ==null)return;
	if(_aL==_HJ.depth)return;
	var _cL=_HJ.depth;
	_HJ.depth=_aL;
	_VJ._1K._Hj(_HJ);
	_VJ._1K._ce(_HJ);
	if(_HJ._6I&&_bL)
	{
		var _dL=[];
		var _eL=0;
		var _fL=_VJ._1K._gL(_HJ);
		if(_fL!=-1)
		{
			var _hL=_fL-1;
			while(_hL>=0) 
			{
				var _iL=_VJ._1K._F4(_hL);
				if((_iL==null)||(_iL.depth==_HJ.depth))
				{
					if(_iL!=null)
					{
						if(_iL._6I)
						{
							_dL[_eL++]=_iL;
						}
					}
					_hL--;
				}
				else 
				{
					break;
				}
			}
			;
			_hL=_fL+1;
			while(_hL<_VJ._1K.length) 
			{
				var _iL=_VJ._1K._F4(_hL);
				if((_iL==null)||(_iL.depth==_HJ.depth))
				{
					if(_iL!=null)
					{
						if(_iL._6I)
						{
							_dL[_eL++]=_iL;
						}
					}
					_hL++;
				}
				else 
				{
					break;
				}
			}
			;
			for(var i=0;i<_eL;i++)
			{
				var _jL=_dL[i];
				for(var _05=0;_05<_jL._iH.length;_05++)
				{
					var _wF=_jL._iH._F4(_05);
					if(_wF==null)continue;
					if(_wF._yF==_jH)
					{
						if(_wF._kH!=null)
						{
							_wF._kH._aK=_HJ._Uc;
						}
					}
					_HJ._iH._ce(_wF);
				}
				_jL._iH._se();
				_tm._7L(_VJ,_jL._Uc,false);
			}
		}
	}
}
;
_mJ.prototype._zK=
function(_VJ,_wj,_kL)
{
	if(_VJ==null)return null;
	for(var i=0;i<_VJ._1K.length;i++)
	{
		var layer=_VJ._1K._F4(i);
		if((layer.depth===_wj)&&(!_kL||(layer._6I)))return layer;
	}
	return null;
}
;
_mJ.prototype._hH=
function(_VJ,_Qe)
{
	for(var i=0;i<_VJ._1K.length;i++)
	{
		var layer=_VJ._1K._F4(i);
		if(layer._Uc===_Qe)return layer;
	}
	return null;
}
;
_mJ.prototype._XK=
function()
{
	if(this._oJ<this._nJ)this._oJ=this._nJ;
	this._oJ++;
	return this._oJ;
}
;
_mJ.prototype._tK=
function()
{
	return this._pJ++;
}
;
_mJ.prototype._wm=
function(_VJ,_lL)
{
	if(_VJ==null)return null;
	for(var i=0;i<_VJ._1K.length;i++)
	{
		var layer=_VJ._1K._F4(i);
		var _Sb=_tm._2K(layer,_lL);
		if(_Sb!=null)return _Sb;
	}
	return null;
}
;
_mJ.prototype._6K=
function(_VJ,_lL)
{
	if(_VJ==null)return null;
	for(var i=0;i<_VJ._1K.length;i++)
	{
		var layer=_VJ._1K._F4(i);
		var _Sb=_tm._2K(layer,_lL);
		if(_Sb!=null)
		{
			var _5K=new _mL();
			_5K._Sb=_Sb;
			_5K.layer=layer;
			return _5K;
		}
	}
	return null;
}
;
_mJ.prototype._2K=
function(_HJ,_nL)
{
	if(_HJ==null)return null;
	for(var i=0;i<_HJ._iH.length;i++)
	{
		var _wF=_HJ._iH._F4(i);
		if(_wF==null)continue;
		if(_wF._Uc===_nL)
		{
			return _wF;
		}
	}
	return null;
}
;
_mJ.prototype._oL=
function(_HJ,_pL)
{
	if(_HJ==null)return null;
	for(var i=_HJ._iH.length-1;i>=0;i--)
	{
		var _wF=_HJ._iH._F4(i);
		if(_wF==null||_wF===undefined)continue;
		if(_wF._yF==_pL)return _wF;
	}
	return null;
}
;
_mJ.prototype._qL=
function(_HJ,_rL)
{
	if(_HJ==null||_rL==null)return null;
	_rL=_rL.toLowerCase();
	for(var i=0;i<_HJ._iH.length;i++)
	{
		var _wF=_HJ._iH._F4(i);
		if(_wF==null||_wF===undefined)continue;
		if(!_wF._1k)continue;
		if(_wF._1k.toLowerCase()===_rL)
		{
			return _wF;
		}
	}
	return null;
}
;
_mJ.prototype._sL=
function(_VJ,_CK)
{
	if(_VJ==null)return null;
	for(var i=0;i<_VJ._1K.length;i++)
	{
		var layer=_VJ._1K._F4(i);
		if(layer!=null)
		{
			for(var _05=0;_05<layer._iH.length;_05++)
			{
				var _wF=layer._iH._F4(_05);
				if(_wF!=null)
				{
					if(_wF._yF==_jH)
					{
						if(_wF._qI==_CK)
						{
							var _5K=new _mL();
							_5K._Sb=_wF;
							_5K.layer=layer;
							return _5K;
						}
					}
				}
			}
		}
	}
	return null;
}
;
_mJ.prototype._tL=
function(_VJ,_lL)
{
	if(_VJ==null)return null;
	for(var i=0;i<_VJ._1K.length;i++)
	{
		var layer=_VJ._1K._F4(i);
		if(layer!=null)
		{
			for(var _05=0;_05<layer._iH.length;_05++)
			{
				var _wF=layer._iH._F4(_05);
				if(_wF!=null)
				{
					if(_wF._Uc==_lL)
					{
						return layer;
					}
				}
			}
		}
	}
	return null;
}
;
_mJ.prototype._uL=
function()
{
	if(_u2._1K===null||_u2._1K.length===0)return;
	var _vL=_u2._1K.length;
	var time=get_timer();
	for(var i=0;
i<_vL;i++)
	{
		var layer=_u2._1K._F4(i);
		var _wL=time-layer._bI;
		if(_wL>2000000)_wL=0;
		layer._LF+=layer._3I;
		layer._NF+=layer._4I;
		for(var _05=0;_05<layer._iH.length;_05++)
		{
			var _wF=layer._iH._F4(_05);
			if(_wF==null)continue;
			var type=_wF._yF;
			if(type==_JH)
			{
				var _lk=_wF._tI;
				if(_lk!=null)
				{
					if(_lk.playbackspeedtype==_x2)
					{
						_lk.image_index+=_lk.image_speed*_lk.playbackspeed;
					}
					else 
					{
						var fps=_y2._z2();
						_lk.image_index+=(_lk.image_speed*_lk.playbackspeed)/fps;
					}
				}
			}
			else if(type==_LH)
			{
				var _xL=_E4._F4(_wF._zI);
				if(_xL.sequence!=null)
				{
					var _yL=_wF._CI;
					var fps=(_xL.playbackspeedtype==_1I)?_y2._z2():1.0;
					_wF._CI+=_wF._DI*(_xL.playbackspeed/fps)*_wF._AI;
					var _15=
					{
						headPosition:_wF._CI,_zL:_wF._DI,_AL:false					}
					;
					_BL(_xL.sequence,_15);
					_wF._CI=_15.headPosition;
					_wF._DI=_15._zL;
					if((_xL.sequence._CL!=null)&&(_xL.sequence._CL[0]._yF==_DL))
					{
						var _N2=_xL.sequence._CL[0];
						var _EL=_N2._FL._GL(_wF._CI,_xL.sequence._HL);
						if(_EL==null)
						{
							_wF._EI=-1;
						}
						else 
						{
							_wF._EI=_EL._0k[0]._EI;
						}
						_IL(_xL.sequence,_wF._Uc,fps,_xL.playbackspeed,_wF._DI,_yL,_wF._CI);
					}
				}
				else if(_xL._ZC!==undefined)
				{
					_wF._EI+=_wF._AI;
				}
				else 
				{
					var fps=_y2._z2();
					if(fps!=0.0)
					{
						if(_xL.playbackspeedtype!=_1I)fps=1.0;
						_wF._EI+=(_xL.playbackspeed/fps)*_wF._AI;
					}
				}
			}
			else if(type==_zF)
			{
				var _JL=_ik._jk(_wF._BF);
				if(_JL!=null)
				{
					if(_JL.framelength>0)_wF._ZF=Math.floor((time/_JL.framelength)%_JL.frames);
					else _wF._ZF=(_wF._ZF+1)%_JL.frames;
				}
			}
		}
		layer._bI=get_timer();
	}
}
;
_mJ.prototype._KL=
function(_VJ)
{
	if(_VJ==null)return;
	if(_VJ._1K==null)return;
	var _vF,_Qi;
	_Qi=_VJ._1K._Qi;
	while(_Qi.length>0) 
	{
		_vF=_Qi[0];
		if(_vF==null)
		{
			continue;
		}
		this._7L(_VJ,_vF._Uc,false);
	}
}
;
_mJ.prototype._LL=
function(_VJ)
{
	if(_VJ==null)return;
	if(_VJ._1K==null)return;
	for(var _H5=0;_H5<_VJ._1K._Qi.length;++_H5)
	{
		var _HJ=_VJ._1K._Qi[_H5];
		for(var e=0;e<_HJ._iH._Qi.length;++e)
		{
			var _IJ=_HJ._iH._Qi[e];
			this._ZJ(_IJ);
		}
	}
}
;
_mJ.prototype._ML=
function(_VJ,_NL)
{
	if(_VJ===null)return;
	if(_NL===null)return;
	if(!this._qJ)this._FJ();
	var _OL=_VJ._PL;
	var _QL=_VJ._RL;
	var _vL=_NL.length;

		{
		var _vF;
		for(var _05=_vL-1;_05>=0;_05--)
		{
			_vF=_NL[_05];
			var _WK=new _2I();
			if(_vF.pName!=undefined)_WK._7I=_vF.pName;
			if(_vF.id!=undefined)_WK._Uc=_vF.id;
			if(_vF.depth!=undefined)_WK.depth=_vF.depth;
			if(_vF.x!=undefined)_WK._LF=_vF.x;
			if(_vF.y!=undefined)_WK._NF=_vF.y;
			if(_vF.hspeed!=undefined)_WK._3I=_vF.hspeed;
			if(_vF.vspeed!=undefined)_WK._4I=_vF.vspeed;
			if(_vF.visible!=undefined)_WK._5I=_vF.visible;
			if(_vF.effectEnabled!=undefined)_WK._cI=_WK._dI=_vF.effectEnabled;
			if((_vF.effectType!=undefined)&&(_vF.effectType!=""))
			{
				var _SL=new _eJ();
				_SL.pName=_vF.effectType;
				_SL._8z=0;
				for(var _u5=0;_u5<_vF.effectProperties.length;_u5++)
				{
					var _TL=_vF.effectProperties[_u5].value;
					if((_TL=="")||_TL.includes(".png")||_TL.includes(".jpg"))continue;
					var _w5;
					for(_w5=0;_w5<_u5;_w5++)
					{
						if(_vF.effectProperties[_u5].name==_vF.effectProperties[_w5].name)break;
					}
					if(_u5==_w5)
					{
						_SL._8z++;
					}
				}
				var _UL=[];
				var _VL=null;
				var _WL=-1;
				var _XL="";
				var _YL=1;
				for(var _u5=0;_u5<_vF.effectProperties.length;_u5++)
				{
					var _TL=_vF.effectProperties[_u5].value;
					if((_TL=="")||_TL.includes(".png")||_TL.includes(".jpg"))continue;
					var _ZL=_vF.effectProperties[_u5];
					if(_XL!=_ZL.name)
					{
						_WL++;
						_XL=_ZL.name;
						_VL=new _cJ();
						_UL[_WL]=_VL;
						var __L=_ZL.name;
						_VL.pName=__L;
						var _0M=_1M(_ZL.type);
						_YL=_0M.elements;
						_VL.type=_0M.type;
						_VL._dJ=[];
					}
					var _2M=_VL.elements;
					_VL.elements+=_YL;
					var _3M=_ZL.value;
					var _4M=_3M;
					switch(_ZL.type)
					{
						case _hJ:_VL._dJ[_2M]=parseFloat(_4M);
						break;
						case _iJ:
						{
							if(_3M.length>0)
							{
								if(_3M[0]=='#')
								{
									_4M="0x"+_3M.substring(1);
									_4M=parseInt(_4M);
									var _n3=_4M;
									var _f3,_g3,_h3,_i3;
									_f3=(_n3&0xff)/255.0;
									_g3=((_n3>>8)&0xff)/255.0;
									_h3=((_n3>>16)&0xff)/255.0;
									_i3=((_n3>>24)&0xff)/255.0;
									_VL._dJ[_2M]=_f3;
									_VL._dJ[_2M+1]=_g3;
									_VL._dJ[_2M+2]=_h3;
									_VL._dJ[_2M+3]=_i3;
								}
							}
						}
						break;
						case _jJ:_VL._dJ[_2M]=_4M;
						break;
					}
				}
				_SL._fJ=_UL;
				_SL._gJ=true;
				_WK._fI=_SL;
			}
			if(_vF.type===_CH)
			{
				var _5M=new _sI();
				_5M._tI=new _YH();
				var _6M;
				_5M._tI.image_speed=1.0;
				if(_vF.bvisible!=undefined)_5M._tI.visible=_vF.bvisible;
				if(_vF.bforeground!=undefined)_5M._tI.foreground=_vF.bforeground;
				if(_vF.bindex!=undefined)_5M._tI.index=_vF.bindex;
				if(_vF.bhtiled!=undefined)_5M._tI.htiled=_vF.bhtiled;
				if(_vF.bvtiled!=undefined)_5M._tI.vtiled=_vF.bvtiled;
				if(_vF.bblend!=undefined)
				{
					_5M._tI._0I=_ob(_vF.bblend);
					_5M._tI.alpha=((_vF.bblend>>24)&0xff)/255.0;
				}
				if(_vF.playbackspeedtype!=undefined)_5M._tI.playbackspeedtype=_vF.playbackspeedtype;
				if(_vF.bimage_speed!=undefined)_5M._tI.playbackspeed=_vF.bimage_speed;
				if(_vF.pName!=undefined)_5M._1k=_vF.pName;
				if((_vF.bstretch!=undefined))
				{
					_5M._tI.stretch=_vF.bstretch;
				}
				if((_vF.bstretch!=undefined)&&(_vF.bstretch==true)&&(sprite_exists(_5M._tI.index)))
				{
					var value=sprite_get_width(_5M._tI.index);
					if(value>0)_5M._tI._ZH=_OL/value;
					value=sprite_get_height(_5M._tI.index);
					if(value>0)_5M._tI.__H=_QL/value;
				}
				this._rK(_VJ,_WK,_5M);
			}
			else if(_vF.type===_DH)
			{
				var _7M=0;
				if(_vF.icount!=undefined)_7M=_vF.icount;
				for(var i=_7M-1;i>=0;i--)
				{
					var _0L=new _pI();
					_0L._qI=_vF.iinstIDs[i];
					this._rK(_VJ,_WK,_0L,false);
				}
			}
			else if(_vF.type===_EH)
			{
				var _8M=0;
				if(_vF.acount!=undefined)_8M=_vF.acount;
				if(_8M>0)
				{
					var i;
					for(i=_8M-1;i>=0;i--)
					{
						var _9M=new _VI();
						if(_vF.assets[i].ax!=undefined)_9M._KF=_vF.assets[i].ax;
						if(_vF.assets[i].ay!=undefined)_9M._MF=_vF.assets[i].ay;
						if(_vF.assets[i].aindex!=undefined)_9M._8w=_vF.assets[i].aindex;
						if(_vF.assets[i].aXO!=undefined)_9M._YI=_vF.assets[i].aXO;
						if(_vF.assets[i].aYO!=undefined)_9M._ZI=_vF.assets[i].aYO;
						if(_vF.assets[i].aW!=undefined)_9M._WI=_vF.assets[i].aW;
						if(_vF.assets[i].aH!=undefined)_9M._XI=_vF.assets[i].aH;
						if(_vF.assets[i].aXScale!=undefined)_9M._aM=_vF.assets[i].aXScale;
						if(_vF.assets[i].aYScale!=undefined)_9M._bM=_vF.assets[i].aYScale;
						if(_vF.assets[i].aBlend!=undefined)
						{
							_9M._cM=_vF.assets[i].aBlend&0xffffff;
							_9M._dM=((_vF.assets[i].aBlend>>24)&0xff)/255.0;
						}
						this._rK(_VJ,_WK,_9M,false);
					}
				}
				var _eM=0;
				if(_vF.scount!=undefined)_eM=_vF.scount;
				if(_eM>0)
				{
					for(var i=_eM-1;i>=0;i--)
					{
						var _fM=new _yI();
						_fM._BI=_1I;
						_fM._zI=_vF.sprites[i].sIndex;
						_fM._CI=_vF.sprites[i].sImageIndex;
						_fM._DI=1.0;
						if(_vF.sprites[i].sPlaybackSpeedType!=undefined)_fM._BI=_vF.sprites[i].sPlaybackSpeedType;
						_fM._AI=_vF.sprites[i].sImageSpeed;
						_fM._EI=_vF.sprites[i].sImageIndex;
						_fM._FI=_vF.sprites[i].sXScale;
						_fM._GI=_vF.sprites[i].sYScale;
						_fM._HI=_vF.sprites[i].sRotation;
						_fM._II=_ob(_vF.sprites[i].sBlend&0xffffff);
						_fM._JI=((_vF.sprites[i].sBlend>>24)&0xff)/255.0;
						_fM._KF=_vF.sprites[i].sX;
						_fM._MF=_vF.sprites[i].sY;
						_fM._1k=_vF.sprites[i].sName;
						this._rK(_VJ,_WK,_fM,false);
					}
				}
				var _gM=0;
				if(_vF.ecount!=undefined)_gM=_vF.ecount;
				if(_gM>0)
				{
					for(var i=_gM-1;i>=0;i--)
					{
						var _hM=new _KI();
						_hM._LI=_vF.sequences[i].sIndex;
						_hM._NI=_vF.sequences[i].sHeadPosition;
						_hM._II=_ob(_vF.sequences[i].sBlend&0xffffff);
						_hM._JI=((_vF.sequences[i].sBlend>>24)&0xff)/255.0;
						_hM._OI=_vF.sequences[i].sXScale;
						_hM._PI=_vF.sequences[i].sYScale;
						_hM._KF=_vF.sequences[i].sX;
						_hM._MF=_vF.sequences[i].sY;
						_hM._W1=_vF.sequences[i].sRotation;
						_hM._1k=_vF.sequences[i].sName;
						_hM._xF=_WK;
						_hM._AI=_vF.sequences[i].sImageSpeed;
						this._rK(_VJ,_WK,_hM,false);
					}
				}
				var _iM=0;
				if(_vF.pcount!=undefined)_iM=_vF.pcount;
				if(_iM>0)
				{
					for(var i=_iM-1;i>=0;--i)
					{
						var _jM=_vF.particles[i];
						var _kM=new _SI();
						_kM._TI=-1;
						_kM._UI=_jM.sIndex;
						_kM._FI=_jM.sXScale;
						_kM._GI=_jM.sYScale;
						_kM._HI=_jM.sRotation;
						_kM._II=_ob(_jM.sBlend&0xffffff);
						_kM._JI=((_jM.sBlend>>24)&0xff)/255.0;
						_kM._KF=_jM.sX;
						_kM._MF=_jM.sY;
						_kM._7I=_jM.sName;
						this._rK(_VJ,_WK,_kM,false);
					}
				}
				var _lM=0;
				if(_vF.tcount!=undefined)_lM=_vF.tcount;
				if(_lM>0)
				{
					for(var i=_lM-1;i>=0;i--)
					{
						var _mM=new __I();
						_mM._KF=_vF.textitems[i].sX;
						_mM._MF=_vF.textitems[i].sY;
						_mM._0J=_vF.textitems[i].sFontIndex;
						_mM._OI=_vF.textitems[i].sXScale;
						_mM._PI=_vF.textitems[i].sYScale;
						_mM._W1=_vF.textitems[i].sRotation;
						_mM._1J=_ob(_vF.textitems[i].sBlend&0xffffff);
						_mM._2J=((_vF.textitems[i].sBlend>>24)&0xff)/255.0;
						_mM._3J=_vF.textitems[i].sXOrigin;
						_mM._4J=_vF.textitems[i].sYOrigin;
						_mM._5J=_vF.textitems[i].sText;
						_mM._6J=_vF.textitems[i].sAlignment;
						_mM._7J=_vF.textitems[i].sCharSpacing;
						_mM._8J=_vF.textitems[i].sLineSpacing;
						_mM._9J=_vF.textitems[i].sFrameW;
						_mM._aJ=_vF.textitems[i].sFrameH;
						_mM._bJ=(_vF.textitems[i].sWrap!=0)?true:false;
						_mM._1k=_vF.textitems[i].sName;
						this._rK(_VJ,_WK,_mM,false);
					}
				}
			}
			else if(_vF.type===_FH)
			{
				if(_vF.tIndex>=0)
				{
					var _nM=new _uI();
					_nM._BF=_vF.tIndex;
					_nM._OF=_vF.tMapWidth;
					_nM._PF=_vF.tMapHeight;
					_nM._AF=_oM(_vF.ttiles);
					var _8M=0;
					if(_vF.tcount!=undefined)_8M=_vF.tcount;
					if(_vF.pName!=undefined)_nM._1k=_vF.pName;
					this._rK(_VJ,_WK,_nM,false);
				}
			}
			else if(_vF.type===_HH)
			{
				if(_WK._fI!=null)
				{
					_WK._fI._gJ=false;
				}
			}
			_VJ._1K._ce(_WK);
			this._xJ(_I5(this._wJ(),_WK._Uc));
		}
	}
}
;

function _1M(_pM)
{
	var type=_qM;
	if((_pM>=0)||(_pM<_kJ))
	{
		var _rM=[_qM,_qM,_sM,];
		type=_rM[_pM];
	}
	var _0M=
	{
	}
	;
	var elements=1;
	switch(_pM)
	{
		case _hJ:break;
		case _iJ:elements=4;
		break;
		case _jJ:break;
		default :break;
	}
	_0M.type=type;
	_0M.elements=elements;
	return _0M;
}
_mJ.prototype._tM=
function(_g6)
{
	this._vJ=_g6;
}
;
_mJ.prototype._uM=
function()
{
	return this._vJ;
}
;

function _vM(room,_wM)
{
	if(typeof(_wM)==="string")return _tm._gH(room,yyGetString(_wM));
	return _tm._hH(room,yyGetInt32(_wM));
}
;

function _xM(_yM)
{
	var room=_tm._um();
	if(room==null)return null;
	return _vM(room,_yM);
}
;

function layer_get_id(_O2)
{
	var room=_tm._um();
	if(room==null)return -1;
	var _vF=_tm._gH(room,yyGetString(_O2));
	if(_vF!=null)
	{
		return _vF._Uc;
	}
	return -1;
}
;

function layer_get_id_at_depth(_wj)
{
	var room=_tm._um();
	if(room==null)
	{
		var _l5=[];
		_l5[0]=-1;
		return _l5;
	}
	var _ta=[];
	var _vL=0;
	var i;
	for(i=0;i<room._1K.length;i++)
	{
		var layer=room._1K[i];
		if(layer!=null)
		{
			if(layer.depth==yyGetInt32(_wj))
			{
				_ta[_vL++]=layer._Uc;
			}
		}
	}
	if(_vL==0)
	{
		var _l5=[];
		_l5[0]=-1;
		return _l5;
	}
	return _ta;
}

function layer_get_depth(_Qe)
{
	var _vF=_xM(_Qe);
	if(_vF!=null)
	{
		return _vF.depth;
	}
	return -1;
}
;

function layer_create(_wj,_O2)
{
	var room=_tm._um();
	if(room==null)return -1;
	var _WK=new _2I();
	_WK._Uc=_tm._XK();
	_WK.depth=yyGetInt32(_wj);
	_WK._7I=yyGetString(_O2);
	_WK._6I=false;
	if((_WK._7I==undefined)||(_WK._7I==null))
	{
		_WK._7I="_layer_"+_WK._Uc.toString(16);
	}
	room._1K._ce(_WK);
	return _WK._Uc;
}
;

function layer_destroy(_if)
{
	var room=_tm._um();
	var _vF=_vM(room,_if);
	if(_vF!=null)_tm._7L(room,_vF._Uc);
	return -1;
}
;

function layer_destroy_instances(_if)
{
	var room=_tm._um();
	var _vF=_vM(room,_if);
	if(_vF!=null)
	{
		for(var i=0;i<_vF._iH.length;i++)
		{
			var _wF=_vF._iH._F4(i);
			if(_wF!=null)
			{
				if(_wF._yF==_jH)
				{
					_tm._UJ(room,_wF,_vF,false,true);
				}
			}
		}
	}
	return -1;
}
;

function layer_add_instance(_if,_zM)
{
	var room=_tm._um();
	var _vF=_vM(room,_if);
	if(_vF===null)return -1;
	if(room==_u2)
	{
		var _Uv=_Sv._F4(yyGetInt32(_zM));
		if(_Uv===null)return -1;
		_tm._1L(room,_Uv);
		_tm.__K(room,_vF,_Uv);
	}
	else 
	{
		var _AM=yyGetInt32(_zM);
		var _BM=_tm._BK(room,_AM);
		if(_BM!=-1)
		{
			var _CM=_tm._hH(room,_BM);
			_tm._5L(room,_CM,_AM);
		}
		var _DM=new _pI();
		_DM._qI=_AM;
		_tm._rK(room,_vF,_DM,false);
	}
	return -1;
}
;

function _EM(_if,_zM)
{
	var room=_tm._um();
	var _vF=_vM(room,_if);
	if(_vF===null)return;
	var _Uv=_Sv._F4(yyGetInt32(_zM));
	if(_Uv===null)return;
	if(_Uv._QG===false)
	{
		return;
	}
	if(_Uv._aK!=_vF._Uc)
	{
		return;
	}
	_tm._2L(room,_vF,_Uv);
}
;

function layer_has_instance(_if,_zM)
{
	var _vF=_xM(_if);
	if(_vF===null)return false;
	var _Uv=_Sv._F4(yyGetInt32(_zM));
	if(_Uv===null)return false;
	if(_Uv._QG===true&&_Uv._aK===_vF._Uc)
	{
		return true;
	}
	return false;
}
;

function layer_instance_get_instance(_Qe)
{
	var room=_tm._um();
	if(room!=null)
	{
		var _wF=_tm._wm(room,yyGetInt32(_Qe));
		if(_wF!=null&&_wF._yF===_jH)
		{
			return _dm(_em,_wF._qI);
		}
	}
	return _9m;
}

function layer_set_visible(_if,_zM)
{
	var _vF=_xM(_if);
	if(_vF===null)return;
	_vF._5I=yyGetBool(_zM);
}
;

function layer_get_visible(_if)
{
	var _vF=_xM(_if);
	if(_vF===null)return;
	return _vF._5I;
}
;

function layer_exists(_if)
{
	var _vF=_xM(_if);
	if(_vF===null)return false;
	return true;
}
;

function layer_script_begin(_if,_zM)
{
	var layer=_xM(_if);
	if(layer===null)return;
	if(typeof(_zM)==="number")
	{
		var _o8=yyGetInt32(_zM);
		if(_o8>=100000)_o8-=100000;
		layer._8I=_nu.Scripts[yyGetInt32(_o8)];
	}
	else 
	{
		layer._8I=_zM;
	}
	if(_tm._uM()===null)
	{
		var _FM=new _MG(0,0,0,0,false,true);
		_tm._tM(_FM);
	}
}
;

function layer_script_end(_if,_zM)
{
	var layer=_xM(_if);
	if(layer===null)return;
	if(typeof(_zM)==="number")
	{
		var _o8=yyGetInt32(_zM);
		if(_o8>=100000)_o8-=100000;
		layer._9I=_nu.Scripts[yyGetInt32(_o8)];
	}
	else 
	{
		layer._9I=_zM;
	}
	if(_tm._uM()===null)
	{
		var _FM=new _MG(0,0,0,0,false,true);
		_tm._tM(_FM);
	}
}
;

function layer_shader(_if,_zM)
{
	var layer=_xM(_if);
	if(layer===null)return;
	layer._aI=yyGetInt32(_zM);
}
;

function _GM(_tu)
{
	var _r3=_tu;
	var _Sg=_nu.Scripts.length;
	for(var _u5=0;_u5<_Sg;++_u5)
	{
		if(_tu==_nu.Scripts[_u5])
		{
			_r3=_u5+100000;
			break;
		}
	}
	return _r3;
}
;

function layer_get_script_begin(_if)
{
	var layer=_xM(_if);
	if(layer===null)return -1;
	_HM=_GM(layer._8I);
	return _HM===null?-1:_HM;
}
;

function layer_get_script_end(_if)
{
	var layer=_xM(_if);
	if(layer===null)return -1;
	_HM=_GM(layer._9I);
	return _HM===null?-1:_HM;
}
;

function layer_get_shader(_if)
{
	var layer=_xM(_if);
	if(layer===null)return -1;
	return layer._aI;
}
;

function layer_set_target_room(_if)
{
	_tm._sJ=yyGetInt32(_if);
}
;

function layer_get_target_room()
{
	return _tm._sJ;
}

function layer_reset_target_room()
{
	_tm._sJ=-1;
}

function _IM(_JM)
{
	var room=_tm._um();
	var _wF=_tm._wm(room,_JM);
	if((_wF!=null)&&(_wF._yF===_JH)&&(_wF._tI!=null))return _wF;
	return null;
}
;

function layer_background_get_id(_if)
{
	var layer=_xM(_if);
	if(layer===null)return -1;
	var _wF=_tm._qL(layer,layer._7I);
	if(_wF!=null)
	{
		return _wF._Uc;
	}
}
;

function layer_background_exists(_if,_zM)
{
	var layer=_xM(_if);
	if(layer===null)return false;
	var _wF=_tm._2K(layer,yyGetInt32(_zM));
	if((_wF!=null)&&(_wF._yF===_JH)&&(_wF._tI!=null))
	{
		return true;
	}
	return false;
}
;

function layer_background_create(_if,_zM)
{
	var room=_tm._um();
	if(room===null)return -1;
	var layer=_vM(room,_if);
	if(layer!=null)
	{
		var _5M=new _sI();
		_5M._tI=new _YH();
		var _6M;
		_5M._tI.visible=true;
		_5M._tI.foreground=false;
		_5M._tI.index=yyGetInt32(_zM);
		_5M._tI.htiled=false;
		_5M._tI.vtiled=false;
		_5M._tI._0I=0xffffffff;
		_5M._tI.alpha=1;
		_5M._tI.image_index=0;
		_5M._tI.image_speed=1;
		_tm._rK(room,layer,_5M);
		return _5M._Uc;
	}
	return -1;
}
;

function layer_background_destroy(_if)
{
	var room=_tm._um();
	if(room===null)return;
	_tm.__J(room,yyGetInt32(_if));
}
;

function layer_background_visible(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._tI.visible=yyGetBool(_zM);
	}
}
;

function layer_background_change(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._tI.index=yyGetInt32(_zM);
	}
}
;

function layer_background_htiled(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._tI.htiled=yyGetBool(_zM);
	}
}
;

function layer_background_vtiled(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._tI.vtiled=yyGetBool(_zM);
	}
}
;

function layer_background_xscale(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._tI._ZH=yyGetReal(_zM);
	}
}
;

function layer_background_yscale(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._tI.__H=yyGetReal(_zM);
	}
}
;

function layer_background_stretch(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._tI.stretch=yyGetBool(_zM);
	}
}
;

function layer_background_blend(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._tI._0I=_ob(yyGetInt32(_zM));
	}
}
;

function layer_background_alpha(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._tI.alpha=yyGetReal(_zM);
	}
}
;

function layer_background_index(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		var image_index=yyGetInt32(_zM);
		var _KM=sprite_get_number(_wF._tI.index);
		_wF._tI.image_index=_B2(image_index,_KM);
	}
}
;

function layer_background_sprite(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._tI.index=yyGetReal(_zM);
	}
}
;

function layer_background_speed(_if,_zM)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._tI.image_speed=yyGetReal(_zM);
	}
}
;

function layer_background_get_visible(_if)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._tI.visible;
	}
	return true;
}
;

function layer_background_get_sprite(_if)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._tI.index;
	}
	return -1;
}
;

function layer_background_get_htiled(_if)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._tI.htiled;
	}
	return false;
}
;

function layer_background_get_vtiled(_if)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._tI.vtiled;
	}
	return false;
}
;

function layer_background_get_stretch(_if)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._tI.stretch;
	}
	return false;
}
;

function layer_background_get_xscale(_if)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._tI._ZH;
	}
	return 1;
}
;

function layer_background_get_yscale(_if)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._tI.__H;
	}
	return 1;
}
;

function layer_background_get_blend(_if)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _ob(_wF._tI._0I);
	}
	return 0;
}
;

function layer_background_get_alpha(_if)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._tI.alpha;
	}
	return 0;
}
;

function layer_background_get_index(_if)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._tI.image_index;
	}
	return -1;
}
;

function layer_background_get_speed(_if)
{
	var _wF=_IM(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._tI.image_speed;
	}
	return 0;
}
;

function _LM(_MM)
{
	var room=_tm._um();
	var _wF=_tm._wm(room,_MM);
	if((_wF!=null)&&(_wF._yF===_LH))return _wF;
	return null;
}
;

function layer_sprite_get_id(_NM,_OM)
{
	var room=_tm._um();
	if(room===null)return -1;
	var layer=_vM(room,_NM);
	if(layer!=null)
	{
		var _Sb=_tm._qL(layer,yyGetString(_OM));
		if(_Sb!=null&&_Sb._yF==_LH)
		{
			return _Sb._Uc;
		}
	}
	return -1;
}
;

function layer_sprite_exists(_if,_zM)
{
	var room=_tm._um();
	if(room===null)return false;
	var layer=_vM(room,_if);
	if(layer===null)return false;
	var _wF=_tm._2K(layer,yyGetInt32(_zM));
	if((_wF!=null)&&(_wF._yF===_LH))
	{
		return true;
	}
	return false;
}
;

function layer_sprite_create(_if,_zM,_PM,_QM)
{
	var room=_tm._um();
	if(room===null)return -1;
	var layer=_vM(room,_if);
	if(layer!=null)
	{
		var _RM=new _yI();
		_RM._zI=yyGetInt32(_QM);
		_RM._KF=yyGetReal(_zM);
		_RM._MF=yyGetReal(_PM);
		_tm._rK(room,layer,_RM);
		return _RM._Uc;
	}
	return -1;
}
;

function layer_sprite_destroy(_if)
{
	var room=_tm._um();
	if(room===null)return;
	_tm.__J(room,yyGetInt32(_if));
}
;

function layer_sprite_change(_if,_zM)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		_wF._zI=yyGetInt32(_zM);
	}
}
;

function layer_sprite_index(_if,_zM)
{
	var room=_tm._um();
	if(room===null)return;
	var _wF=_tm._wm(room,yyGetInt32(_if));
	if((_wF!=null)&&(_wF._yF===_LH))
	{
		_wF._EI=yyGetInt32(_zM);
		var frame=yyGetInt32(_zM);
		var _xL=_E4._F4(_wF._zI);
		if(_xL!=null)
		{
			if(_xL.sequence!=null&&_xL.sequence._CL!=null&&_xL.sequence._CL[0]._yF==_DL)
			{
				var _SM=_xL.sequence._CL[0];
				var keyframeStore=_SM._FL;
				var _TM=keyframeStore._UM;
				if(_TM>0)
				{
					var _VM=_B2(frame,_TM);
					var _WM=_VM;
					var _XM=_VM-_WM;
					_wF._CI=(keyframeStore._YM[Math.floor(_WM)]._ZM+(_XM*_TM));
					_wF._EI=_VM;
				}
				else 
				{
					_wF._EI=frame;
				}
			}
			else 
			{
				_wF._EI=frame;
			}
		}
		else 
		{
			_wF._EI=frame;
		}
	}
}
;

function layer_sprite_speed(_if,_zM)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		_wF._AI=yyGetReal(_zM);
	}
}
;

function layer_sprite_xscale(_if,_zM)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		_wF._FI=yyGetReal(_zM);
	}
}
;

function layer_sprite_yscale(_if,_zM)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		_wF._GI=yyGetReal(_zM);
	}
}
;

function layer_sprite_angle(_if,_zM)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		_wF._HI=yyGetReal(_zM);
	}
}
;

function layer_sprite_blend(_if,_zM)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		_wF._II=_ob(yyGetInt32(_zM));
	}
}
;

function layer_sprite_alpha(_if,_zM)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		_wF._JI=yyGetReal(_zM);
	}
}
;

function layer_sprite_x(_if,_zM)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		_wF._KF=yyGetReal(_zM);
	}
}
;

function layer_sprite_y(_if,_zM)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		_wF._MF=yyGetReal(_zM);
	}
}
;

function layer_sprite_get_sprite(_if)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		return _wF._zI;
	}
	return -1;
}
;

function layer_sprite_get_index(_if)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		return _wF._EI;
	}
	return -1;
}
;

function layer_sprite_get_speed(_if)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		return _wF._AI;
	}
	return 0;
}
;

function layer_sprite_get_xscale(_if)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		return _wF._FI;
	}
	return 1;
}
;

function layer_sprite_get_yscale(_if)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		return _wF._GI;
	}
	return 1;
}
;

function layer_sprite_get_angle(_if)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		return _wF._HI;
	}
	return 0;
}
;

function layer_sprite_get_blend(_if)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		return _ob(_wF._II);
	}
	return 0;
}
;

function layer_sprite_get_alpha(_if)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		return _wF._JI;
	}
	return 0;
}
;

function layer_sprite_get_x(_if)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		return _wF._KF;
	}
	return 0;
}
;

function layer_sprite_get_y(_if)
{
	var _wF=_LM(_if);
	if(_wF!=null)
	{
		return _wF._MF;
	}
	return 0;
}
;

function __M(_0N)
{
	var room=_tm._um();
	var _wF=_tm._wm(room,_0N);
	if((_wF!=null)&&(_wF._yF===_PH))return _wF;
	return null;
}
;

function layer_text_get_id(_NM,_1N)
{
	var room=_tm._um();
	if(room===null)return -1;
	var layer=_vM(room,_NM);
	if(layer!=null)
	{
		var _Sb=_tm._qL(layer,yyGetString(_1N));
		if(_Sb!=null&&_Sb._yF==_PH)
		{
			return _Sb._Uc;
		}
	}
	return -1;
}
;

function layer_text_exists(_NM,_2N)
{
	var room=_tm._um();
	if(room===null)return false;
	var layer=_vM(room,_NM);
	if(layer===null)return false;
	var _wF=_tm._2K(layer,yyGetInt32(_2N));
	if((_wF!=null)&&(_wF._yF===_PH))
	{
		return true;
	}
	return false;
}
;

function layer_text_create(_NM,_r4,_s4,_lx,_Hu)
{
	var room=_tm._um();
	if(room===null)return -1;
	var layer=_vM(room,_NM);
	if(layer!=null)
	{
		var _3N=new __I();
		_3N._0J=_4N(_lx,_5N,_Su.Fonts.length,_Su.Fonts);
		_3N._KF=yyGetReal(_r4);
		_3N._MF=yyGetReal(_s4);
		_3N._5J=yyGetString(_Hu);
		_tm._rK(room,layer,_3N);
		return _3N._Uc;
	}
	return -1;
}
;

function layer_text_destroy(_6N)
{
	var room=_tm._um();
	if(room===null)return;
	_tm.__J(room,yyGetInt32(_6N));
}
;

function layer_text_font(_6N,_lx)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._0J=_4N(_lx,_5N,_Su.Fonts.length,_Su.Fonts);
	}
}
;

function layer_text_text(_6N,_Hu)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._5J=yyGetString(_Hu);
	}
}
;

function layer_text_halign(_6N,_7N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		var _jx=yyGetInt32(_7N);
		_wF._6J=(_wF._6J&~0xff)|(_jx&0xff);
	}
}
;

function layer_text_valign(_6N,_8N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		var _kx=yyGetInt32(_8N);
		_wF._6J=(_wF._6J&0xff)|((_kx&0xff)<<8);
	}
}
;

function layer_text_x(_6N,_r4)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._KF=yyGetReal(_r4);
	}
}
;

function layer_text_y(_6N,_s4)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._MF=yyGetReal(_s4);
	}
}
;

function layer_text_xscale(_6N,_7l)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._OI=yyGetReal(_7l);
	}
}
;

function layer_text_yscale(_6N,_8l)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._PI=yyGetReal(_8l);
	}
}
;

function layer_text_angle(_6N,_v4)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._W1=yyGetReal(_v4);
	}
}
;

function layer_text_blend(_6N,_NC)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._1J=_ob(yyGetInt32(_NC));
	}
}
;

function layer_text_alpha(_6N,_y8)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._2J=yyGetReal(_y8);
	}
}
;

function layer_text_xorigin(_6N,_9N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._3J=yyGetReal(_9N);
	}
}
;

function layer_text_yorigin(_6N,_aN)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._4J=yyGetReal(_aN);
	}
}
;

function layer_text_charspacing(_6N,_bN)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._7J=yyGetReal(_bN);
	}
}
;

function layer_text_linespacing(_6N,_cN)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._8J=yyGetReal(_cN);
	}
}
;

function layer_text_framew(_6N,_dN)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._9J=yyGetReal(_dN);
	}
}
;

function layer_text_frameh(_6N,_eN)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._aJ=yyGetReal(_eN);
	}
}
;

function layer_text_wrap(_6N,_fN)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		_wF._bJ=yyGetBool(_fN);
	}
}
;

function layer_text_get_font(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _dm(_5N,_wF._0J);
	}
	return -1;
}
;

function layer_text_get_text(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._5J;
	}
	return -1;
}
;

function layer_text_get_halign(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return(_wF._6J&0xff);
	}
	return 0;
}
;

function layer_text_get_valign(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return((_wF._6J>>8)&0xff);
	}
	return 0;
}
;

function layer_text_get_x(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._KF;
	}
	return 0;
}
;

function layer_text_get_y(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._MF;
	}
	return 0;
}
;

function layer_text_get_xscale(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._OI;
	}
	return 1;
}
;

function layer_text_get_yscale(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._PI;
	}
	return 1;
}
;

function layer_text_get_angle(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._W1;
	}
	return 0;
}
;

function layer_text_get_blend(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _ob(_wF._1J);
	}
	return 0xffffff;
}
;

function layer_text_get_alpha(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._2J;
	}
	return 1;
}
;

function layer_text_get_xorigin(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._3J;
	}
	return 0;
}
;

function layer_text_get_yorigin(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._4J;
	}
	return 0;
}
;

function layer_text_get_charspacing(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._7J;
	}
	return 0;
}
;

function layer_text_get_linespacing(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._8J;
	}
	return 0;
}
;

function layer_text_get_framew(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._9J;
	}
	return 0;
}
;

function layer_text_get_frameh(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._aJ;
	}
	return 0;
}
;

function layer_text_get_wrap(_6N)
{
	var _wF=__M(_6N);
	if(_wF!=null)
	{
		return _wF._bJ;
	}
	return 0;
}
;

function _gN(_hN)
{
	var room=_tm._um();
	var _wF=_tm._wm(room,_hN);
	if((_wF!=null)&&(_wF._yF===_zF))return _wF;
	return null;
}

function layer_tilemap_get_id(_if)
{
	var room=_tm._um();
	if(room===null)return _dm(_im,-1);
	var layer=_vM(room,_if);
	if(layer!=null)
	{
		var _Sb=_tm._oL(layer,_zF);
		if(_Sb!=null&&_Sb._yF==_zF)
		{
			return _dm(_im,_Sb._Uc);
		}
	}
	return _dm(_im,-1);
}
;

function layer_tilemap_exists(_if,_zM)
{
	var room=_tm._um();
	if(room===null)return false;
	var layer=_vM(room,_if);
	if(layer!=null)
	{
		var _Sb=_tm._2K(layer,yyGetInt32(_zM));
		if(_Sb!=null&&_Sb._yF==_zF)
		{
			return true;
		}
	}
	return false;
}
;

function layer_tilemap_create(_if,_zM,_PM,_QM,_iN,_jN)
{
	var room=_tm._um();
	if(room===null)return _dm(_im,-1);
	;
	var layer=_vM(room,_if);
	if(layer!=null)
	{
		var _nM=new _uI();
		_nM._BF=yyGetInt32(_QM);
		_nM._OF=yyGetInt32(_iN);
		_nM._PF=yyGetInt32(_jN);
		_nM._KF=yyGetReal(_zM);
		_nM._MF=yyGetReal(_PM);
		_nM._AF=[];
		var _8M=0;
		_8M=_iN*_jN;
		for(var i=0;i<_8M;i++)
		{
			_nM._AF[i]=0;
		}
		_tm._rK(room,layer,_nM,true);
		return _dm(_im,_nM._Uc);
	}
	return _dm(_im,-1);
}
;

function layer_tilemap_destroy(_if)
{
	var room=_tm._um();
	if(room===null)return;
	_tm.__J(room,yyGetInt32(_if));
}
;

function layer_x(_if,_zM)
{
	var layer=_xM(_if);
	if(layer!=null)
	{
		layer._LF=yyGetReal(_zM);
	}
}
;

function layer_y(_if,_zM)
{
	var layer=_xM(_if);
	if(layer!=null)
	{
		layer._NF=yyGetReal(_zM);
	}
}
;

function layer_get_x(_if)
{
	var layer=_xM(_if);
	if(layer!=null)
	{
		return layer._LF;
	}
	return 0;
}
;

function layer_get_y(_if)
{
	var layer=_xM(_if);
	if(layer!=null)
	{
		return layer._NF;
	}
	return 0;
}
;

function layer_hspeed(_kN,speed)
{
	var layer=_xM(_kN);
	if(layer!=null)
	{
		layer._3I=yyGetReal(speed);
	}
	return 0;
}
;

function layer_vspeed(_kN,speed)
{
	var layer=_xM(_kN);
	if(layer!=null)
	{
		layer._4I=yyGetReal(speed);
	}
	return 0;
}
;

function layer_get_hspeed(_kN)
{
	var layer=_xM(_kN);
	if(layer!=null)
	{
		return layer._3I;
	}
	return 0;
}
;

function layer_get_vspeed(_kN)
{
	var layer=_xM(_kN);
	if(layer!=null)
	{
		return layer._4I;
	}
	return 0;
}
;

function tilemap_tileset(_if,_zM)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._BF=yyGetInt32(_zM);
	}
}
;

function tilemap_x(_if,_zM)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._KF=yyGetReal(_zM);
	}
}
;

function tilemap_y(_if,_zM)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._MF=yyGetReal(_zM);
	}
}
;

function tilemap_set(_if,_zM,_PM,_QM)
{
	_PM=yyGetInt32(_PM);
	_QM=yyGetInt32(_QM);
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		if(_PM<0)
		{
			debug("tilemap_set_tile called with negative x coord, fails");
			return;
		}
		if(_QM<0)
		{
			debug("tilemap_set_tile called with negative y coord, fails");
			return;
		}
		if(_PM>=_wF._OF)
		{
			debug("tilemap_set_tile called with x coord greater than map width, fails");
			return;
		}
		if(_QM>=_wF._PF)
		{
			debug("tilemap_set_tile called with y coord greater than map height, fails");
			return;
		}
		var x=_PM;
		var y=_QM;
		var _JL=_ik._jk(_wF._BF);
		var _lN=yyGetInt32(_zM);
		var _VF=((_lN>>_WF)&_XF);
		if(_JL!=null&&_VF>=_JL.tilecount)
		{
			debug("layer_tilemap_set_tile() - tile index outside tile set count");
			return;
		}
		var index=(y*_wF._OF)+x;
		_wF._AF[index]=_lN;
	}
}
;
/*@constructor */
function _mL()
{
	this._Sb=-1;
	this.layer=-1;
}
;

function tilemap_set_at_pixel(_if,_zM,_PM,_QM)
{
	var room=_tm._um();
	var _r3=_tm._6K(room,yyGetInt32(_if));
	if(_r3==null)return -1;
	var _wF=_r3._Sb;
	var _HJ=_r3.layer;
	if((_wF!=null)&&(_wF._yF===_zF))
	{
		var _JL=_ik._jk(_wF._BF);
		var _mN=_JL.tilewidth;
		var _nN=_JL.tileheight;
		var _oN=1/_mN;
		var _pN=1/_nN;
		var _qN=_wF._KF+_HJ._LF;
		var _rN=_wF._MF+_HJ._NF;
		var _sN=_wF._OF*_mN;
		var _tN=_wF._PF*_nN;
		var x=yyGetReal(_PM);
		var y=yyGetReal(_QM);
		x-=_qN;
		y-=_rN;
		if(x<0)return -1;
		if(y<0)return -1;
		if(x>=_sN)return -1;
		if(y>_tN)return -1;
		var _uN=Math.floor(x*_oN);
		var _vN=Math.floor(y*_pN);
		_uN=_I5(0,_J5(_uN,_wF._OF));
		_vN=_I5(0,_J5(_vN,_wF._PF));
		var index=_vN*_wF._OF+_uN;
		var _lN=yyGetInt32(_zM);
		var _VF=((_lN>>_WF)&_XF);
		if(_JL!=null&&_VF>=_JL.tilecount)
		{
			debug("tilemap_set_tile_at_pixel() - tile index outside tile set count");
			return;
		}
		_wF._AF[index]=_lN;
	}
}
;

function tileset_get_texture(_u3)
{
	var _Bi=_ik._jk(yyGetInt32(_u3));
	if(_Bi)
	{
		return(
		{
			_fb:_Bi._ok.texture,_gb:_Bi._ok		}
		);
	}
	return null;
}

function tileset_get_name(_u3)
{
	var _Bi=_ik._jk(yyGetInt32(_u3));
	if(!_Bi)return "";
	return _Bi.pName;
}

function tileset_get_uvs(_u3)
{
	var _Bi=_ik._jk(yyGetInt32(_u3));
	if(_Bi)
	{
		var _C3=_Bi._ok;
		var texture=_C3.texture;
		var _yl=1.0/texture._xb;
		var _zl=1.0/texture._yb;
		var _Al=[];
		_Al.push(_C3.x*_yl,_C3.y*_zl,(_C3.x+_C3.CropWidth)*_yl,(_C3.y+_C3.CropHeight)*_zl);
		return _Al;
	}
	return null;
}

function tileset_get_info(_u3)
{
	var _Bi=_ik._jk(yyGetInt32(_u3));
	var _r3=undefined;
	if(_Bi)
	{
		_r3=new _Yx();
		var _C3=_Bi._ok;
		var texture=_C3.texture;
		variable_struct_set(_r3,"width",texture.width);
		variable_struct_set(_r3,"height",texture.height);
		variable_struct_set(_r3,"texture",_C3.tp);
		variable_struct_set(_r3,"tile_width",_Bi.tilewidth);
		variable_struct_set(_r3,"tile_height",_Bi.tileheight);
		variable_struct_set(_r3,"tile_horizontal_separator",_Bi.tilehsep);
		variable_struct_set(_r3,"tile_vertical_separator",_Bi.tilevsep);
		variable_struct_set(_r3,"tile_columns",_Bi.tilecolumns);
		variable_struct_set(_r3,"tile_count",_Bi.tilecount);
		variable_struct_set(_r3,"sprite_index",_Bi._DF);
		variable_struct_set(_r3,"frame_count",_Bi.frames);
		variable_struct_set(_r3,"frame_length_ms",_Bi.framelength);
		var frames=new _Yx();
		for(var _K5=0;_K5<_Bi.tilecount;++_K5)
		{
			var _wN=true;
			for(var _At=0;_wN&&_At<_Bi.frames;++_At)
			{
				var _vG=_Bi.framedata[(_K5*_Bi.frames)+_At];
				if(_vG==0)break;
				_wN=(_vG==_K5);
			}
			if(_wN)continue;
			var _qC=[];
			for(var _At=0;_At<_Bi.frames;++_At)
			{
				var _vG=_Bi.framedata[(_K5*_Bi.frames)+_At];
				if(_vG==0)break;
				_qC[_At]=_vG;
			}
			variable_struct_set(frames,_K5.toString(),_qC);
		}
		variable_struct_set(_r3,"frames",frames);
	}
	return _r3;
}

function tilemap_get_tileset(_if)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._BF;
	}
	return -1;
}
;

function tilemap_get_tile_width(_if)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		var _JL=_ik._jk(_wF._BF);
		if(_JL!=null)
		{
			return _JL.tilewidth;
		}
	}
	return -1;
}
;

function tilemap_get_tile_height(_if)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		var _JL=_ik._jk(_wF._BF);
		if(_JL!=null)
		{
			return _JL.tileheight;
		}
	}
	return -1;
}
;

function tilemap_get_width(_if)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._OF;
	}
	return -1;
}
;

function tilemap_get_height(_if)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._PF;
	}
	return -1;
}
;

function _xN(_yN,_zN,_AN)
{
	if(_zN<1)_zN=1;
	if(_AN<1)_AN=1;
	var tiles=[];
	var _8M=_zN*_AN;
	for(var i=0;i<_8M;++i)
	{
		tiles[i]=0;
	}
	var src=0;
	var _f9=0;
	for(var y=0;y<Math.min(_AN,_yN._PF);++y)
	{
		var _u7=Math.min(_zN,_yN._OF);
		for(var i=0;i<_u7;++i)tiles[_f9+i]=_yN._AF[src+i];
		src+=_yN._OF;
		_f9+=_zN;
	}
	_yN._AF=tiles;
	_yN._OF=_zN;
	_yN._PF=_AN;
}

function tilemap_set_width(_yN,_zN)
{
	var _wF=_gN(yyGetInt32(_yN));
	if(_wF!=null)
	{
		_xN(_wF,yyGetInt32(_zN),_wF._PF);
	}
}

function tilemap_set_height(_yN,_AN)
{
	var _wF=_gN(yyGetInt32(_yN));
	if(_wF!=null)
	{
		_xN(_wF,_wF._OF,yyGetInt32(_AN));
	}
}

function tilemap_get_x(_if)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._KF;
	}
	return -1;
}
;

function tilemap_get_y(_if)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._MF;
	}
	return -1;
}
;

function tilemap_get(_if,_zM,_PM)
{
	_zM=yyGetInt32(_zM);
	_PM=yyGetInt32(_PM);
	var room=_tm._um();
	if(room==null)
	{
		return 0;
	}
	var _wF=_tm._wm(room,yyGetInt32(_if));
	if((_wF!=null)&&(_wF._yF===_zF))
	{
		if(_zM<0)
		{
			debug("tilemap_get_tile called with negative x coord, fails");
			return;
		}
		if(_PM<0)
		{
			debug("tilemap_get_tile called with negative y coord, fails");
			return;
		}
		if(_zM>=_wF._OF)
		{
			debug("tilemap_get_tile called with x coord greater than map width, fails");
			return;
		}
		if(_PM>=_wF._PF)
		{
			debug("tilemap_get_tile called with y coord greater than map height, fails");
			return;
		}
		var index=(_PM*_wF._OF)+_zM;
		return _wF._AF[index];
	}
	return -1;
}
;

function tilemap_get_at_pixel(_if,_zM,_PM)
{
	var room=_tm._um();
	var _r3=_tm._6K(room,yyGetInt32(_if));
	if(_r3==null)
	{
		return -1;
	}
	var _wF=_r3._Sb;
	var _HJ=_r3.layer;
	if((_wF!=null)&&(_wF._yF===_zF))
	{
		var _JL=_ik._jk(_wF._BF);
		var _mN=_JL.tilewidth;
		var _nN=_JL.tileheight;
		var _oN=1/_mN;
		var _pN=1/_nN;
		var _qN=_wF._KF+_HJ._LF;
		var _rN=_wF._MF+_HJ._NF;
		var _sN=_wF._OF*_mN;
		var _tN=_wF._PF*_nN;
		var x=yyGetReal(_zM);
		var y=yyGetReal(_PM);
		x-=_qN;
		y-=_rN;
		if(x<0)return -1;
		if(y<0)return -1;
		if(x>=_sN)return -1;
		if(y>_tN)return -1;
		var _uN=Math.floor(x*_oN);
		var _vN=Math.floor(y*_pN);
		_uN=_I5(0,_J5(_uN,_wF._OF));
		_vN=_I5(0,_J5(_vN,_wF._PF));
		var index=_vN*_wF._OF+_uN;
		return _wF._AF[index];
	}
	return -1;
}
;

function tilemap_get_cell_x_at_pixel(_if,_zM,_PM)
{
	var room=_tm._um();
	var _r3=_tm._6K(room,yyGetInt32(_if));
	if(_r3==null)
	{
		return -1;
	}
	var _wF=_r3._Sb;
	var _HJ=_r3.layer;
	if((_wF!=null)&&(_wF._yF===_zF))
	{
		var _JL=_ik._jk(_wF._BF);
		var _mN=_JL.tilewidth;
		var _nN=_JL.tileheight;
		var _oN=1/_mN;
		var _pN=1/_nN;
		var _qN=_wF._KF+_HJ._LF;
		var _rN=_wF._MF+_HJ._NF;
		var _sN=_wF._OF*_mN;
		var _tN=_wF._PF*_nN;
		var x=yyGetReal(_zM);
		var y=yyGetReal(_PM);
		x-=_qN;
		y-=_rN;
		if(x<0)return -1;
		if(y<0)return -1;
		if(x>=_sN)return -1;
		if(y>_tN)return -1;
		return(Math.floor(x*_oN));
	}
	return -1;
}
;

function tilemap_get_cell_y_at_pixel(_if,_zM,_PM)
{
	var room=_tm._um();
	var _r3=_tm._6K(room,yyGetInt32(_if));
	if(_r3==null)
	{
		return -1;
	}
	var _wF=_r3._Sb;
	var _HJ=_r3.layer;
	if((_wF!=null)&&(_wF._yF===_zF))
	{
		var _JL=_ik._jk(_wF._BF);
		var _mN=_JL.tilewidth;
		var _nN=_JL.tileheight;
		var _oN=1/_mN;
		var _pN=1/_nN;
		var _qN=_wF._KF+_HJ._LF;
		var _rN=_wF._MF+_HJ._NF;
		var _sN=_wF._OF*_mN;
		var _tN=_wF._PF*_nN;
		var x=yyGetReal(_zM);
		var y=yyGetReal(_PM);
		x-=_qN;
		y-=_rN;
		if(x<0)return -1;
		if(y<0)return -1;
		if(x>=_sN)return -1;
		if(y>_tN)return -1;
		return(Math.floor(y*_pN));
	}
	return -1;
}
;

function tilemap_clear(_if,_zM)
{
	var room=_tm._um();
	var _r3=_tm._6K(room,yyGetInt32(_if));
	if(_r3==null)
	{
		return;
	}
	var _wF=_r3._Sb;
	var _HJ=_r3.layer;
	if((_wF!=null)&&(_wF._yF===_zF)&&(_HJ!=null))
	{
		var _jF=yyGetInt32(_zM);
		var index=0;
		for(var i=0;i<_wF._OF;i++)
		{
			for(var _05=0;_05<_wF._PF;_05++,index++)
			{
				_wF._AF[index]=_jF;
			}
		}
	}
}
;

function tilemap_set_global_mask(_if)
{
	_tm._EJ(yyGetInt32(_if));
}
;

function tilemap_get_global_mask()
{
	return _tm._TF();
}
;

function tilemap_get_mask(_if)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._UF;
	}
	return -1;
}
;

function tilemap_get_frame(_if)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		return _wF._ZF;
	}
	return -1;
}
;

function tilemap_set_mask(_if,_zM)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		_wF._UF=yyGetInt32(_zM);
	}
}
;

function draw_tilemap(_Uv,_if,_zM,_PM)
{
	var _wF=_gN(yyGetInt32(_if));
	if(_wF!=null)
	{
		var room=_tm._um();
		var x=yyGetReal(_zM);
		var y=yyGetReal(_PM);
		var depth=_X9;
		room._BN(_iD,null,_wF,x,y,depth);
	}
}
;

function tile_set_empty(_if)
{
	var _lN=yyGetInt32(_if);
	_lN&=(~_XH);
	return _lN;
}
;

function tile_set_index(_if,_zM)
{
	var _lN=yyGetInt32(_if);
	var _CN=yyGetInt32(_zM);
	_lN&=(~_XH);
	_lN|=_CN<<_WF;
	return _lN;
}
;

function tile_set_flip(_if,_zM)
{
	var _DN=yyGetBool(_zM);
	var _lN=yyGetInt32(_if);
	if(_DN)_lN|=_nF;
	else _lN&=(~_nF);
	return _lN;
}
;

function tile_set_mirror(_if,_zM)
{
	var _DN=yyGetBool(_zM);
	var _lN=yyGetInt32(_if);
	if(_DN)_lN|=_lF;
	else _lN&=(~_lF);
	return _lN;
}
;

function tile_set_rotate(_if,_zM)
{
	var _DN=yyGetBool(_zM);
	var _lN=yyGetInt32(_if);
	if(_DN)_lN|=_UH;
	else _lN&=(~_UH);
	return _lN;
}
;

function tile_get_empty(_if)
{
	return(yyGetInt32(_if)&_XH)?0.0:1.0;
}
;

function tile_get_index(_if)
{
	var _lN=yyGetInt32(_if);
	var index=(_lN&_XH)>>_WF;
	return index;
}
;

function tile_get_flip(_if)
{
	var _lN=yyGetInt32(_if);
	return((_lN&_nF)?true:false);
}
;

function tile_get_mirror(_if)
{
	var _lN=yyGetInt32(_if);
	return((_lN&_lF)?true:false);
}
;

function tile_get_rotate(_if)
{
	var _lN=yyGetInt32(_if);
	return((_lN&_UH)?true:false);
}
;

function _EN(_ji,_Cy)
{
	if(_Cy!=undefined)
	{
		var _0j=Object.getOwnPropertyNames(_Cy);
		_0j=_0j.filter(_0d=>!_0d.startsWith("__"));
		for(var i=0;i<_0j.length;i++)
		{
			var prop=_0j[i];
			_FN=g_instance_names[prop];
			var _Z3=_Cy[prop];
			if((typeof _Z3=='function')&&_Z3._GN&&_Z3._vi&&(_Z3._vi==_Cy))
			{
				_Z3=method(_ji,_Z3);
			}
			if(_FN==undefined)
			{
				_ji[prop]=_Z3;
			}
			else if(_FN[1])
			{
				if(_FN[3]!=null)
				{
					var _At=undefined;
					if((typeof g_var2obf!=="undefined")&&(g_var2obf[_FN[3]]!=undefined))
					{
						_At=_ji[g_var2obf[_FN[3]]];
					}
					else 
					{
						_At=_ji[_FN[3]];
					}
					if(typeof _At=='function')
					{
						_At.call(_ji,_Z3);
					}
				}
				else 
				{
					_ji[prop]=_Z3;
				}
			}
		}
	}
}

function instance_create_depth(_r4,_s4,_wj,_HN,_IN)
{
	if(_tm._um()!=_u2)return -1;
	if(_wj==undefined)_wj=0;
	_HN=yyGetInt32(_HN);
	var _Qv=_j2._F4(_HN);
	if(!_Qv)
	{
		_I3("Error: Trying to create an instance using non-existent object type ("+_HN+")");
		return _9m;
	}
	var _Uv=_u2._JN(yyGetReal(_r4),yyGetReal(_s4),yyGetInt32(_wj),_HN);
	if(_Uv!=null)
	{
		_Uv._O4(_SG,0,_Uv,_Uv);
		_EN(_Uv,_IN);
		_Uv._O4(_TG,0,_Uv,_Uv);
		return _dm(_em,_Uv.id);
	}
	return _9m;
}
;

function instance_create_layer(_r4,_s4,_NM,_ui,_IN)
{
	if(_tm._um()!=_u2)return -1;
	_ui=yyGetInt32(_ui);
	var _Qv=_j2._F4(_ui);
	if(!_Qv)
	{
		_I3("Error: Trying to create an instance using non-existent object type ("+_ui+")");
		return _9m;
	}
	var layer=-1;
	if(typeof(_NM)=="string")layer=_tm._gH(_u2,yyGetString(_NM));
	else layer=_tm._hH(_u2,yyGetInt32(_NM));
	if(layer!=null&&layer!=-1)
	{
		var _rm=_u2._KN(yyGetReal(_r4),yyGetReal(_s4),layer,_ui);
		_rm._O4(_SG,0,_rm,_rm);
		_EN(_rm,_IN);
		_rm._O4(_TG,0,_rm,_rm);
		return _dm(_em,_rm.id);
	}
	else 
	{
		_I3("Error: Trying to create an instance on a non-existant layer");
	}
	return _9m;
}
;

function layer_get_all()
{
	var room=_tm._um();
	var _l5=[];
	if(room==null)
	{
		return _l5;
	}
	var _vL=0;
	for(var i=0;i<room._1K.length;i++)
	{
		var layer=room._1K._F4(i);
		if(layer!=null)
		{
			if(layer._6I==false)
			{
				_l5[_vL++]=layer._Uc;
			}
		}
	}
	return _l5;
}
;

function layer_get_all_elements(_NM)
{
	var room=_tm._um();
	var layer=_vM(room,_NM);
	var _l5=[];
	var _LN=0;
	if(layer!=null)
	{
		for(var i=0;i<layer._iH.length;i++)
		{
			var _wF=layer._iH._F4(i);
			if(_wF!=null)
			{
				_l5[_LN++]=_wF._Uc;
			}
		}
	}
	return _l5;
}
;

function layer_get_name(_NM)
{
	var layer=_xM(_NM);
	if(layer!=null)
	{
		if(layer._7I==null)
		{
			return "";
		}
		else 
		{
			return layer._7I.slice(0);
		}
	}
	return "";
}
;

function layer_depth(_NM,_wj)
{
	var room=_tm._um();
	var layer=_vM(room,_NM);
	if(layer!=null)
	{
		_wj=yyGetInt32(_wj);
		if(layer.depth==_wj)
		{
			return;
		}
		_tm._9L(room,layer,_wj,false);
	}
}
;

function layer_get_element_layer(_0K)
{
	var room=_tm._um();
	var _5K=_tm._6K(room,yyGetInt32(_0K));
	if(_5K!=null)
	{
		return _5K.layer._Uc;
	}
	return -1;
}
;

function layer_get_element_type(_0K)
{
	var room=_tm._um();
	if(room==null)
	{
		return -1;
	}
	var _wF=_tm._wm(room,yyGetInt32(_0K));
	if(_wF!=null)
	{
		return _wF._yF;
	}
	return -1;
}
;

function layer_element_move(_0K,_MN)
{
	var room=_tm._um();
	var _5K=_tm._6K(room,yyGetInt32(_0K));
	if(_5K==null)
	{
		return -1;
	}
	var _NN=_tm._hH(room,yyGetInt32(_MN));
	if(_NN!=null)
	{
		_tm._3K(room,_5K._Sb,_NN);
	}
}
;

function layer_force_draw_depth(_AJ,_wj)
{
	_tm._zJ(yyGetBool(_AJ));
	_tm._BJ(yyGetInt32(_wj));
}
;

function layer_is_draw_depth_forced()
{
	return _tm._CJ()?true:false;
}
;

function layer_get_forced_depth()
{
	return _tm._DJ();
}
;

function _ON(_PN)
{
	var room=_tm._um();
	var _wF=_tm._wm(room,yyGetInt32(_PN));
	if((_wF!=null)&&(_wF._yF===_NH))return _wF;
	return null;
}

function layer_tile_exists(_NM,_QN)
{
	var room=_tm._um();
	if(room==null)
	{
		return 0;
	}
	if(arguments.length==1)
	{
		var _wF=_tm._wm(room,yyGetInt32(_NM));
		if(_wF!=null)
		{
			return 1;
		}
	}
	else 
	{
		var layer=null;
		if(typeof(_NM)=="string")layer=_tm._gH(room,yyGetString(_NM));
		else layer=_tm._hH(room,yyGetInt32(_NM));
		if(layer!=null)
		{
			var _wF=_tm._2K(layer,yyGetInt32(_QN));
			if(_wF!=null)
			{
				return 1;
			}
		}
	}
	return 0;
}
;

function layer_tile_create(_NM,_r4,_s4,_RN,_2l,_3l,_q7,_r7)
{
	var room=_tm._um();
	var layer=layer=_vM(room,_NM);
	if(layer!=null)
	{
		var _SN=new _VI();
		_SN._8w=yyGetInt32(_RN);
		_SN._KF=yyGetReal(_r4);
		_SN._MF=yyGetReal(_s4);
		_SN._YI=yyGetInt32(_2l);
		_SN._ZI=yyGetInt32(_3l);
		_SN._WI=yyGetInt32(_q7);
		_SN._XI=yyGetInt32(_r7);
		_SN._5I=true;
		_tm._rK(room,layer,_SN,room==_u2?true:false);
		return _SN._Uc;
	}
}
;

function layer_tile_destroy(_0K)
{
	var room=_tm._um();
	_tm.__J(room,yyGetInt32(_0K));
	return -1;
}
;

function layer_tile_change(_PN,_xL)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		_wF._8w=yyGetInt32(_xL);
	}
}
;

function layer_tile_xscale(_PN,scale)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		_wF._FI=yyGetReal(scale);
	}
}
;

function layer_tile_yscale(_PN,scale)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		_wF._GI=yyGetReal(scale);
	}
}
;

function layer_tile_blend(_PN,_n3)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		_wF._II=yyGetInt32(_n3);
	}
}
;

function layer_tile_alpha(_PN,alpha)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		_wF._JI=yyGetReal(alpha);
	}
}
;

function layer_tile_x(_PN,x)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		_wF._KF=yyGetReal(x);
	}
}
;

function layer_tile_y(_PN,y)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		_wF._MF=yyGetReal(y);
	}
}
;

function layer_tile_region(_PN,left,top,width,height)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		_wF._YI=yyGetInt32(left);
		_wF._ZI=yyGetInt32(top);
		_wF._WI=yyGetInt32(width);
		_wF._XI=yyGetInt32(height);
	}
}
;

function layer_tile_visible(_PN,visible)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		_wF._5I=yyGetBool(visible);
	}
}
;

function layer_tile_get_sprite(_PN)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		return _wF._8w;
	}
	return -1;
}
;

function layer_tile_get_xscale(_PN)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		return _wF._FI;
	}
	return 1;
}
;

function layer_tile_get_yscale(_PN)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		return _wF._GI;
	}
	return 1;
}
;

function layer_tile_get_blend(_PN)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		return _wF._II;
	}
	return 0;
}
;

function layer_tile_get_alpha(_PN)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		return _wF._JI;
	}
	return 0;
}
;

function layer_tile_get_x(_PN)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		return _wF._KF;
	}
	return 0;
}
;

function layer_tile_get_y(_PN)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		return _wF._MF;
	}
	return 0;
}
;

function layer_tile_get_region(_PN)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		var _l5=[];
		_l5[0]=_wF._YI;
		_l5[1]=_wF._ZI;
		_l5[2]=_wF._WI;
		_l5[3]=_wF._XI;
		return _l5;
	}
	return -1;
}
;

function layer_tile_get_visible(_PN)
{
	var _wF=_ON(_PN);
	if(_wF!=null)
	{
		return _wF._5I;
	}
	return false;
}
;

function _TN(_UN)
{
	var room=_tm._um();
	var _wF=_tm._wm(room,_UN);
	if(_wF!=null&&_wF._yF==_OH)
	{
		return _wF;
	}
	return null;
}
;

function layer_sequence_get_instance(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF==null)
	{
		return -1;
	}
	var _Uv=_KA._UK(_wF._MI);
	return _Uv!=null?_Uv:-1;
}
;

function layer_sequence_create(_kN,_VN,_WN,_XN)
{
	_XN=yyGetInt32(_XN);
	var room=_tm._um();
	var layer=null;
	if(typeof(_kN)=="string")
	{
		layer=_tm._gH(room,yyGetString(_kN));
	}
	else 
	{
		layer=_tm._hH(room,yyGetInt32(_kN));
	}
	if(layer==null)
	{
		return -1;
	}
	var sequence=_KA._YN(_XN);
	if(sequence==null)
	{
		return -1;
	}
	var _ZN=new _KI();
	_ZN._LI=_XN;
	_ZN._NI=0;
	_ZN._1J=-1;
	_ZN._OI=1;
	_ZN._PI=1;
	_ZN._KF=yyGetReal(_VN);
	_ZN._MF=yyGetReal(_WN);
	_ZN._W1=0;
	_ZN._1k=sequence.name;
	_tm._rK(room,layer,_ZN,room==_u2?true:false);
	return _ZN._Uc;
}

function layer_sequence_destroy(_UN)
{
	var room=_tm._um();
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF==null)
	{
		return -1;
	}
	var _Uv=_KA._UK(_wF._MI);
	if(_Uv!=null)
	{
		_KA._mK(_Uv,_VG);
	}
	_tm.__J(room,yyGetInt32(_UN));
}

function layer_sequence_exists(_if,_zM)
{
	var layer=_xM(_if);
	var _wF=_tm._2K(layer,yyGetInt32(_zM));
	if((_wF!=null)&&(_wF._yF===_OH))if(_wF!=null)
	{
		return true;
	}
	return false;
}
;

function layer_sequence_x(_UN,__N)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			_wF._KF=yyGetReal(__N);
			_wF._QI._1O(_2O);
		}
	}
	return -1;
}
;

function layer_sequence_y(_UN,_3O)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			_wF._MF=yyGetReal(_3O);
			_wF._QI._1O(_2O);
		}
	}
	return -1;
}
;

function layer_sequence_angle(_UN,angle)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			_wF._W1=yyGetReal(angle);
			_wF._QI._1O(_4O);
		}
	}
	return -1;
}
;

function layer_sequence_xscale(_UN,_ZH)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			_wF._OI=yyGetReal(_ZH);
			_wF._QI._1O(_5O);
		}
	}
	return -1;
}
;

function layer_sequence_yscale(_UN,__H)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			_wF._PI=yyGetReal(__H);
			_wF._QI._1O(_5O);
		}
	}
	return -1;
}
;

function layer_sequence_headpos(_UN,position)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			var _6O=_KA._YN(_0O._LI);
			var _7O=yyGetReal(position);
			_7O=_I5(_7O,0.0);
			if(_6O!=null)
			{
				var length=_6O._HL;
				_7O=_J5(_7O,length);
			}
			if((_0O._NI!=_7O)||(_0O._8O!=_7O))
			{
				_0O._NI=_7O;
				_0O._8O=_7O;
				_wF._QI._1O(_9O);
			}
		}
	}
	return -1;
}
;

function layer_sequence_headdir(_UN,direction)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			direction=yyGetReal(direction);
			if(direction!=0)
			{
				_0O._aO=Math.sign(direction);
			}
		}
	}
	return -1;
}
;

function layer_sequence_pause(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			_0O._XA();
		}
	}
	return -1;
}
;

function layer_sequence_play(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			_0O._bO();
			if(_0O._cO)
			{
				if(_0O._aO<0.0)
				{
					var _6O=_KA._YN(_0O._LI);
					if(_6O!=null)
					{
						_0O._NI=_0O._8O=(_6O._HL-1);
					}
				}
				else 
				{
					_0O._NI=_0O._8O=0.0;
				}
				_0O._cO=false;
			}
		}
	}
	return -1;
}
;

function layer_sequence_speedscale(_UN,_dO)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			_dO=yyGetReal(_dO);
			_0O._kK=_dO;
		}
	}
	return -1;
}
;

function layer_sequence_get_x(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		return _wF._KF;
	}
	return -1;
}
;

function layer_sequence_get_y(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		return _wF._MF;
	}
	return -1;
}
;

function layer_sequence_get_angle(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		return _wF._W1;
	}
	return -1;
}
;

function layer_sequence_get_xscale(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		return _wF._OI;
	}
	return -1;
}
;

function layer_sequence_get_yscale(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		return _wF._PI;
	}
	return -1;
}
;

function layer_sequence_get_headpos(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			return _0O._NI;
		}
	}
	return -1;
}
;

function layer_sequence_get_headdir(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			return _0O._aO;
		}
	}
	return -1;
}
;

function layer_sequence_get_sequence(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			var _6O=_KA._YN(_0O._LI);
			if(_6O!=null)
			{
				return _6O;
			}
		}
	}
	return -1;
}
;

function layer_sequence_is_paused(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			return _0O._TA;
		}
	}
	return -1;
}
;

function layer_sequence_is_finished(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			return _0O._cO;
		}
	}
	return -1;
}
;

function layer_sequence_get_speedscale(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			return _0O._kK;
		}
	}
	return -1;
}
;

function layer_sequence_get_length(_UN)
{
	var _wF=_TN(yyGetInt32(_UN));
	if(_wF!=null)
	{
		var _0O=_KA._UK(_wF._MI);
		if(_0O!=null)
		{
			var _6O=_KA._YN(_0O._LI);
			if(_6O!=null)
			{
				return _6O._HL;
			}
		}
	}
	return -1;
}
;

function sequence_instance_exists(_eO)
{
	var room=_tm._um();
	if(room!=null)
	{
		for(var _fO=0;_fO<room._gO.length;++_fO)
		{
			var _hO=room._gO[_fO];
			var _iO=_tm._wm(room,_hO);
			if(_eO==_iO._LI)
			{
				return true;
			}
		}
	}
	return false;
}
;

function fx_create(_jO)
{
	if(arguments.length!=1)
	{
		_I3("fx_create() - wrong number of arguments");
		return -1;
	}
	var _kO=_lO._mO(yyGetString(_jO),false);
	return _kO._nO();
}

function fx_get_name(_iI)
{
	if(arguments.length!=1)
	{
		_I3("fx_get_name() - wrong number of arguments");
		return -1;
	}
	if(_lO._oO(_iI)==false)
	{
		_I3("fx_get_name() - parameter should be an FX object");
		return -1;
	}
	return _iI.instance._SL.pName;
}

function fx_get_parameter_names(_iI)
{
	if(arguments.length!=1)
	{
		_I3("fx_get_parameter_names() - wrong number of arguments");
		return -1;
	}
	if(_lO._oO(_iI)==false)
	{
		_I3("fx_get_parameter_names() - parameter should be an FX object");
		return -1;
	}
	return _iI.instance._pO();
}

function fx_get_parameter(_iI,_O2)
{
	if(arguments.length!=2)
	{
		_I3("fx_get_parameter() - wrong number of arguments");
		return -1;
	}
	if(_lO._oO(_iI)==false)
	{
		_I3("fx_get_parameter() - first parameter should be an FX object");
		return -1;
	}
	return _iI.instance._qO(_O2);
}

function fx_get_parameters(_iI)
{
	if(arguments.length!=1)
	{
		_I3("fx_get_parameters() - wrong number of arguments");
		return -1;
	}
	if(_lO._oO(_iI)==false)
	{
		_I3("fx_get_parameters() - parameter should be an FX object");
		return -1;
	}
	return _iI.instance._rO();
}

function fx_get_single_layer(_iI)
{
	if(arguments.length!=1)
	{
		_I3("fx_get_single_layer() - wrong number of arguments");
		return -1;
	}
	if(_lO._oO(_iI)==false)
	{
		_I3("fx_get_single_layer() - parameter should be an FX object");
		return -1;
	}
	if((_iI.instance==null)||(_iI.instance._sO==null))
	{
		_I3("fx_get_single_layer() - FX object is corrupted");
		return -1;
	}
	var _tO=_uO;
	if(_iI.instance._SL.type==_vO)
	{
		var _tO="gml"+_uO;
		if((typeof g_var2obf!=="undefined")&&(g_var2obf[_uO]!=undefined))
		{
			_tO=g_var2obf[_uO];
		}
	}
	return _iI.instance._sO[_tO]==1?true:false;
}

function fx_set_parameter(_iI,_O2,_C2)
{
	if(arguments.length<3)
	{
		_I3("fx_set_parameter() - wrong number of arguments");
		return -1;
	}
	if(_lO._oO(_iI)==false)
	{
		_I3("fx_set_parameter() - first parameter should be an FX object");
		return -1;
	}
	if(arguments.length==3)
	{
		_iI.instance._wO(_O2,_C2);
	}
	else 
	{
		var _l5=Array.prototype.slice.call(arguments,2);
		_iI.instance._wO(_O2,_l5);
	}
}

function fx_set_parameters(_iI,_xO)
{
	if(arguments.length!=2)
	{
		_I3("fx_set_parameters() - wrong number of arguments");
		return -1;
	}
	if(_lO._oO(_iI)==false)
	{
		_I3("fx_set_parameters() - first parameter should be an FX object");
		return -1;
	}
	if(typeof _xO!=="object")
	{
		_I3("fx_set_parameters() - second parameter should be a parameter struct");
	}
	_iI.instance._yO(_xO);
}

function fx_set_single_layer(_iI,_C2)
{
	if(arguments.length<2)
	{
		_I3("fx_set_single_layer() - wrong number of arguments");
		return -1;
	}
	if(_lO._oO(_iI)==false)
	{
		_I3("fx_set_single_layer() - first parameter should be an FX object");
		return -1;
	}
	if((_iI.instance==null)||(_iI.instance._sO==null))
	{
		_I3("fx_set_single_layer() - FX object is corrupted");
		return -1;
	}
	_iI.instance._zO(_uO,_AO,1,[yyGetBool(_C2)]);
}

function layer_set_fx(_BO,_iI)
{
	if(arguments.length!=2)
	{
		_I3("layer_set_fx() - wrong number of arguments");
		return -1;
	}
	if(_lO._oO(_iI)==false)
	{
		_I3("layer_set_fx() - second parameter should be an FX object");
		return -1;
	}
	var _sm=_tm._um();
	var _vF=_vM(_sm,_BO);
	if(_vF==null)
	{
		return -1;
	}
	_vF._hI(_iI);
	_sm._CO(_vF._Uc);
}

function layer_get_fx(_BO)
{
	if(arguments.length!=1)
	{
		_I3("layer_get_fx() - wrong number of arguments");
		return -1;
	}
	var _sm=_tm._um();
	var _vF=_vM(_sm,_BO);
	if(_vF==null)
	{
		return -1;
	}
	var _DO=_vF._kI();
	if(_DO!==null)
	{
		return _DO;
	}
	return -1;
}

function layer_clear_fx(_BO)
{
	if(arguments.length!=1)
	{
		_I3("layer_get_fx() - wrong number of arguments");
		return -1;
	}
	var _sm=_tm._um();
	var _vF=_vM(_sm,_BO);
	if(_vF==null)
	{
		return -1;
	}
	_vF._jI();
	_sm._EO(_vF._Uc);
}

function layer_enable_fx(_BO,_Np)
{
	if(arguments.length!=2)
	{
		_I3("layer_enable_fx() - wrong number of arguments");
		return -1;
	}
	var _sm=_tm._um();
	var _vF=_vM(_sm,_BO);
	if(_vF==null)
	{
		return -1;
	}
	_vF._dI=_Np;
}

function layer_fx_is_enabled(_BO)
{
	if(arguments.length!=1)
	{
		_I3("layer_fx_is_enabled() - wrong number of arguments");
		return 1;
	}
	var _sm=_tm._um();
	var _vF=_vM(_sm,_BO);
	if(_vF==null)
	{
		return true;
	}
	return _vF._dI;
}
var _FO=0x7fff;
var g_GMLMathEpsilon=1e-5;

function floor(_C2)
{
	return Math.floor(yyGetReal(_C2));
}

function _GO(_HO)
{
	_HO=yyGetReal(_HO);
	var i=Math.sign(_HO)*Math.floor(Math.abs(_HO));
	if(_HO<0)
	{
		var _At=_HO-i;
		if((i&1)==1)
		{
			if(_At<=-0.5)
			{
				return i-1;
			}
			else 
			{
				return i;
			}
		}
		else 
		{
			if(_At>=-0.5)
			{
				return i;
			}
			else 
			{
				return i-1;
			}
		}
	}
	else 
	{
		var _At=_HO-i;
		if((i&1)==1)
		{
			if(_At>=0.5)
			{
				return i+1;
			}
			else 
			{
				return i;
			}
		}
		else 
		{
			if(_At<=0.5)
			{
				return i;
			}
			else 
			{
				return i+1;
			}
		}
	}
}

function _IO(_HO)
{
	return ~~_HO;
}
var round=_GO;
var _Si=_GO;

function abs(_HO)
{
	return Math.abs(yyGetReal(_HO));
}

function cos(_HO)
{
	return Math.cos(yyGetReal(_HO));
}

function dcos(_HO)
{
	return cos(yyGetReal(_HO)*0.0174532925);
}

function sin(_HO)
{
	return Math.sin(yyGetReal(_HO));
}

function dsin(_HO)
{
	return sin(yyGetReal(_HO)*0.0174532925);
}

function tan(_HO)
{
	return Math.tan(yyGetReal(_HO));
}

function dtan(_HO)
{
	return tan(yyGetReal(_HO)*0.0174532925);
}

function lengthdir_x(_JO,_HG)
{
	var _Z3=(yyGetReal(_JO)*Math.cos(yyGetReal(_HG)*_M5/180.0));
	var _KO=Math.round(_Z3);
	var frac=_Z3-_KO;
	if(Math.abs(frac)<0.0001)return _KO;
	return _Z3;
}

function lengthdir_y(_JO,_HG)
{
	var _Z3=-(yyGetReal(_JO)*Math.sin(yyGetReal(_HG)*_M5/180.0));
	var _KO=Math.round(_Z3);
	var frac=_Z3-_KO;
	if(Math.abs(frac)<0.0001)return _KO;
	return _Z3;
}

function point_direction(_X5,_Y5,_p5,_q5)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	var x=_p5-_X5;
	var y=_q5-_Y5;
	if(x===0)
	{
		if(y>0)return 270.0;
		else if(y<0)return 90.0;
		else return 0.0;
	}
	else 
	{
		var _vC=180.0*Math.atan2(y,x)/_M5;
		_vC=(~~round(_vC*1000000))/1000000.0;
		if(_vC<=0.0)
		{
			return -_vC;
		}
		else 
		{
			return(360.0-_vC);
		}
	}
}

function point_distance(_X5,_Y5,_p5,_q5)
{
	var _ha=yyGetReal(_p5)-yyGetReal(_X5);
	var _ia=yyGetReal(_q5)-yyGetReal(_Y5);
	return Math.sqrt(_ha*_ha+_ia*_ia);
}

function point_distance_3d(_X5,_Y5,_LO,_p5,_q5,_MO)
{
	return Math.sqrt(_NO(yyGetReal(_p5)-yyGetReal(_X5))+_NO(yyGetReal(_q5)-yyGetReal(_Y5))+_NO(yyGetReal(_MO)-yyGetReal(_LO)));
}

function _J5(_HO,_iG)
{
	if(_HO<_iG)return _HO;
	else return _iG;
}

function _I5(_HO,_iG)
{
	if(_HO>_iG)return _HO;
	else return _iG;
}

function max()
{
	var _Di=arguments;
	var _Ei=arguments.length;
	if(_Ei==0)return 0;
	var _w5=yyGetReal(_Di[0]);
	for(var i=1;i<_Ei;i++)
	{
		var _OO=yyGetReal(_Di[i]);
		if(_w5<_OO)_w5=_OO;
	}
	return _w5;
}

function _PO(_HO,_iG,_QO)
{
	return max(_HO,_iG,_QO);
}

function min()
{
	var _Di=arguments;
	var _Ei=arguments.length;
	if(_Ei==0)return 0;
	var _w5=yyGetReal(_Di[0]);
	for(var i=1;i<_Ei;i++)
	{
		var _OO=yyGetReal(_Di[i]);
		if(_w5>_OO)_w5=_OO;
	}
	return _w5;
}

function _RO(_HO,_iG,_QO)
{
	return min(_HO,_iG,_QO);
}
var state=[];
var _SO=0;
var _TO=_UO(0);
var _VO=0xDA442D24;

function _UO(_WO)
{
	var _hg=_WO;
	for(var i=0;i<16;i++)
	{
		_hg=(((_hg*214013+2531011)>>16)&0x7fffffff)|0;
		state[i]=~~_hg;
	}
	_SO=0;
	_TO=_WO;
	return _TO;
}

function _XO(_YO)
{
	if(_YO)_VO=0xDA442D20;
	else _VO=0xDA442D24;
}

function _ZO()
{
	var _i3,_h3,c,_en;
	_i3=state[_SO];
	c=state[(_SO+13)&15];
	_h3=_i3^c^(_i3<<16)^(c<<15);
	c=state[(_SO+9)&15];
	c^=(c>>11);
	_i3=state[_SO]=_h3^c;
	_en=_i3^((_i3<<5)&_VO);
	_SO=(_SO+15)&15;
	_i3=state[_SO];
	state[_SO]=_i3^_h3^_en^(_i3<<2)^(_h3<<18)^(c<<28);
	return((state[_SO]&0x7fffffff)/2147483647.0);
}

function random(_qb)
{
	var _f3=_ZO();
	return _f3*yyGetReal(_qb);
}

function irandom(_qb)
{
	_qb=yyGetInt32(_qb);
	var sign=_qb<0?-1:1;
	var _f3=_ZO()*(_qb+sign);
	_ZO();
	return ~~_f3;
}

function random_range(__O,_0P)
{
	__O=yyGetReal(__O);
	_0P=yyGetReal(_0P);
	if(__O==_0P)
	{
		return __O;
	}
	var _1P,_2P;
	if(__O>_0P)
	{
		_1P=_0P;
		_2P=__O;
	}
	else 
	{
		_1P=__O;
		_2P=_0P;
	}
	var _3P=_ZO();
	var result=_1P+(_3P*(_2P-_1P));
	_ZO();
	return result;
}

function random_set_seed(_C2)
{
	_UO(yyGetInt32(_C2));
}

function randomize()
{
	var _en=new Date();
	var _K5=_en.getMilliseconds();
	_K5=(_K5&0xffffffff)^((_K5>>16)&0xffff)^((_K5<<16)&0xffff0000);
	return _UO(_K5);
}
var randomise=randomize;

function irandom_range(__O,_0P)
{
	__O=yyGetInt32(__O);
	_0P=yyGetInt32(_0P);
	var _1P,_2P;
	if(__O>_0P)
	{
		_1P=_0P;
		_2P=__O;
	}
	else 
	{
		_1P=__O;
		_2P=_0P;
	}
	var _x5=_1P|0;
	var _z5=_2P|0;
	var result=_x5+~~random(_z5-_x5+1);
	return result;
}

function random_get_seed()
{
	return _TO;
}

function choose()
{
	var _Di=arguments;
	var _Ei=arguments.length;
	if(_Ei==0)return 0;
	var index=Math.floor(random(_Ei));
	return _Di[index];
}

function sign(_r4)
{
	_r4=yyGetReal(_r4);
	if(_r4==0)return 0;
	if(_r4<0)return -1;
	return 1;
}

function ceil(_r4)
{
	return Math.ceil(yyGetReal(_r4));
}

function frac(_r4)
{
	_r4=yyGetReal(_r4);
	return _r4-~~_r4;
}

function sqrt(_r4)
{
	_r4=yyGetReal(_r4);
	if(_r4>=0)return Math.sqrt(_r4);
	else _I3("Cannot apply sqrt to negative number.");
}

function sqr(_r4)
{
	_r4=yyGetReal(_r4);
	return _r4*_r4;
}

function power(_r4,_9F)
{
	return Math.pow(yyGetReal(_r4),yyGetReal(_9F));
}

function exp(_r4)
{
	return Math.exp(yyGetReal(_r4));
}

function ln(_r4)
{
	return Math.log(yyGetReal(_r4));
}

function log2(_r4)
{
	return Math.log(yyGetReal(_r4))/Math.LN2;
}

function log10(_r4)
{
	return Math.log(yyGetReal(_r4))/Math.LN10;
}

function logn(_9F,_r4)
{
	return Math.log(yyGetReal(_r4))/Math.log(yyGetReal(_9F));
}

function arcsin(_C2)
{
	var _0d=yyGetReal(_C2);
	if(_4P(_0d,-1.0))
	{
		_0d=-1.0;
	}
	else if(_4P(_0d,1.0))
	{
		_0d=1.0;
	}
	if(_0d<-1.0||_0d>1.0)
	{
		_I3("Value "+_0d+" is not within valid range [-1.0, 1.0]: arcsin()");
	}
	return Math.asin(_0d);
}

function darcsin(_r4)
{
	return arcsin(_r4)*57.2957795;
}

function arccos(_C2)
{
	var _0d=yyGetReal(_C2);
	if(_4P(_0d,-1.0))
	{
		_0d=-1.0;
	}
	else if(_4P(_0d,1.0))
	{
		_0d=1.0;
	}
	if(_0d<-1.0||_0d>1.0)
	{
		_I3("Value "+_0d+" is not within valid range [-1.0, 1.0]: arccos()");
	}
	return Math.acos(_0d);
}

function darccos(_r4)
{
	return arccos(_r4)*57.2957795;
}

function arctan(_C2)
{
	return Math.atan(yyGetReal(_C2));
}

function darctan(_r4)
{
	return Math.atan(yyGetReal(_r4))*57.2957795;
}

function arctan2(_s4,_r4)
{
	return Math.atan2(yyGetReal(_s4),yyGetReal(_r4));
}

function darctan2(_s4,_r4)
{
	return arctan2(_s4,_r4)*57.2957795;
}

function degtorad(_r4)
{
	return yyGetReal(_r4)*0.0174532925;
}

function radtodeg(_r4)
{
	return yyGetReal(_r4)*57.2957795;
}

function mean()
{
	var _Di=arguments;
	var _Ei=arguments.length;
	if(_Ei==0)return 0;
	var _w5=yyGetReal(_Di[0]);
	for(var i=1;i<_Ei;i++)
	{
		_w5+=yyGetReal(_Di[i]);
	}
	return(_w5/_Ei);
}

function median()
{
	var _Di=arguments;
	var _Ei=arguments.length;
	if(_Ei==0)return 0;
	var _l5=[];
	for(var i=0;
i<_Ei;i++)
	{
		_l5[i]=yyGetReal(_Di[i]);
	}
	_l5.sort(
function(_i3,_h3)
	{
		return _i3-_h3;
	}
	);
	return _l5[~~(_Ei/2)];
}

function dot_product(_X5,_Y5,_p5,_q5)
{
	return(yyGetReal(_X5)*yyGetReal(_p5)+yyGetReal(_Y5)*yyGetReal(_q5));
}

function dot_product_3d(_X5,_Y5,_LO,_p5,_q5,_MO)
{
	return(yyGetReal(_X5)*yyGetReal(_p5)+yyGetReal(_Y5)*yyGetReal(_q5)+yyGetReal(_LO)*yyGetReal(_MO));
}

function math_set_epsilon(_5P)
{
	var _Z3=yyGetReal(_5P);
	if((_Z3>=0)&&(_Z3<1))
	{
		if(_Z3==0)_Z3=0.00000000001;
		g_GMLMathEpsilon=_Z3;
	}
}

function math_get_epsilon()
{
	return g_GMLMathEpsilon;
}

function dot_product_normalised(_X5,_Y5,_p5,_q5)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	var _6P=Math.sqrt(_X5*_X5+_Y5*_Y5);
	var _7P=Math.sqrt(_p5*_p5+_q5*_q5);
	return(_X5*_p5+_Y5*_q5)/(_6P*_7P);
}
var dot_product_normalized=dot_product_normalised;

function dot_product_3d_normalised(_X5,_Y5,_LO,_p5,_q5,_MO)
{
	_X5=yyGetReal(_X5);
	_Y5=yyGetReal(_Y5);
	_LO=yyGetReal(_LO);
	_p5=yyGetReal(_p5);
	_q5=yyGetReal(_q5);
	_MO=yyGetReal(_MO);
	var _6P=Math.sqrt(_X5*_X5+_Y5*_Y5+_LO*_LO);
	var _7P=Math.sqrt(_p5*_p5+_q5*_q5+_MO*_MO);
	return(_X5*_p5+_Y5*_q5+_LO*_MO)/(_6P*_7P);
}
var dot_product_3d_normalized=dot_product_3d_normalised;

function is_real(_r4)
{
	if(typeof(_r4)=="number")return true;
	else return false;
}

function is_numeric(_r4)
{
	var _r3=false;
	switch(typeof(_r4))
	{
		case "number":case "boolean":_r3=true;
		break;
		case "object":if(_r4 instanceof Long)
		{
			_r3=true;
		}
		break;
	}
	return _r3;
}

function is_bool(_r4)
{
	if(typeof(_r4)=="boolean")return true;
	else return false;
}

function is_undefined(_r4)
{
	if(typeof(_r4)=="undefined")return true;
	else return false;
}

function is_int32(_r4)
{
	if((typeof(_r4)==="number")&&(~~_r4===_r4))return true;
	else return false;
}

function is_int64(_r4)
{
	if(_r4 instanceof Long)return true;
	else return false;
}

function is_ptr(_r4)
{
	return(typeof(_r4)=="object"&&(_r4 instanceof ArrayBuffer))?true:false;
}

function is_struct(_r4)
{
	return((typeof _r4==="object")&&(_r4.__yyIsGMLObject))?true:false;
}

function is_nan(_r4)
{
	try
	{
		if(is_ptr(_r4))return false;
		if(is_struct(_r4))return true;
		if(is_method(_r4))return true;
		value=yyGetReal(_r4);
		return Number.isNaN(value);
	}
	catch
	{
		return true;
	}
}

function is_infinity(_r4)
{
	try
	{
		_r4=yyGetReal(_r4);
		return !Number.isFinite(_r4)&&!Number.isNaN(_r4);
	}
	catch
	{
		return false;
	}
}

function static_get(_hg)
{
	var _r3=undefined;
	switch(typeof(_hg))
	{
		case "number":var _8P=yyGetInt32(_hg);
		if(_8P>=100000)
		{
			_9P=JSON_game.Scripts[_8P-100000];
			_r3=_9P.prototype;
			_r3.__yyIsGMLObject=true;
		}
		break;
		case "function":_r3=_hg.prototype;
		_r3.__yyIsGMLObject=true;
		break;
		case "object":_r3=Object.getPrototypeOf(_hg);
		if(_hg.__yyIsGMLObject)_r3.__yyIsGMLObject=true;
		break;
	}
	return _r3;
}

function static_set(_en,_hg)
{
	if((typeof(_hg)=="object")&&(typeof(_en)=="object"))
	{
		Object.setPrototypeOf(_en,_hg);
	}
}

function YYIsInstanceof(_r4,_qb)
{
	var _r3=false;
	if((typeof(_r4)=="object")&&(_r4.__yyIsGMLObject===true))
	{
		var _9P=undefined;
		var _8P=yyGetInt32(_qb);
		if(_8P>=100000)_9P=JSON_game.Scripts[_8P-100000];
		if(_9P)
		{
			var c=Object.getPrototypeOf(_r4);
			var _aP=_9P.prototype;
			while(c&&!_r3) 
			{
				if(c===_aP)
				{
					_r3=true;
					break;
				}
				c=Object.getPrototypeOf(c);
			}
		}
	}
	return _r3;
}

function YYInstanceof(_r4)
{
	var type=typeof(_r4);
	var _r3=undefined;
	switch(type)
	{
		case "function":_r3="function";
		break;
		case "object":if(_r4 instanceof Function)_r3="function";
		else if(_r4.__type==="[instance]")
		{
			_r3="instance";
		}
		else if(_r4.__type==="[weakref]")
		{
			_r3="weakref";
		}
		else if(_r4.__type!==undefined)
		{
			_r3=_r4.__type;
			if(_r3.startsWith("gml_Script_"))
			{
				_r3=_r3.substring(11);
			}
			if(_r3.startsWith("___struct___"))
			{
				_r3="struct";
			}
		}
		break;
		default :break;
	}
	return _r3;
}

function YYTypeof(_r4)
{
	var _r3=typeof(_r4);
	switch(_r3)
	{
		case "boolean":return "bool";
		case "function":return "method";
		case "object":return(_r4 instanceof Array)?"array":(_r4 instanceof ArrayBuffer)?"ptr":(_r4 instanceof Long)?"int64":"struct";
		default :return _r3;
	}
}

function int64(_r4)
{
	if(_r4==undefined)
	{
		_I3("int64() argument is undefined");
	}
	else if(_r4==null)
	{
		_I3("int64() argument is unset");
	}
	else if(_r4 instanceof Array)
	{
		_I3("int64() argument is array");
	}
	if((_r4) instanceof Long)
	{
		return _r4;
	}
	switch(typeof(_r4))
	{
		case "boolean":return Long._bP(_r4?1:0,false);
		break;
		default :return Long._bP(_r4,false);
		break;
	}
}

function ptr(_r4)
{
	if(_r4 instanceof ArrayBuffer)return _r4;
	if(_r4 instanceof Array)_I3("ptr argument is an array");
	if(_r4===undefined)_I3("ptr argument is undefined");
	var _r3=new ArrayBuffer(8);
	var _Tp=new DataView(_r3);
	if(typeof _r4!=="string")
	{
		_Tp.setFloat64(0,yyGetReal(_r4));
	}
	return _r3;
}

function _cP(_Bw)
{
	var _r3=undefined;
	if((typeof _Bw=="string")&&_Bw.startsWith("ref "))
	{
		var _dP=_Bw.indexOf(" ",4);
		var _Dw=_Bw.substring(4,_dP);
		var _Fw=_Bw.substring(_dP+1);
		var _Gw=Number(_Fw);
		var type=_Hw(_Dw);
		_r3=_dm(type,_Gw);
	}
	return _r3;
}

function is_string(_r4)
{
	if(typeof(_r4)=="string")return 1;
	else return 0;
}

function is_array(_r4)
{
	if(_r4 instanceof Array)return 1;
	else return 0;
}

function array_length_1d(_r4)
{
	var _r3=undefined;
	if(_r4 instanceof Array)
	{
		_r3=_r4.length;
	}
	return _r3;
}
var array_length=array_length_1d;

function array_length_2d(_r4,_5P)
{
	_5P=yyGetInt32(_5P);
	var _r3=0;
	if((_r4 instanceof Array)&&(_5P>=0)&&(_5P<_r4.length))
	{
		var _ut=_r4[_5P];
		if(_ut instanceof Array)
		{
			_r3=_ut.length;
		}
	}
	return _r3;
}

function array_height_2d(_r4)
{
	var _r3=0;
	if((_r4 instanceof Array))
	{
		_r3=_r4.length;
	}
	return _r3;
}

function clamp(_5k,_eP,_Vx)
{
	_5k=yyGetReal(_5k);
	_eP=yyGetReal(_eP);
	_Vx=yyGetReal(_Vx);
	if(_5k<_eP)_5k=_eP;
	if(_5k>_Vx)_5k=_Vx;
	return _5k;
}

function lerp(_fP,_gP,_Lt)
{
	_fP=yyGetReal(_fP);
	_gP=yyGetReal(_gP);
	return _fP+((_gP-_fP)*yyGetReal(_Lt));
}

function angle_difference(_ih,_ji)
{
	_ih=yyGetReal(_ih);
	_ji=yyGetReal(_ji);
	return((((_ih-_ji)%360.0)+540.0)%360.0)-180.0;
}

function _4P(_fP,_gP)
{
	var _At=_fP-_gP;
	return abs(_At)<=g_GMLMathEpsilon;
}
var _hP=new RegExp('^'+'[-+]?'+'(?:[0-9]{0,30}\\.)?'+'[0-9]{1,30}'+'(?:[Ee][-+]?[1-2]?[0-9])?');

function yyCompareVal(_fP,_gP,_ah,_iP)
{
	var _r3=undefined;
	_iP=(_iP==undefined)?true:_iP;
	var _jP=false;
	if(_fP instanceof _gm)
	{
		if(!(_gP instanceof _gm))
		{
			_fP=_fP.value;
		}
		else _jP=true;
	}
	else if(_gP instanceof _gm)
	{
		_gP=_gP.value;
	}
	if(_jP)
	{
		var _K5=_fP.type-_gP.type;
		if(_K5==0)
		{
			var _Z3=_fP.value-_gP.value;
			_r3=(_Z3==0)?0:(_Z3<0)?-1:1;
		}
		else 
		{
			_r3=(_K5<0)?-1:1;
		}
	}
	else if((typeof _fP=="number")&&(typeof _gP=="number"))
	{
		var _At=_fP-_gP;
		if(Number.isNaN(_At))
		{
			_At=(_fP==_gP)?0:_At;
		}
		_r3=abs(_At)<=_ah?0:(_At<0.0)?-1:1;
	}
	else if(typeof _fP=="string"&&typeof _gP=="string")
	{
		_r3=(_fP===_gP)?0:((_fP>_gP)?1:-1);
	}
	else if(_fP===undefined&&_gP===undefined)
	{
		_r3=0;
	}
	else if(_fP instanceof ArrayBuffer&&_gP instanceof ArrayBuffer)
	{
		_r3=_fP==_gP?0:1;
	}
	else if(_fP instanceof Array&&_gP instanceof Array)
	{
		_r3=_fP.length-_gP.length;
		if(_r3==0)
		{
			_r3=_fP===_gP?0:1;
		}
	}
	else if(_fP instanceof Long&&_gP instanceof Long)
	{
		_r3=(_fP.sub(_gP))._kP();
	}
	else if((_fP===undefined&&_gP instanceof Array)||(_gP===undefined&&_fP instanceof Array))
	{
		_r3=1;
	}
	else if(typeof _fP=="object"&&typeof _gP=="object"&&_fP.__yyIsGMLObject&&_gP.__yyIsGMLObject)
	{
		_r3=_fP==_gP?0:1;
	}
	else if(typeof _fP=="object"&&typeof _gP=="object")
	{
		_r3=_fP==_gP?0:1;
	}
	else if(typeof _fP=="function"&&typeof _gP=="function")
	{
		_r3=_fP==_gP?0:1;
	}
	if(_r3===undefined)
	{
		if(typeof _fP=="boolean")
		{
			_fP=_fP?1:0;
		}
		else if(typeof _fP=="string")
		{
			_fP=_fP.trim();
			var match=_fP.match(_hP);
			if(match!=null)
			{
				_fP=Number(match);
				if(Number.isNaN(_fP))_r3=1;
			}
			else _r3=Number.NaN;
		}
		else if(_fP instanceof Long)
		{
			_fP=_fP._kP();
		}
		else if(_fP instanceof Array)
		{
			_r3=1;
			if(_iP)_I3("illegal array use")		}
		else if(_fP===undefined)
		{
			_r3=-2;
		}
		if(typeof _gP=="boolean")
		{
			_gP=_gP?1:0;
		}
		else if(typeof _gP=="string")
		{
			_gP=_gP.trim();
			var match=_gP.match(_hP);
			if(match!=null)
			{
				_gP=Number(match);
				if(Number.isNaN(_gP))_r3=1;
			}
			else _r3=Number.NaN;
		}
		else if(_gP instanceof Long)
		{
			_gP=_gP._kP();
		}
		else if(_gP instanceof Array)
		{
			if(_iP)_I3("illegal array use")		}
		else if(_gP===undefined)
		{
			_r3=-2;
		}
		if(_r3===undefined)
		{
			if((typeof _fP=="number")&&(typeof _gP=="number"))
			{
				var _At=_fP-_gP;
				if(Number.isNaN(_At))
				{
					_At=(_fP==_gP)?0:_At;
				}
				_r3=abs(_At)<=_ah?0:(_At<0.0)?-1:1;
			}
			else 
			{
				_r3=1;
				if(typeof _fP=="number")
				{
					_r3=-1;
				}
			}
		}
	}
	return _r3;
}

function yyfplus(_fP,_gP)
{
	if(_fP instanceof Long&&_gP instanceof Long)
	{
		return _fP.add(_gP);
	}
	else if(_fP instanceof Long)
	{
		_fP=_fP._kP();
	}
	else if(_gP instanceof Long)
	{
		_gP=_gP._kP();
	}
	if((typeof _fP==="string")&&(typeof _gP==="string"))return _fP+_gP;
	if((typeof _fP==="string")&&(typeof _gP!=="string"))_I3("unable to add string to "+typeof _gP);
	return yyGetReal(_fP)+yyGetReal(_gP);
}

function yyfminus(_fP,_gP)
{
	if(_fP instanceof Long&&_gP instanceof Long)
	{
		return _fP.sub(_gP);
	}
	else if(_fP instanceof Long)
	{
		_fP=_fP._kP();
	}
	else if(_gP instanceof Long)
	{
		_gP=_gP._kP();
	}
	return yyGetReal(_fP)-yyGetReal(_gP);
}

function yyftime(_fP,_gP)
{
	if(_fP instanceof Long&&_gP instanceof Long)
	{
		return _fP._lP(_gP);
	}
	else if(_fP instanceof Long)
	{
		_fP=_fP._kP();
	}
	else if(_gP instanceof Long)
	{
		_gP=_gP._kP();
	}
	if((typeof _fP==="number")&&(typeof _gP==="string"))
	{
		var _r3="";
		for(var _u5=yyGetReal(_fP)-1;_u5>=0;--_u5)
		{
			_r3+=_gP;
		}
		return _r3;
	}
	else return yyGetReal(_fP)*yyGetReal(_gP);
}

function yyfdivide(_fP,_gP)
{
	if((typeof _fP==="number")&&(typeof _gP==="number"))
	{
		return _fP/_gP;
	}
	else if(_fP instanceof Long&&_gP instanceof Long)
	{
		return _fP._dv(_gP);
	}
	if(_fP instanceof Long)
	{
		_fP=_fP._kP();
	}
	if(_gP instanceof Long)
	{
		_gP=_gP._kP();
	}
	var _la=yyGetReal(_fP);
	var _04=yyGetReal(_gP);
	var _r3=_la/_04;
	return _r3;
}

function yyfmod(_fP,_gP)
{
	if((_fP instanceof Long)&&(_gP instanceof Long))
	{
		return _fP._mP(_gP);
	}
	if(_gP instanceof Long)
	{
		_gP=_gP._kP();
	}
	if(_fP instanceof Long)
	{
		_fP=_fP._kP();
	}
	var _04=yyGetReal(_gP);
	if(_04==0)
	{
		_I3("unable to mod with zero");
	}
	return yyGetReal(_fP)%_04;
}

function yyfdiv(_fP,_gP)
{
	if(_fP instanceof Long)
	{
		return _fP._dv(_gP);
	}
	else if(_gP instanceof Long)
	{
		_gP=_gP._kP();
	}
	if(_gP==0)_I3("divide by zero");
	var _la=yyGetReal(_fP);
	var _04=yyGetReal(_gP);
	var _nP=Number.isNaN(_la);
	var _oP=Number.isNaN(_04);
	if(_nP||_oP)
	{
		if(_nP&&_oP)return 1;
		if(_nP)
		{
			if(Number.isFinite(_04))return _la;
			else return 1;
		}
		if(_oP)
		{
			if(Number.isFinite(_la))return _04;
			else return 1;
		}
	}
	if(_la===_04)return 1;
	return ~~(~~_la/~~_04);
}

function yyfnotequal(_fP,_gP)
{
	var _r3=yyCompareVal(_fP,_gP,g_GMLMathEpsilon,false);
	return _r3!=0;
}

function yyfequal(_fP,_gP)
{
	var _r3=yyCompareVal(_fP,_gP,g_GMLMathEpsilon,false);
	return _r3==0;
}

function yyfless(_fP,_gP)
{
	var _r3=yyCompareVal(_fP,_gP,g_GMLMathEpsilon);
	if(Number.isNaN(_r3))
	{
		_I3("unable to compare "+string(_fP)+" to "+string(_gP));
	}
	return _r3==-2?false:_r3<0;
}

function yyflessequal(_fP,_gP)
{
	var _r3=yyCompareVal(_fP,_gP,g_GMLMathEpsilon);
	if(Number.isNaN(_r3))
	{
		_I3("unable to compare "+string(_fP)+" to "+string(_gP));
	}
	return _r3==-2?false:_r3<=0;
}

function yyfgreater(_fP,_gP)
{
	var _r3=yyCompareVal(_fP,_gP,g_GMLMathEpsilon);
	if(Number.isNaN(_r3))
	{
		_I3("unable to compare "+string(_fP)+" to "+string(_gP));
	}
	return _r3==-2?false:_r3>0;
}

function yyfgreaterequal(_fP,_gP)
{
	var _r3=yyCompareVal(_fP,_gP,g_GMLMathEpsilon);
	if(Number.isNaN(_r3))
	{
		_I3("unable to compare "+string(_fP)+" to "+string(_gP));
	}
	return _r3==-2?false:_r3>=0;
}

function yyfand(_fP,_gP)
{
	return yyGetBool(_fP)&&yyGetBool(_gP);
}

function yyfor(_fP,_gP)
{
	return yyGetBool(_fP)||yyGetBool(_gP);
}

function yyfxor(_fP,_gP)
{
	_gP=yyGetBool(_gP);
	return yyGetBool(_fP)?!_gP:_gP;
}

function yyfbitand(_fP,_gP)
{
	if((typeof _fP==="number")&&(typeof _gP==="number"))return _fP&_gP;
	else if((_fP instanceof Long)&&(_gP instanceof Long))
	{
		return _fP._pP(_gP);
	}
	else if(_fP instanceof Long)
	{
		return _fP._pP(yyGetInt64(_gP));
	}
	else if(_gP instanceof Long)
	{
		return _gP._pP(yyGetInt64(_fP));
	}
	else if(typeof _fP=="number")return _fP&yyGetInt32(_gP);
	else if(typeof _gP=="number")return yyGetInt32(_fP)&_gP;
	return yyGetInt32(_fP)&yyGetInt32(_gP);
}

function yyfbitor(_fP,_gP)
{
	if((typeof _fP=="number")&&(typeof _gP=="number"))return _fP|_gP;
	else if((_fP instanceof Long)&&(_gP instanceof Long))
	{
		return _fP._qP(_gP);
	}
	else if(_fP instanceof Long)
	{
		return _fP._qP(yyGetInt64(_gP));
	}
	else if(_gP instanceof Long)
	{
		return _gP._qP(yyGetInt64(_fP));
	}
	else if(typeof _fP=="number")return _fP|yyGetInt32(_gP);
	else if(typeof _gP=="number")return yyGetInt32(_fP)|_gP;
	return yyGetInt32(_fP)|yyGetInt32(_gP);
}

function yyfbitxor(_fP,_gP)
{
	if((typeof _fP=="number")&&(typeof _gP=="number"))return _fP^_gP;
	else if((_fP instanceof Long)&&(_gP instanceof Long))
	{
		return _fP._rP(_gP);
	}
	else if(_fP instanceof Long)
	{
		return _fP._rP(yyGetInt64(_gP));
	}
	else if(_gP instanceof Long)
	{
		return _gP._rP(yyGetInt64(_fP));
	}
	else if(typeof _fP=="number")return _fP^yyGetInt32(_gP);
	else if(typeof _gP=="number")return yyGetInt32(_fP)^_gP;
	return yyGetInt32(_fP)^yyGetInt32(_gP);
}

function yyfbitshiftleft(_fP,_qH)
{
	var shift=yyGetInt32(_qH);
	var _sP=(_fP<0);
	if(_sP)_fP=-_fP;
	if(typeof _fP=="number")
	{
		_fP=new Long(_fP);
	}
	else if(_fP instanceof Long)
	{
	}
	else 
	{
		_fP=yyGetInt64(_fP);
	}
	var _r3=0;
	if(shift>=64)_r3=0;
	else _r3=_fP._tP(shift);
	if(_sP)_r3=-_r3;
	return _r3;
}

function yyfbitshiftright(_fP,_qH)
{
	var shift=yyGetInt32(_qH);
	var _sP=(_fP<0);
	if(_sP)_fP=-_fP;
	if(typeof _fP=="number")
	{
		_fP=new Long(_fP);
	}
	else if(_fP instanceof Long)
	{
	}
	else 
	{
		_fP=yyGetInt64(_fP);
	}
	var _r3=0;
	if(shift>=64)_r3=0;
	else _r3=_fP._uP(shift);
	if(_sP)_r3=-_r3;
	return _r3;
}

function extension_exists(_vP)
{
	_vP=yyGetString(_vP);
	const extension=_nu.Extensions.find(_cj=>_cj["name"]==_vP);
	return extension!==undefined;
}

function extension_get_version(_vP)
{
	_vP=yyGetString(_vP);
	try
	{
		const extension=_nu.Extensions.find(_cj=>_cj["name"]==_vP);
		if(extension===undefined)return undefined;
		return extension.version;
	}
	catch(_wu)
	{
		show_debug_message("extension_get_version :: caught unhandled exception "+_wu.message);
	}
	return undefined;
}

function extension_get_option_value(_vP,_wP)
{
	_vP=yyGetString(_vP);
	_wP=yyGetString(_wP);
	try
	{
		if(_nu.ExtensionOptions!==undefined)
		{
			if(_nu.ExtensionOptions[_vP]!==undefined)
			{
				return _nu.ExtensionOptions[_vP][_wP];
			}
		}
	}
	catch(_wu)
	{
		show_debug_message("extension_get_option_value :: caught unhandled exception "+_wu.message);
	}
	return undefined;
}

function extension_get_option_count(_vP)
{
	_vP=yyGetString(_vP);
	try
	{
		if(_nu.ExtensionOptions!==undefined)
		{
			if(_nu.ExtensionOptions[_vP]!==undefined)
			{
				return Object.keys(_nu.ExtensionOptions[_vP]).length;
			}
		}
	}
	catch(_wu)
	{
		show_debug_message("extension_get_option_count :: caught unhandled exception "+_wu.message);
	}
	return 0;
}

function extension_get_option_names(_vP)
{
	_vP=yyGetString(_vP);
	try
	{
		if(_nu.ExtensionOptions!==undefined)
		{
			if(_nu.ExtensionOptions[_vP]!==undefined)
			{
				return Object.keys(_nu.ExtensionOptions[_vP]);
			}
		}
	}
	catch(_wu)
	{
		show_debug_message("extension_get_option_names :: caught unhandled exception "+_wu.message);
	}
	return [];
}

function extension_get_options(_vP)
{
	_vP=yyGetString(_vP);
	try
	{
		if(_nu.ExtensionOptions!==undefined)
		{
			if(_nu.ExtensionOptions[_vP]!==undefined)
			{
				var data=_nu.ExtensionOptions[_vP];
				var _xP=new _Yx();
				Object.keys(data).forEach(_Sb=>
				{
					variable_struct_set(_xP,_Sb,data[_Sb])				}
				);
				return _xP;
			}
		}
	}
	catch(_wu)
	{
		show_debug_message("extension_get_options :: caught unhandled exception "+_wu.message);
	}
	return 
	{
	}
	;
}

function gc_collect()
{
}

function gc_enable(_Np)
{
}

function gc_is_enabled()
{
	return true;
}

function gc_get_stats()
{
	var _yP=new Object();
	_yP.__yyIsGMLObject=true;
	Object.defineProperties(_yP,
	{
		gmlobjects_touched:
		{
			enumerable:true,get :
function()
			{
				return 0;
			}
		}
		,gmlobjects_collected:
		{
			enumerable:true,get :
function()
			{
				return 0;
			}
		}
		,gmltraversal_time:
		{
			enumerable:true,get :
function()
			{
				return 0;
			}
		}
		,gmlcollection_time:
		{
			enumerable:true,get :
function()
			{
				return 0;
			}
		}
		,gmlgeneration_collected:
		{
			enumerable:true,get :
function()
			{
				return 0;
			}
		}
		,gmlgc_frame:
		{
			enumerable:true,get :
function()
			{
				return 0;
			}
		}
		,gmlnum_generations:
		{
			enumerable:true,get :
function()
			{
				return 0;
			}
		}
		,gmlnum_objects_in_generation:
		{
			enumerable:true,get :
function()
			{
				var _QB=[];
				return _QB;
			}
		}
		,	}
	);
	return _yP;
}
var _zP=30,_AP=10,_BP=3,_CP=true;

function _DP(_6m,_r4,_s4,_HN,_EP)
{
	if(_HN==_aH)
	{
		if(_EP)
		{
			return place_empty(_6m,_r4,_s4);
		}
		else 
		{
			return place_free(_6m,_r4,_s4);
		}
	}
	else 
	{
		return(instance_place(_6m,_r4,_s4,_HN)==_9m);
	}
}

function _FP(_6m,_r4,_s4,_GP,_HN,_EP)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_GP=yyGetReal(_GP);
	_EP=yyGetBool(_EP);
	var _on=false;
	var _zm=0.0;
	var _HP=0.0;
	var _IP=0.0;
	if((_6m.x==_r4)&&(_6m.y==_s4))return true;
	_zm=sqrt(_NO(_6m.x-_r4)+_NO(_6m.y-_s4));
	if(_zm<=_GP)
	{
		_HP=_r4;
		_IP=_s4;
		_on=true;
	}
	else 
	{
		_HP=_6m.x+_GP*(_r4-_6m.x)/_zm;
		_IP=_6m.y+_GP*(_s4-_6m.y)/_zm;
		_on=false;
	}
	if(!_DP(_6m,_HP,_IP,_HN,_EP))
	{
		return _on;
	}
	_6m.direction=point_direction(_6m.x,_6m.y,_HP,_IP);
	_6m._8c(_HP,_IP);
	return _on;
}

function mp_linear_step(_6m,_r4,_s4,_GP,_EP)
{
	return _FP(_6m,_r4,_s4,_GP,_aH,_EP);
}

function mp_linear_step_object(_6m,_r4,_s4,_GP,_ui)
{
	return _FP(_6m,_r4,_s4,_GP,_ui,true);
}

function _JP(_6m,_r4,_s4,_GP,_DG,_EP)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_GP=yyGetReal(_GP);
	_DG=yyGetInt32(_DG);
	_EP=yyGetBool(_EP);
	var _on=false;
	var _zm=0.0;
	var _KP=0.0;
	var _LP=0.0;
	if((_6m.x==_r4)&&(_6m.y==_s4))
	{
		_on=true;
		return _on;
	}
	_zm=sqrt(_NO(_6m.x-_r4)+_NO(_6m.y-_s4));
	if(_zm<=_GP)
	{
		if(_DP(_6m,_r4,_s4,_DG,_EP))
		{
			_6m.direction=point_direction(_6m.x,_6m.y,_r4,_s4);
			_6m._8c(_r4,_s4);
		}
		_on=true;
		return _on;
	}
	_KP=point_direction(_6m.x,_6m.y,_r4,_s4);
	_LP=0;
	_on=false;
	while(_LP<180) 
	{
		if(_MP(_KP-_LP,_6m,_GP,_DG,_EP))
		{
			return _on;
		}
		if(_MP(_KP+_LP,_6m,_GP,_DG,_EP))
		{
			return _on;
		}
		_LP=_LP+_AP;
	}
	if(_CP)
	{
		_6m.direction=_6m.direction+_zP;
	}
	return _on;
}

function mp_potential_step(_6m,_r4,_s4,_GP,_EP)
{
	return _JP(_6m,_r4,_s4,_GP,_aH,_EP);
}

function mp_potential_step_object(_6m,_r4,_s4,_GP,_ui)
{
	return _JP(_6m,_r4,_s4,_GP,_ui,true);
}

function mp_potential_settings(_6m,_NP,_OP,_PP,_QP)
{
	_zP=_I5(1,yyGetReal(_NP));
	_AP=_I5(1,yyGetReal(_OP));
	_BP=_I5(1,yyGetReal(_PP));
	_CP=yyGetBool(_QP);
}

function _RP(_g6,_r4,_s4,_IG,_HN,_EP)
{
	var _on=false;
	var _zm=0.0;
	var _HP=0.0;
	var _IP=0.0;
	if((_g6.x==_r4)&&(_g6.y==_s4))
	{
		return true;
	}
	_zm=Math.sqrt(_NO(_g6.x-_r4)+_NO(_g6.y-_s4));
	if(_zm<=_IG)
	{
		_HP=_r4;
		_IP=_s4;
		_on=true;
	}
	else 
	{
		_HP=_g6.x+_IG*(_r4-_g6.x)/_zm;
		_IP=_g6.y+_IG*(_s4-_g6.y)/_zm;
		_on=false;
	}
	if(!_DP(_g6,_HP,_IP,_HN,_EP))
	{
		return _on;
	}
	_g6.direction=point_direction(_g6.x,_g6.y,_HP,_IP);
	_g6._8c(_HP,_IP);
	return _on;
}

function _SP(_6m,_TP,_UP,_VP,_GP,_HN,_EP)
{
	var _O5=0.0;
	var _Q5=0.0;
	var _vC=0.0;
	var _WP=0.0;
	var _XP=0.0;
	var _on=false;
	var _YP=_IA.Paths[yyGetInt32(_TP)];
	if(!_YP)return _on;
	if(_GP<=0.0)return _on;
	_O5=_6m.x;
	_Q5=_6m.y;
	_vC=_6m.direction;
	_YP._se();
	_YP._ZP(__P);
	_YP._0Q(false);
	_YP._1Q(_O5,_Q5,100);
	_on=true;
	while(1) 
	{
		_WP=_6m.x;
		_XP=_6m.y;
		if(true==_RP(_6m,_UP,_VP,_GP,_HN,_EP))
		{
			break;
		}
		if((_6m.x==_WP)&&(_6m.y==_XP))
		{
			_on=false;
			break;
		}
		_YP._1Q(_6m.x,_6m.y,100);
	}
	if(true==_on)
	{
		_YP._1Q(_UP,_VP,100);
	}
	_6m._8c(_O5,_Q5);
	_6m.direction=_vC;
	return _on;
}

function mp_linear_path(_6m,_TP,_UP,_VP,_GP,_EP)
{
	return _SP(_6m,yyGetInt32(_TP),yyGetReal(_UP),yyGetReal(_VP),yyGetReal(_GP),_aH,yyGetBool(_EP));
}

function mp_linear_path_object(_6m,_TP,_UP,_VP,_GP,_ui)
{
	return _SP(_6m,yyGetInt32(_TP),yyGetReal(_UP),yyGetReal(_VP),yyGetReal(_GP),yyGetInt32(_ui),true);
}

function _2Q(_3Q,_4Q)
{
	var _on=0.0;
	while(_3Q<=0.0) 
	{
		_3Q=_3Q+360.0;
	}
	while(_3Q>=360.0) 
	{
		_3Q=_3Q-360.0;
	}
	while(_4Q<0.0) 
	{
		_4Q=_4Q+360.0;
	}
	while(_4Q>=360.0) 
	{
		_4Q=_4Q-360.0;
	}
	_on=_4Q-_3Q;
	if(_on<0.0)
	{
		_on=-_on;
	}
	if(_on>180.0)
	{
		_on=360.0-_on;
	}
	return _on;
}

function _MP(_HG,_g6,_IG,_HN,_EP)
{
	var _5Q=0.0;
	var _6Q=0.0;
	if(_2Q(_HG,_g6.direction)>_zP)
	{
		return false;
	}
	_5Q=_g6.x+_IG*_BP*Math.cos(Math.PI*_HG/180.0);
	_6Q=_g6.y-_IG*_BP*Math.sin(Math.PI*_HG/180.0);
	if(!_DP(_g6,_5Q,_6Q,_HN,_EP))
	{
		return false;
	}
	_5Q=_g6.x+_IG*Math.cos(Math.PI*_HG/180.0);
	_6Q=_g6.y-_IG*Math.sin(Math.PI*_HG/180.0);
	if(!_DP(_g6,_5Q,_6Q,_HN,_EP))
	{
		return false;
	}
	_g6.direction=_HG;
	_g6._8c(_5Q,_6Q);
	return true;
}

function _7Q(_g6,_r4,_s4,_IG,_HN,_EP)
{
	var _on=false;
	var _zm=0.0;
	var _KP=0.0;
	var _LP=0.0;
	if((_g6.x==_r4)&&(_g6.y==_s4))
	{
		return true;
	}
	_zm=Math.sqrt(_NO(_g6.x-_r4)+_NO(_g6.y-_s4));
	if(_zm<=_IG)
	{
		if(true==_DP(_g6,_r4,_s4,_HN,_EP))
		{
			_g6.direction=point_direction(_g6.x,_g6.y,_r4,_s4);
			_g6._8c(_r4,_s4);
		}
		return true;
	}
	_KP=point_direction(_g6.x,_g6.y,_r4,_s4);
	_LP=0;
	_on=false;
	while(_LP<180) 
	{
		if(_MP(_KP-_LP,_g6,_IG,_HN,_EP))
		{
			return _on;
		}
		if(_MP(_KP+_LP,_g6,_IG,_HN,_EP))
		{
			return _on;
		}
		_LP=_LP+_AP;
	}
	if(_CP)
	{
		_g6.direction=_g6.direction+_zP;
	}
	return _on;
}

function _8Q(_g6,_TP,_UP,_VP,_GP,_9Q,_HN,_EP)
{
	var _on=false;
	var _aQ=0.0;
	var _O5=0.0;
	var _Q5=0.0;
	var _vC=0.0;
	var _YP=_IA.Paths[_TP];
	if(!_YP)return _on;
	if(_9Q<1)
	{
		return _on;
	}
	if(_GP<=0)
	{
		return _on;
	}
	_aQ=Math.sqrt(_NO(_UP-_g6.x)+_NO(_VP-_g6.y))*_9Q;
	_O5=_g6.x;
	_Q5=_g6.y;
	_vC=_g6.direction;
	_YP._se();
	_YP._ZP(__P);
	_YP._0Q(false);
	_YP._1Q(_O5,_Q5,100);
	_on=true;
	var _bQ=0;
	var _cQ=0;
	var _dQ=0;
	while(1) 
	{
		if(true==_7Q(_g6,_UP,_VP,_GP,_HN,_EP))break;
		_YP._1Q(_g6.x,_g6.y,100);
		_bQ=_cQ;
		_cQ=_YP.length;
		if(_cQ>_aQ)
		{
			_on=false;
			break;
		}
		if(_cQ==_bQ)
		{
			++_dQ;
			if(_dQ>100)
			{
				_on=false;
				break;
			}
		}
		else 
		{
			_dQ=0;
		}
	}
	if(_on)
	{
		_YP._1Q(_UP,_VP,100);
	}
	_g6._8c(_O5,_Q5);
	_g6.direction=_vC;
	return _on;
}

function mp_potential_path(_6m,_TP,_UP,_VP,_GP,_eQ,_EP)
{
	return _8Q(_6m,yyGetInt32(_TP),yyGetReal(_UP),yyGetReal(_VP),yyGetReal(_GP),yyGetReal(_eQ),_aH,yyGetBool(_EP));
}

function mp_potential_path_object(_6m,_TP,_UP,_VP,_GP,_eQ,_ui)
{
	return _8Q(_6m,yyGetInt32(_TP),yyGetReal(_UP),yyGetReal(_VP),yyGetReal(_GP),yyGetReal(_eQ),yyGetInt32(_ui),true);
}
/*@constructor */
function _fQ(_2l,_3l,_gQ,_hQ,_iQ,_jQ)
{
	this._kQ=_2l;
	this._lQ=_3l;
	this._ni=~~_gQ;
	this._oi=~~_hQ;
	this._mQ=_iQ;
	this._nQ=_jQ;
	this._ri=[];
	this._se();
}
;
_fQ.prototype._se=
function()
{
	var _oQ=this._ni*this._oi;
	for(var i=0;i<_oQ;i++)
	{
		this._ri[i]=0;
	}
}
;
_fQ.prototype._pQ=
function(_r4,_s4,_C2)
{
	if(_r4<0||_r4>=this._ni)return;
	if(_s4<0||_s4>=this._oi)return;
	this._ri[(_r4*this._oi)+_s4]=_C2;
}
;
_fQ.prototype._qQ=
function(_r4,_s4)
{
	if(_r4<0||_r4>=this._ni)return -1;
	if(_s4<0||_s4>=this._oi)return -1;
	return this._ri[(_r4*this._oi)+_s4];
}
;
_fQ.prototype._rQ=
function(_X5,_Y5,_p5,_q5,_C2)
{
	var _lC=~~((_J5(_X5,_p5)-this._kQ)/this._mQ);
	if(_lC<0)_lC=0;
	var _mC=~~((_I5(_X5,_p5)-this._kQ)/this._mQ);
	if(_mC>=this._ni)_mC=this._ni-1;
	var _nC=~~((_J5(_Y5,_q5)-this._lQ)/this._nQ);
	if(_nC<0)_nC=0;
	var _oC=~~((_I5(_Y5,_q5)-this._lQ)/this._nQ);
	if(_oC>=this._oi)_oC=this._oi-1;
	for(var i=_lC;i<=_mC;i++)
	{
		var index=i*this._oi;
		for(var _05=_nC;_05<=_oC;_05++)
		{
			this._ri[index+_05]=_C2;
		}
	}
}
;

function mp_grid_create(_2l,_3l,_sQ,_tQ,_iQ,_jQ)
{
	var _H5=new _fQ(yyGetInt32(_2l),yyGetInt32(_3l),yyGetInt32(_sQ),yyGetInt32(_tQ),yyGetInt32(_iQ),yyGetInt32(_jQ));
	return _mi._ce(_H5);
}

function mp_grid_destroy(_Qe)
{
	_mi._lh(yyGetInt32(_Qe));
}

function mp_grid_clear_all(_Qe)
{
	var _uQ=_mi._F4(yyGetInt32(_Qe));
	if(_uQ)
	{
		_uQ._se();
		return;
	}
	_I3("Error: invalid mp_grid ID (mp_grid_clear_all)");
}

function mp_grid_clear_cell(_Qe,_fh,_qb)
{
	var _uQ=_mi._F4(yyGetInt32(_Qe));
	if(_uQ)
	{
		_uQ._pQ(yyGetInt32(_fh),yyGetInt32(_qb),0);
		return;
	}
	_I3("Error: invalid mp_grid ID (mp_grid_clear_cell)");
}

function mp_grid_clear_rectangle(_Qe,_X5,_Y5,_p5,_q5)
{
	var _uQ=_mi._F4(yyGetInt32(_Qe));
	if(_uQ)
	{
		_uQ._rQ(yyGetInt32(_X5),yyGetInt32(_Y5),yyGetInt32(_p5),yyGetInt32(_q5),0);
		return;
	}
	_I3("Error: invalid mp_grid ID (mp_grid_clear_rectangle)");
}

function mp_grid_add_cell(_Qe,_r4,_s4)
{
	var _uQ=_mi._F4(yyGetInt32(_Qe));
	if(_uQ)
	{
		_uQ._pQ(yyGetInt32(_r4),yyGetInt32(_s4),-1);
		return;
	}
	_I3("Error: invalid mp_grid ID (mp_grid_add_cell)");
}

function mp_grid_get_cell(_Qe,_r4,_s4)
{
	var _uQ=_mi._F4(yyGetInt32(_Qe));
	if(_uQ)
	{
		return _uQ._qQ(yyGetInt32(_r4),yyGetInt32(_s4));
	}
	return -1;
}

function mp_grid_add_rectangle(_Qe,_X5,_Y5,_p5,_q5)
{
	var _uQ=_mi._F4(yyGetInt32(_Qe));
	if(_uQ)
	{
		_uQ._rQ(yyGetInt32(_X5),yyGetInt32(_Y5),yyGetInt32(_p5),yyGetInt32(_q5),-1);
		return;
	}
	_I3("Error: invalid mp_grid ID (mp_grid_add_rectangle)");
}

function mp_grid_add_instances(_g6,_Qe,_ui,_ah)
{
	var _uQ=_mi._F4(yyGetInt32(_Qe));
	if(_uQ)
	{
		var _vQ=0.0001;
		if(_wQ)
		{
			_vQ=0.0;
		}
		var _xQ=GetWithArray(yyGetInt32(_ui));
		for(var _yQ=0;_yQ<_xQ.length;_yQ++)
		{
			var _rm=_xQ[_yQ];
			if(_rm.marked||!_rm.active)continue;
			if(_rm._oG)_rm._pG();
			var _lC=~~((_rm._7G.left+_vQ-_uQ._kQ)/_uQ._mQ);
			if(_lC<0)_lC=0;
			var _mC=~~((_rm._7G.right-_vQ-_uQ._kQ)/_uQ._mQ);
			if(_mC>=_uQ._ni)_mC=_uQ._ni-1;
			var _nC=~~((_rm._7G.top+_vQ-_uQ._lQ)/_uQ._nQ);
			if(_nC<0)_nC=0;
			var _oC=~~((_rm._7G.bottom-_vQ-_uQ._lQ)/_uQ._nQ);
			if(_oC>=_uQ._oi)_oC=_uQ._oi-1;
			for(var i=_lC;i<=_mC;i++)
			{
				for(var _05=_nC;_05<=_oC;_05++)
				{
					if(!yyGetBool(_ah))
					{
						_uQ._ri[i*_uQ._oi+_05]=-1;
						continue;
					}
					if(_uQ._ri[i*_uQ._oi+_05]<0)continue;
					if(_rm._Em(_uQ._kQ+i*_uQ._mQ,_uQ._lQ+_05*_uQ._nQ,_uQ._kQ+(i+1)*_uQ._mQ-1,_uQ._lQ+(_05+1)*_uQ._nQ-1,true))
					{
						_uQ._ri[i*_uQ._oi+_05]=-1;
					}
				}
			}
		}
		return;
	}
	_I3("Error: invalid mp_grid ID (mp_grid_add_instances)");
}
var mp_grid_draw=_zQ;

function _zQ(_Qe)
{
	var _uQ=_mi._F4(yyGetInt32(_Qe));
	if(_uQ)
	{
		_59.globalAlpha=_lb;
		var _Ip=_Gk(0xff0000,1.0);
		var _Jp=_Gk(0x00ff00,1.0);
		for(var x=0;x<_uQ._ni;x++)
		{
			for(var y=0;y<_uQ._oi;y++)
			{
				var _n3=_Jp;
				if(_uQ._ri[x*_uQ._oi+y]<0)
				{
					_n3=_Ip;
				}
				_59.fillStyle=_n3;
				_59._VB((_uQ._kQ+x*_uQ._mQ),(_uQ._lQ+y*_uQ._nQ),_uQ._mQ,_uQ._nQ);
			}
		}
		return;
	}
	_I3("Error: invalid mp_grid ID (mp_grid_draw)");
}

function mp_grid_path(_6m,_Qe,_TP,_AQ,_BQ,_CQ,_DQ,_EQ)
{
	_AQ=yyGetInt32(_AQ);
	_BQ=yyGetInt32(_BQ);
	_CQ=yyGetInt32(_CQ);
	_DQ=yyGetInt32(_DQ);
	_EQ=yyGetBool(_EQ);
	var _FQ,_GQ,_HQ,_IQ,i,_05,_0d,_en,_O5,_Q5,_JQ,_KQ,_LQ,_MQ,_NQ,_OQ,_PQ,_QQ,_RQ;
	var _on=false;
	var _uQ=_mi._F4(yyGetInt32(_Qe));
	var _YP=_IA.Paths[yyGetInt32(_TP)];
	if(!_YP||!_uQ)
	{
		return _on;
	}
	if((_AQ<_uQ._kQ)||(_AQ>=(_uQ._kQ+_uQ._ni*_uQ._mQ)))
	{
		return _on;
	}
	if((_BQ<_uQ._lQ)||(_BQ>=_uQ._lQ+_uQ._oi*_uQ._nQ))
	{
		return _on;
	}
	_FQ=~~((_AQ-_uQ._kQ)/_uQ._mQ);
	_GQ=~~((_BQ-_uQ._lQ)/_uQ._nQ);
	if(_uQ._ri[_FQ*_uQ._oi+_GQ]<0)
	{
		return _on;
	}
	if((_CQ<_uQ._kQ)||(_CQ>=_uQ._kQ+_uQ._ni*_uQ._mQ))
	{
		return _on;
	}
	if((_DQ<_uQ._lQ)||(_DQ>=_uQ._lQ+_uQ._oi*_uQ._nQ))
	{
		return _on;
	}
	_HQ=~~((_CQ-_uQ._kQ)/_uQ._mQ);
	_IQ=~~((_DQ-_uQ._lQ)/_uQ._nQ);
	if(_uQ._ri[_HQ*_uQ._oi+_IQ]<0)
	{
		return _on;
	}
	_uQ._ri[_FQ*_uQ._oi+_GQ]=1;
	_RQ=new _SQ();
	_RQ._TQ((_FQ*_uQ._oi+_GQ));
	while(_RQ._UQ(1)) 
	{
		_0d=_RQ._VQ();
		_O5=~~(_0d/_uQ._oi);
		_Q5=~~(_0d%_uQ._oi);
		if((_O5==_HQ)&&(_Q5==_IQ))
		{
			_on=true;
			break;
		}
		_en=_uQ._ri[_0d]+1;
		_JQ=(_O5>0)&&(_Q5<_uQ._oi-1)&&(_uQ._ri[(_O5-1)*_uQ._oi+(_Q5+1)]==0);
		_KQ=(_Q5<_uQ._oi-1)&&(_uQ._ri[(_O5)*_uQ._oi+(_Q5+1)]==0);
		_LQ=(_O5<_uQ._ni-1)&&(_Q5<_uQ._oi-1)&&(_uQ._ri[(_O5+1)*_uQ._oi+(_Q5+1)]==0);
		_MQ=(_O5>0)&&(_uQ._ri[(_O5-1)*_uQ._oi+(_Q5)]==0);
		_NQ=(_O5<_uQ._ni-1)&&(_uQ._ri[(_O5+1)*_uQ._oi+(_Q5)]==0);
		_OQ=(_O5>0)&&(_Q5>0)&&(_uQ._ri[(_O5-1)*_uQ._oi+(_Q5-1)]==0);
		_PQ=(_Q5>0)&&(_uQ._ri[(_O5)*_uQ._oi+(_Q5-1)]==0);
		_QQ=(_O5<_uQ._ni-1)&&(_Q5>0)&&(_uQ._ri[(_O5+1)*_uQ._oi+(_Q5-1)]==0);
		if(_MQ)
		{
			_uQ._ri[(_O5-1)*_uQ._oi+_Q5]=_en;
			_RQ._TQ(~~((_O5-1)*_uQ._oi+_Q5));
		}
		if(_NQ)
		{
			_uQ._ri[(_O5+1)*_uQ._oi+_Q5]=_en;
			_RQ._TQ(~~((_O5+1)*_uQ._oi+_Q5));
		}
		if(_PQ)
		{
			_uQ._ri[_O5*_uQ._oi+_Q5-1]=_en;
			_RQ._TQ(~~(_O5*_uQ._oi+_Q5-1));
		}
		if(_KQ)
		{
			_uQ._ri[_O5*_uQ._oi+_Q5+1]=_en;
			_RQ._TQ(~~(_O5*_uQ._oi+_Q5+1));
		}
		if(_EQ&&_JQ&&_KQ&&_MQ)
		{
			_uQ._ri[(_O5-1)*_uQ._oi+_Q5+1]=_en;
			_RQ._TQ(~~((_O5-1)*_uQ._oi+_Q5+1));
		}
		if(_EQ&&_OQ&&_PQ&&_MQ)
		{
			_uQ._ri[(_O5-1)*_uQ._oi+_Q5-1]=_en;
			_RQ._TQ(~~((_O5-1)*_uQ._oi+_Q5-1));
		}
		if(_EQ&&_LQ&&_KQ&&_NQ)
		{
			_uQ._ri[(_O5+1)*_uQ._oi+_Q5+1]=_en;
			_RQ._TQ(~~((_O5+1)*_uQ._oi+_Q5+1));
		}
		if(_EQ&&_QQ&&_PQ&&_NQ)
		{
			_uQ._ri[(_O5+1)*_uQ._oi+_Q5-1]=_en;
			_RQ._TQ(~~((_O5+1)*_uQ._oi+_Q5-1));
		}
	}
	_RQ=undefined;
	if(_on)
	{
		_YP._se();
		_YP._WQ=__P;
		_YP.closed=false;
		_YP._1Q(_CQ,_DQ,100);
		_O5=_HQ;
		_Q5=_IQ;
		while((_O5!=_FQ)||(_Q5!=_GQ)) 
		{
			_0d=_uQ._ri[_O5*_uQ._oi+_Q5];
			_JQ=(_O5>0)&&(_Q5<_uQ._oi-1)&&(_uQ._ri[(_O5-1)*_uQ._oi+(_Q5+1)]==_0d-1);
			_KQ=(_Q5<_uQ._oi-1)&&(_uQ._ri[(_O5)*_uQ._oi+(_Q5+1)]==_0d-1);
			_LQ=(_O5<_uQ._ni-1)&&(_Q5<_uQ._oi-1)&&(_uQ._ri[(_O5+1)*_uQ._oi+(_Q5+1)]==_0d-1);
			_MQ=(_O5>0)&&(_uQ._ri[(_O5-1)*_uQ._oi+(_Q5)]==_0d-1);
			_NQ=(_O5<_uQ._ni-1)&&(_uQ._ri[(_O5+1)*_uQ._oi+(_Q5)]==_0d-1);
			_OQ=(_O5>0)&&(_Q5>0)&&(_uQ._ri[(_O5-1)*_uQ._oi+(_Q5-1)]==_0d-1);
			_PQ=(_Q5>0)&&(_uQ._ri[(_O5)*_uQ._oi+(_Q5-1)]==_0d-1);
			_QQ=(_O5<_uQ._ni-1)&&(_Q5>0)&&(_uQ._ri[(_O5+1)*_uQ._oi+(_Q5-1)]==_0d-1);
			if(_MQ)_O5=_O5-1;
			else if(_NQ)_O5=_O5+1;
			else if(_PQ)_Q5=_Q5-1;
			else if(_KQ)_Q5=_Q5+1;
			else if(_EQ&&_JQ)
			{
				_O5=_O5-1;
				_Q5=_Q5+1;
			}
			else if(_EQ&&_LQ)
			{
				_O5=_O5+1;
				_Q5=_Q5+1;
			}
			else if(_EQ&&_OQ)
			{
				_O5=_O5-1;
				_Q5=_Q5-1;
			}
			else if(_EQ&&_QQ)
			{
				_O5=_O5+1;
				_Q5=_Q5-1;
			}
			;
			if((_O5!=_FQ)||(_Q5!=_GQ))
			{
				_YP._1Q(~~(_uQ._kQ+_O5*_uQ._mQ+_uQ._mQ/2),~~(_uQ._lQ+_Q5*_uQ._nQ+_uQ._nQ/2),100);
			}
		}
		;
		_YP._1Q(_AQ,_BQ,100);
		_YP._XQ();
	}
	;
	for(i=0;i<_uQ._ni;i++)
	{
		for(_05=0;_05<_uQ._oi;_05++)
		{
			if(_uQ._ri[i*_uQ._oi+_05]>0)_uQ._ri[i*_uQ._oi+_05]=0;
		}
	}
	return _on;
}

function mp_grid_to_ds_grid(_ih,_ji)
{
	_ih=yyGetInt32(_ih);
	_ji=yyGetInt32(_ji);
	var _YQ=_kh._u7;
	var _ZQ=_mi._u7;
	if((_ih<0)||(_ih>=_ZQ)||(_ji<0)||(_ji>=_YQ))
	{
		_I3("Error: Invalid source or destination grid");
		return;
	}
	var _jh=_kh._F4(_ji);
	var _li=_mi._F4(_ih);
	if(_li==null||_jh==null)
	{
		_I3("Error: Invalid source or destination grid");
		return;
	}
	var w=_li._ni;
	var h=_li._oi;
	var _pi=_jh._xb;
	var _qi=_jh._yb;
	if(w!=_pi||h!=_qi)
	{
		_I3("Error: Grid sizes do not match (mp_grid_to_ds_grid) ");
		return;
	}
	for(var y=0;y<h;++y)
	{
		for(var x=0;x<w;++x)
		{
			_jh._gh[x+(y*_jh._xb)]=_li._ri[(x*_li._oi)+y];
		}
	}
}

function place_free(_6m,_r4,_s4)
{
	var _O5,_Q5,_on,__Q;
	_on=true;
	_O5=_6m.x;
	_Q5=_6m.y;
	_6m._8c(yyGetReal(_r4),yyGetReal(_s4));
	var _Qi=_u2._0R();
	for(var _Uv=0;_Uv<_Qi.length;_Uv++)
	{
		__Q=_Qi[_Uv];
		if(__Q.solid)
		{
			if(_6m._1R(__Q,true))
			{
				_on=false;
				break;
			}
		}
	}
	_6m._8c(_O5,_Q5);
	return _on;
}

function place_empty(_6m,_r4,_s4,_ui)
{
	if(is_undefined(_ui))_ui=_aH;
	var _ta=_xG(_6m,_r4,_s4,_ui);
	if(_ta<0)return true;
	return false;
}

function place_meeting(_6m,_r4,_s4,_ui)
{
	var _ta=_xG(_6m,_r4,_s4,_ui);
	if(_ta<0)
	{
		return false;
	}
	else return true;
}

function place_snapped(_g6,_2R,_3R)
{
	_2R=yyGetReal(_2R);
	_3R=yyGetReal(_3R);
	if(_2R>0)
	{
		if(Math.abs(_g6.x-_2R*_Si(_g6.x/_2R))>=0.001)
		{
			return false;
		}
	}
	if(_3R>0)
	{
		if(Math.abs(_g6.y-_3R*_Si(_g6.y/_3R))>=0.001)
		{
			return false;
		}
	}
	return true;
}

function move_random(_g6,_2R,_3R)
{
	var i=0;
	var x=0.0;
	var y=0.0;
	var _4R;
	var _5R;
	var _6R;
	var _7R;
	var _8R=0;
	var _9R=0;
	_4R=0;
	_5R=_u2._GD();
	_6R=0;
	_7R=_u2._HD();
	if(true==sprite_exists(_g6.sprite_index)||true==sprite_exists(_g6.mask_index))
	{
		var _uG=_g6._aR();
		_4R=_Si(_g6.x-_uG.left);
		_5R=_Si(_5R+_g6.x-_uG.right);
		_6R=_Si(_g6.y-_uG.top);
		_7R=_Si(_7R+_g6.y-_uG.bottom);
	}
	_8R=_Si(yyGetReal(_2R));
	_9R=_Si(yyGetReal(_3R));
	for(i=1;i<100;i++)
	{
		x=_4R+_bR(_5R-_4R);
		if(_8R>0)
		{
			x=_8R*floor(x/_8R);
		}
		y=_6R+_bR(_7R-_6R);
		if(_9R>0)
		{
			y=_9R*floor(y/_9R);
		}
		if(true==place_free(_g6,x,y))
		{
			_g6._8c(x,y);
			return;
		}
	}
}

function move_snap(_6m,_2R,_3R)
{
	_2R=yyGetReal(_2R);
	_3R=yyGetReal(_3R);
	if(_2R>0)_6m.x=_Si(_6m.x/_2R)*_2R;
	if(_3R>0)_6m.y=_Si(_6m.y/_3R)*_3R;
	_6m._oG=true;
}

function move_wrap(_g6,_cR,_dR,_eR)
{
	_eR=yyGetReal(_eR);
	if(yyGetBool(_cR))
	{
		if(_g6.x<-_eR)
		{
			_g6._8c(_g6.x+_u2._GD()+2*_eR,_g6.y);
		}
		if(_g6.x>_u2._GD()+_eR)
		{
			_g6._8c(_g6.x-_u2._GD()-2*_eR,_g6.y);
		}
	}
	if(yyGetBool(_dR))
	{
		if(_g6.y<-_eR)
		{
			_g6._8c(_g6.x,_g6.y+_u2._HD()+2*_eR);
		}
		if(_g6.y>_u2._HD()+_eR)
		{
			_g6._8c(_g6.x,_g6.y-_u2._HD()-2*_eR);
		}
	}
}

function move_towards_point(_6m,_r4,_s4,_IG)
{
	_6m.hspeed=yyGetReal(_r4)-_6m.x;
	_6m.vspeed=yyGetReal(_s4)-_6m.y;
	_6m.speed=yyGetReal(_IG);
}

function _fR(_6m,_r4,_s4,_gR)
{
	if(_gR)
	{
		return place_empty(_6m,_r4,_s4);
	}
	else 
	{
		return place_free(_6m,_r4,_s4);
	}
}

function _hR(_6m,_iR,_gR)
{
	var i,_u5;
	var _O5,_Q5,_jR,_kR,_lR,_mR,dir;
	var _nR,_oR,_pR,_qR;
	_qR=false;
	if(_fR(_6m,_6m.x,_6m.y,_gR)==false)
	{
		_6m._8c(_6m.xprevious,_6m.yprevious);
		_qR=true;
	}
	_O5=_6m.x;
	_Q5=_6m.y;
	if(_iR)
	{
		_u5=18;
		dir=10.0*Math.round(_6m.direction/10.0);
		_lR=dir;
		_mR=dir;
		for(i=1;i<2*_u5;i++)
		{
			_lR=_lR-180/_u5;
			_jR=_O5+_6m.speed*Math.cos(_lR*_M5/180);
			_kR=_Q5-_6m.speed*Math.sin(_lR*_M5/180);
			if(_fR(_6m,_jR,_kR,_gR))
			{
				break;
			}
			else 
			{
				_qR=true;
			}
		}
		for(i=1;i<2*_u5;i++)
		{
			_mR=_mR+180/_u5;
			_jR=_O5+_6m.speed*Math.cos(_mR*_M5/180);
			_kR=_Q5-_6m.speed*Math.sin(_mR*_M5/180);
			if(_fR(_6m,_jR,_kR,_gR))
			{
				break;
			}
			else 
			{
				_qR=true;
			}
		}
		if(_qR==true)
		{
			_6m.direction=180+(_lR+_mR)-dir;
		}
	}
	else 
	{
		_nR=_fR(_6m,_6m.x+_6m.hspeed,_6m.y,_gR);
		_oR=_fR(_6m,_6m.x,_6m.y+_6m.vspeed,_gR);
		_pR=_fR(_6m,_6m.x+_6m.hspeed,_6m.y+_6m.vspeed,_gR);
		if((_nR==false)&&(_oR==false))
		{
			_6m.hspeed=-_6m.hspeed;
			_6m.vspeed=-_6m.vspeed;
		}
		else if((_nR==true)&&(_oR==true)&&(_pR==false))
		{
			_6m.hspeed=-_6m.hspeed;
			_6m.vspeed=-_6m.vspeed;
		}
		else if(_nR==false)_6m.hspeed=-_6m.hspeed;
		else if(_oR==false)_6m.vspeed=-_6m.vspeed;
	}
}

function move_bounce_solid(_6m,_rR)
{
	_hR(_6m,yyGetBool(_rR),false);
}

function move_bounce_all(_6m,_rR)
{
	_hR(_6m,yyGetBool(_rR),true);
}

function _sR(_g6,_r4,_s4,_gR)
{
	if(yyGetBool(_gR))return place_empty(_g6,_r4,_s4);
	else return place_free(_g6,_r4,_s4);
}

function _tR(_g6,_HG,_uR,_gR)
{
	var _vR;
	if(_uR<=0)_vR=1000;
	else _vR=_Si(_uR);
	var _ha=Math.cos(_HG*Math.PI/180);
	var _ia=-Math.sin(_HG*Math.PI/180);
	if(_sR(_g6,_g6.x,_g6.y,_gR)==false)return;
	for(var i=1;i<=_vR;i++)
	{
		if(_sR(_g6,_g6.x+_ha,_g6.y+_ia,_gR))_g6._8c(_g6.x+_ha,_g6.y+_ia);
		else return;
	}
}

function _yG(_6m,_r4,_s4,_ui,_U6)
{
	var _O5=_6m.x;
	var _Q5=_6m.y;
	_6m._8c(_r4,_s4);
	var __Q=_8m(_6m,yyGetInt32(_ui),false,_9m,
function(_am)
	{
		if(_am._1R(_6m,true))
		{
			if(_U6)
			{
				_U6.push(_dm(_em,_am.id));
				return _9m;
			}
			return _dm(_em,_am.id);
		}
		return _9m;
	}
	);
	_6m._8c(_O5,_Q5);
	return __Q;
}
;

function _cF(_r4,_s4,_ui,_U6)
{
	var __Q=_8m(null,yyGetInt32(_ui),false,_9m,
function(_am)
	{
		if(_am._cm(_r4,_s4,true))
		{
			if(_U6)
			{
				_U6.push(_dm(_em,_am.id));
				return _9m;
			}
			return _dm(_em,_am.id);
		}
		return _9m;
	}
	);
	return __Q;
}
;

function move_and_collide(_wR,_ha,_ia,_o8,_xR,_yR,_zR,_AR,_BR)
{
	var _r3=[];
	if(typeof _o8==="number")
	{
		if((_o8==_CR)&&(_wR!=_DR))_o8=_wR.id;
		if(_o8==_9m)
		{
			return _r3;
		}
	}
	var _ta=_xG(_wR,_wR.x,_wR.y,_o8);
	if(_ta>=0)return _r3;
	if((_ha==0)&&(_ia==0))
	{
		return _r3;
	}
	var _ER=false;
	var _FR=false;
	var _GR=-1.0;
	var _HR=-1.0;
	if(_AR!==undefined)
	{
		_GR=_AR;
		if(_GR>=0)_ER=true;
	}
	if(_BR!==undefined)
	{
		_HR=_BR;
		if(_HR>=0)_FR=true;
	}
	var _IR=_wR.x;
	var _JR=_wR.y;
	var _KR=_IR+_GR;
	var _LR=_JR+_HR;
	_IR-=_GR;
	_JR-=_HR;
	var _MR=4;
	if(_xR!==undefined)_MR=_xR;
	var _NR=false;
	var _OR=0;
	var _PR=0;
	var _QR=0;
	if(_yR===undefined||_zR===undefined||(_yR===0&&_zR===0))
	{
		_NR=true;
	}
	else 
	{
		_OR=Math.sqrt(_yR*_yR+_zR*_zR);
		_PR=_yR/_OR;
		_QR=_zR/_OR;
	}
	var _vR=Math.sqrt(_ha*_ha+_ia*_ia);
	var _RR=_ha/_vR;
	var _SR=_ia/_vR;
	var _TR=0.70710678118654;
	var _UR=_vR/_MR;
	var _VR=_vR;
	for(var i=0;i<_MR;i++)
	{
		var _WR=_UR;
		if(_VR<_WR)
		{
			_WR=_VR;
			if(_WR<=0)break;
		}
		var _XR=_wR.x+_RR*_WR;
		var _YR=_wR.y+_SR*_WR;
		if(_ER)
		{
			_XR=clamp(_XR,_IR,_KR);
		}
		if(_FR)
		{
			_YR=clamp(_YR,_JR,_LR);
		}
		_ta=_xG(_wR,_XR,_YR,_o8);
		if(_ta<0)
		{
			_wR.x=_XR;
			_wR.y=_YR;
			_VR-=_WR;
		}
		else 
		{
			if(!_r3.includes(_ta))_r3[_r3.length]=_ta;
			var _ZR=false;
			if(_NR)
			{
				for(var _05=1;_05<_MR-i+1;_05++)
				{
					_XR=_wR.x+_TR*(_RR+_05*_SR)*_WR;
					_YR=_wR.y+_TR*(_SR-_05*_RR)*_WR;
					if(_ER)
					{
						_XR=clamp(_XR,_IR,_KR);
					}
					if(_FR)
					{
						_YR=clamp(_YR,_JR,_LR);
					}
					_ta=_xG(_wR,_XR,_YR,_o8);
					if(_ta<0)
					{
						_VR-=_WR*_05;
						_ZR=true;
						_wR.x=_XR;
						_wR.y=_YR;
						break;
					}
					else 
					{
						if(!_r3.includes(_ta))_r3[_r3.length]=_ta;
					}
					_XR=_wR.x+_TR*(_RR-_05*_SR)*_WR;
					_YR=_wR.y+_TR*(_SR+_05*_RR)*_WR;
					if(_ER)
					{
						_XR=clamp(_XR,_IR,_KR);
					}
					if(_FR)
					{
						_YR=clamp(_YR,_JR,_LR);
					}
					_ta=_xG(_wR,_XR,_YR,_o8);
					if(_ta<0)
					{
						_VR-=_WR*_05;
						_ZR=true;
						_wR.x=_XR;
						_wR.y=_YR;
						break;
					}
					else 
					{
						if(!_r3.includes(_ta))_r3[_r3.length]=_ta;
					}
				}
			}
			else 
			{
				for(var _05=1;_05<_MR-i+1;_05++)
				{
					_XR=_wR.x+_TR*(_RR+_05*_PR)*_WR;
					_YR=_wR.y+_TR*(_SR+_05*_QR)*_WR;
					if(_ER)
					{
						_XR=clamp(_XR,_IR,_KR);
					}
					if(_FR)
					{
						_YR=clamp(_YR,_JR,_LR);
					}
					_ta=_xG(_wR,_XR,_YR,_o8);
					if(_ta<0)
					{
						_VR-=_WR*_05;
						_ZR=true;
						_wR.x=_XR;
						_wR.y=_YR;
						break;
					}
					else 
					{
						if(!_r3.includes(_ta))_r3[_r3.length]=_ta;
					}
				}
			}
			if(!_ZR)return _r3;
		}
	}
	return _r3;
}

function move_contact_solid(_6m,_HG,_uR)
{
	_tR(_6m,yyGetReal(_HG),yyGetReal(_uR),false);
}

function move_contact_all(_g6,_HG,_uR)
{
	_tR(_g6,yyGetReal(_HG),yyGetReal(_uR),true);
}

function __R(_g6,_HG,_uR,_gR)
{
	var _vR;
	if(_uR<=0)_vR=1000;
	else _vR=_Si(_uR);
	var _ha=Math.cos(_HG*Math.PI/180);
	var _ia=-sin(_HG*Math.PI/180);
	if(_sR(_g6,_g6.x,_g6.y,_gR))return;
	for(var i=1;i<=_vR;i++)
	{
		_g6._8c(_g6.x+_ha,_g6.y+_ia);
		if(_sR(_g6,_g6.x,_g6.y,_gR))return;
	}
}

function move_outside_solid(_g6,_HG,_uR)
{
	__R(_g6,yyGetReal(_HG),yyGetReal(_uR),false);
}

function move_outside_all(_g6,_HG,_uR)
{
	__R(_g6,yyGetReal(_HG),yyGetReal(_uR),true);
}

function distance_to_point(_g6,_r4,_s4)
{
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	if(_g6._oG)_g6._pG();
	var _f3=_g6._7G;
	var _0S=0.0;
	var _1S=0.0;
	if(_r4>_f3.right)
	{
		_0S=_r4-_f3.right;
	}
	if(_r4<_f3.left)
	{
		_0S=_r4-_f3.left;
	}
	if(_s4>_f3.bottom)
	{
		_1S=_s4-_f3.bottom;
	}
	if(_s4<_f3.top)
	{
		_1S=_s4-_f3.top;
	}
	return Math.sqrt((_0S*_0S)+(_1S*_1S));
}

function distance_to_object(_g6,_ui)
{
	var _zm=10000000000;
	var i=0;
	var _zm=_eF(_g6,yyGetInt32(_ui),false,_zm,
function(_am)
	{
		if(_g6._oG)_g6._pG();
		if(_am._oG)_am._pG();
		var _f3=_am._7G;
		var _hg=_g6._7G;
		var _0S=0,_1S=0;
		if(_f3.left>_hg.right)_0S=_f3.left-_hg.right;
		if(_f3.right<_hg.left)_0S=_f3.right-_hg.left;
		if(_f3.top>_hg.bottom)_1S=_f3.top-_hg.bottom;
		if(_f3.bottom<_hg.top)_1S=_f3.bottom-_hg.top;
		return Math.sqrt(_0S*_0S+_1S*_1S);
	}
	);
	return _zm;
}

function position_empty(_g6,_r4,_s4)
{
	var _zm=10000000000;
	var i=0;
	var _0t=_8m(_g6,_aH,false,false,
function(_am)
	{
		return _am._cm(yyGetReal(_r4),yyGetReal(_s4),true);
	}
	);
	return !_0t;
}

function position_meeting(_6m,_r4,_s4,_ui)
{
	if(_ui instanceof _gm)
	{
		var _hm=_ui.type;
		if(_hm==_im)
		{
			if(_jm(_r4,_s4,_ui,null,true))
			{
				return true;
			}
			return false;
		}
		else 
		{
			var id=_5m(_6m,_r4,_s4,_ui,true,false);
			if(id!=_9m)return true;
		}
	}
	else if(_ui instanceof Array)
	{
		for(var i=0;i<_ui.length;i++)
		{
			var _km=_ui[i];
			if((_km instanceof _gm)&&(_km.type==_im))
			{
				if(_jm(_r4,_s4,_km,null,true))
				{
					return true;
				}
			}
			else 
			{
				var id=_5m(_6m,_r4,_s4,_km,true,false);
				if(id!=_9m)return true;
			}
		}
	}
	else 
	{
		var id=_5m(_6m,_r4,_s4,_ui,true,false);
		if(id!=_9m)return true;
	}
	return false;
}
var _2S=6;
var _3S=7;
var _4S=1;
var _5S=2;
var _6S=3;
var _7S=4;
var _8S=1;
var _9S=2;
var _aS=window.WebSocket;
var _bS=null;
try
{
	_bS=require("ws").Server;
}
catch(_6x)
{
}

function _cS(_dS,type,_eS)
{
	this.socket=_dS;
	this.type=type;
	this._eS=_eS;
}
_cS.prototype=
{
	socket:null,_eS:false,_fS:false,index:-1}
;
var _gS="GM:Studio-Connect";
var _hS=0xCAFEBABE;
var _iS=0xDEADB00B;
var _jS=0xDEAFBEAD;
var _kS=0xF00DBEEB;
var _lS=0xDEADC0DE;
var _mS=[];
var _nS=[];

function _oS(wrap)
{
	var i=_nS.shift();
	if(i==null)i=_mS.length;
	_mS[i]=wrap;
	wrap.index=i;
	return i;
}

function _pS(wrap)
{
	var i=_mS.indexOf(wrap);
	if(i>=0)
	{
		_mS[i]=null;
		_nS.push(i);
	}
}

function _qS(e)
{
	var _ay=_be._ce(e.id,null,_rS,e);
	_ay._ge=true;
}

function _sS(_Tp,offset,length)
{
	var _tS=new Uint8Array(_Tp.buffer);
	var _uS=_Tp.byteOffset+offset;
	var index=buffer_create(length,_vS,1);
	var buffer=_JE._F4(index);
	for(var i=0;i<length;i++)buffer._OE(_PE,_tS[_uS+i]);
	buffer._wS(_7i,0);
	return index;
}

function _xS(_Tp,_yS,id,_zS,port,_AS,_BS)
{
	var _Sg=_Tp.byteLength;
	var _CS=[];
	if(_yS)
	{
		var _Ri=0;
		while(_Ri<_Sg) 
		{
			if(_Tp.getUint32(_Ri,true)!=_lS||_Tp.getUint32(_Ri+4,true)!=12)
			{
				console.log("Raw packet received from a non-raw socket("+id+").");
				_CS.push(_sS(_Tp,_Ri,_Sg-_Ri));
				break;
			}
			var _DS=_Tp.getUint32(_Ri+8,true);
			_CS.push(_sS(_Tp,_Ri+12,_DS));
			_Ri+=12+_DS;
		}
	}
	else _CS.push(_sS(_Tp,0,_Sg));
	for(var i=0;i<_CS.length;i++)
	{
		_qS(
		{
			"type":_6S,"id":id,"ip":_zS,"port":port,"other_port":_AS,"buffer":_CS[i],"size":buffer_get_size(_CS[i]),"message_type":_BS		}
		);
	}
}

function _ES(_Ob,port,_FS,_GS)
{
	if(_bS==null)
	{
		debug("No WebSocket server implementation is available.");
		return -1;
	}
	try
	{
		var _HS=new _bS(
		{
			port:port,_IS:true		}
		);
		var wrap=new _cS(_HS,_2S,true);
		_HS._JS=wrap;
		_HS.on("connection",
function(_KS,_LS)
		{
			var _MS=new _cS(_KS,_2S,false);
			var _NS=-1;
			var _OS=_LS.socket.remoteAddress;
			var _PS=port;
			var _QS=_LS.socket.remotePort;
			var _RS=!_GS;

			function _SS()
			{
				_qS(
				{
					"type":_4S,"id":wrap.index,"socket":_NS,"ip":_OS,"port":_PS,"other_port":_QS				}
				);
				_MS._fS=true;
			}
			_KS.onmessage=
function(e)
			{
				var _TS=e.data;
				if(_TS==null)return;
				var _US=_TS.buffer;
				if(_US==null)return;
				var _VS=_TS.byteLength;
				var _WS=new DataView(_US,_TS.offset,_VS);
				if(_RS)
				{
					_xS(_WS,_GS,_NS,_OS,_PS,_QS);
				}
				else 
				{
					if(_VS>=16&&_WS.getUint32(0,true)==_hS&&_WS.getUint32(4,true)==_iS&&_WS.getUint32(8,true)==16)
					{
						_NS=_oS(_MS);
						_RS=true;
						_SS();
						var _XS=new ArrayBuffer(12);
						var _YS=new DataView(_XS);
						_YS.setInt32(0,_jS,true);
						_YS.setInt32(4,_kS,true);
						_YS.setInt32(8,12,true);
						_KS.send(_XS);
					}
					else 
					{
						console.log("Invalid handshake response from client.");
						_KS.terminate();
					}
				}
			}
			;
			_KS.onerror=
function(e)
			{
				console.log(e);
				_qS(
				{
					"type":_5S,"id":wrap.index,"socket":_NS,"ip":_OS,"port":_PS,"other_port":_QS				}
				);
				_pS(_MS);
			}
			;
			if(_RS)
			{
				_NS=_oS(_MS);
				_SS();
			}
			else 
			{
				var _ZS=new ArrayBuffer(_gS.length+1);
				var __S=new DataView(_ZS);
				for(var i=0;i<_gS.length;i++)
				{
					__S.setUint8(i,_gS.charCodeAt(i));
				}
				__S.setUint8(i,0);
				_KS.send(_ZS);
			}
		}
		);
		_HS.on("error",
function(e)
		{
			console.log("Server error: ",e);
		}
		);
		return _oS(wrap);
	}
	catch(e)
	{
		debug("Error creating server: "+e);
		return -1;
	}
}

function _0T(index,_xf,port,_yS)
{
	if(_aS==null)
	{
		debug("No WebSocket client implementation is available.");
		return -1;
	}
	var wrap=_mS[index];
	if(wrap==null||wrap.socket!=null)return -1;
	try
	{
		var _1T=_xf;
		var _2T=(wrap.type==_3S);
		if(_xf.substring(0,5)=="ws://")
		{
			if(_2T)
			{
				console.log("Socket type is network_socket_wss, but URL ("+_xf+") is insecure - upgrading to wss://");
			}
			_xf=_xf.substring(5);
		}
		else if(_xf.substring(0,6)=="wss://")
		{
			_2T=true;
			_xf=_xf.substring(6);
		}
		var _3T=_xf.indexOf("/");
		var path="/";
		if(_3T!=-1)
		{
			path=_xf.substring(_3T);
			_xf=_xf.substring(0,_3T);
		}
		var _4T=_xf.indexOf(":");
		if(_4T!=-1)
		{
			if(port==0)
			{
				port=_xf.substring(_4T+1);
			}
			_xf=_xf.substring(0,_4T);
		}
		_xf=(_2T?"wss://":"ws://")+_xf+(port!=0?":"+port:"")+path;
		var _HS=new _aS(_xf);
		var _5T=_yS?-1:1;

		function _SS(_6T)
		{
			_qS(
			{
				"type":_7S,"id":wrap.index,"succeeded":_6T?1:0,"ip":_1T,"port":port			}
			);
			if(_6T)wrap._fS=true;
		}

		function _7T(_8T,_BS)
		{
			switch(_5T)
			{
				case -1:
				{
					var i=_8T.byteLength;
					if(i>_gS.length)
					{
						i=_gS.length;
						if(_8T.getUint8(i)==0)while(--i>=0) 
						{
							if(_8T.getUint8(i)!=_gS.charCodeAt(i))break;
						}
					}
					if(i<0)
					{
						_5T=0;
						var _9T=new ArrayBuffer(16);
						var _aT=new DataView(_9T);
						_aT.setUint32(0,_hS,true);
						_aT.setUint32(4,_iS,true);
						_aT.setUint32(8,16,true);
						_HS.send(_9T);
					}
					else 
					{
						console.log("Invalid first response from server");
						_SS(false);
						_HS.close();
						wrap.socket=null;
					}
				}
				;
				break;
				case 0:
				{
					if(_8T.byteLength>=12&&_8T.getUint32(0,true)==_jS&&_8T.getUint32(4,true)==_kS&&_8T.getUint32(8,true)==12)
					{
						_5T=1;
						_SS(true);
						if(_8T.byteLength>12)
						{
							_7T(new DataView(_8T.buffer,_8T.byteOffset+12,_8T.byteLength-12));
						}
					}
					else 
					{
						console.log("Invalid second response from server");
						_SS(false);
					}
				}
				;
				break;
				default :
				{
					_xS(_8T,_yS,index,_1T,port,port,_BS);
				}
				;
			}
		}
		_HS.onopen=
function(e)
		{
			if(_5T>0)_SS(true);
		}
		;
		_HS.onmessage=
function(e)
		{
			if(e.data instanceof Blob)
			{
				var _bT=new FileReader();
				_bT.onload=
function()
				{
					_7T(new DataView(_bT.result),_8S);
				}
				;
				_bT.onerror=
function(e)
				{
					console.log("Failed to read message:",e);
				}
				;
				_bT.readAsArrayBuffer(e.data);
			}
			else if(typeof e.data=="string")
			{
				var _cT=new TextEncoder();
				var _dT=_cT.encode(e.data);
				_7T(new DataView(_dT.buffer),_9S);
			}
			else 
			{
				console.log("Failed to process message:",e);
			}
		}
		;
		_HS.onerror=
function(e)
		{
			console.log(e);
			if(!wrap._fS)_SS(false);
		}
		;
		wrap.socket=_HS;
		return wrap.index;
	}
	catch(e)
	{
		debug("Connection error: "+e);
		return -1;
	}
}

function network_create_server(_Ob,_eT,_FS)
{
	return _ES(_Ob,_eT,_FS,true);
}

function network_create_server_raw(_Ob,_eT,_FS)
{
	return _ES(_Ob,_eT,_FS,false);
}

function network_set_timeout()
{
	_0b("network_set_timeout()")}

function network_create_socket_ext(_Ob,_eT)
{
	if(_Ob!=_2S&&_Ob!=_3S)
	{
		console.log("network_create_socket_ext() - Only network_socket_ws and network_socket_wss are supported on HTML5.");
		return -1;
	}
	return _oS(new _cS(null,_Ob,false));
}

function network_create_socket(_Ob,_eT,_FS)
{
	if(_Ob!=_2S&&_Ob!=_3S)
	{
		console.log("network_create_socket_ext() - Only network_socket_ws and network_socket_wss are supported on HTML5.");
		return -1;
	}
	return _oS(new _cS(null,_Ob,false));
}

function network_connect(_fT,_cE,_eT)
{
	_0b("network_connect()");
	return -1;
}

function network_connect_raw(_fT,_cE,_eT)
{
	_0b("network_connect_raw()");
	return -1;
}

function network_connect_async(_fT,_cE,_eT)
{
	return _0T(_fT,_cE,_eT,true);
}

function network_connect_raw_async(_fT,_cE,_eT)
{
	return _0T(_fT,_cE,_eT,false);
}

function network_resolve(_cE)
{
	return "127.0.0.1";
}

function network_send_broadcast(_fT,_eT,_oj,_Ab)
{
	return -1;
}

function network_send_packet(_fT,_oj,_Ab)
{
	var wrap=_mS[_fT];
	if(wrap==null)return -1;
	var _HS=wrap.socket;
	if(_HS==null||!wrap._fS)return -1;
	var _gT=_JE._F4(_oj);
	if(_gT==null)return -1;
	var _8T=_gT._hT;
	var _iT=new ArrayBuffer(_Ab+12);
	var _jT=new DataView(_iT);
	_jT.setUint32(0,_lS,true);
	_jT.setUint32(4,12,true);
	_jT.setUint32(8,_Ab,true);
	for(var i=0;i<_Ab;i+=1)
	{
		_jT.setUint8(i+12,_8T.getUint8(i));
	}
	_HS.send(_iT);
	return _Ab;
}

function network_send_raw(_fT,_oj,_Ab,_kT)
{
	var wrap=_mS[_fT];
	if(wrap==null)return -1;
	var _HS=wrap.socket;
	if(_HS==null||!wrap._fS)return -1;
	var _h3=buffer_get_address(_oj);
	if(_Ab<_h3.byteLength)_h3=new DataView(_h3,0,_Ab);
	if(_kT!==undefined&&(_kT&_9S)!=0)
	{
		var _lT=new TextDecoder();
		_h3=_lT.decode(_h3);
	}
	_HS.send(_h3);
	return _Ab;
}

function network_set_config(_mT,_0d)
{
}

function network_send_udp(_fT,_cE,_eT,_oj,_Ab)
{
	return -1;
}

function network_send_udp_raw(_fT,_cE,_eT,_oj,_Ab)
{
	return -1;
}

function network_destroy(_fT)
{
	var wrap=_mS[_fT];
	if(wrap==null)return;
	var _HS=wrap.socket;
	if(_HS==null)return;
	if(wrap._eS)
	{
		_HS.close();
	}
	else if(_HS.terminate)
	{
		_HS.terminate();
	}
	else if(_HS.close)_HS.close();
	_pS(wrap);
	return 0;
}

function object_exists(_u3)
{
	if(!_j2._F4(yyGetInt32(_u3)))return false;
	return true;
}

function object_get_name(_u3)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return "";
	return _Ow._0w;
}

function object_get_sprite(_u3)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return -1;
	return _Ow._YG;
}

function object_get_solid(_u3)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return false;
	return _Ow._nT;
}

function object_get_visible(_u3)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return false;
	return _Ow._oT;
}

function _pT(_u3)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return 0;
	return _Ow._qT;
}

function object_get_persistent(_u3)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return false;
	return _Ow._rT;
}

function object_get_mask(_u3)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return -1;
	return _Ow._sT;
}

function object_get_parent(_u3)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return -1;
	return _Ow._7H;
}

function object_get_physics(_u3)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return -1;
	return(_Ow._tT.physicsObject?1.0:0.0);
}

function object_set_sprite(_u3,_D4)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return;
	_Ow._YG=yyGetInt32(_D4);
}

function object_set_solid(_u3,_uT)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return;
	_Ow._nT=yyGetBool(_uT);
}

function object_set_visible(_u3,_vT)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return;
	_Ow._oT=yyGetBool(_vT);
}

function object_set_persistent(_u3,_wT)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return;
	_Ow._rT=yyGetBool(_wT);
}

function object_set_mask(_u3,_D4)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return;
	_Ow._sT=yyGetInt32(_D4);
}

function _xT(_u3,_yT)
{
	var _Ow=_j2._F4(yyGetInt32(_u3));
	if(!_Ow)return;
	_yT=yyGetInt32(_yT);
	_Ow._7H=_yT;
	_Ow._cv=_j2._F4(_yT);
}

function object_is_ancestor(_zT,_o5)
{
	var _Ow=_j2._F4(yyGetInt32(_zT));
	if(!_Ow)return 0;
	_Ow=_Ow._cv;
	while(_Ow!==null&&_Ow!==undefined) 
	{
		if(_Ow._9H===yyGetInt32(_o5))return 1;
		_Ow=_Ow._cv;
	}
	return 0;
}

function _AT(_BT,_CT)
{
	return _4N(_BT,_DT,_rA._ET.length,_rA._ET,_CT);
}

function _FT(_BT,_CT)
{
	return _4N(_BT,_GT,_HT.length,_HT,_CT);
}

function _IT(_JT,_BT,_CT)
{
	var _u7=0;
	var _l5=null;
	if(!_CT)
	{
		_l5=_HT[_JT].emitters;
		_u7=_l5.length;
	}
	return _4N(_BT,_KT,_u7,_l5,_CT);
}

function _LT(_BT,_CT)
{
	return _4N(_BT,_MT,_NT.length,_NT,_CT);
}

function _OT(_BT)
{
	var index=yyGetInt32(_BT);
	if(_E4._F4(index)==null)_I3("invalid reference to sprite");
	return index;
}

function _PT(_QT)
{
	var _vq=yyGetInt32(_QT);
	if(_vq<0||_vq>1)_I3("invalid argument, expecting a time source unit");
	return _vq;
}

function _RT(_8L)
{
	var _ST=(typeof _8L=="string");
	var room=_tm._um();
	var layer=_ST?_tm._gH(room,yyGetString(_8L)):_tm._hH(room,yyGetInt32(_8L));
	if(!layer)
	{
		if(_ST)_I3("invalid argument, layer name ("+_8L+") does not exist");
		else _I3("invalid argument, layer ID ("+_8L+") does not exist");
	}
	return layer;
}

function _TT(_u3,_UT)
{
	var _VT=undefined;
	var emitters=[];
	if(_UT)
	{
		_u3=_FT(_u3);
		var _WT=_HT[_u3];
		if(_WT!=null)
		{
			_VT=new _Yx();
			var resource=_rA._F4(_WT._XT);
			variable_struct_set(_VT,"name",resource?resource.name:"");
			variable_struct_set(_VT,"xorigin",_WT._YT);
			variable_struct_set(_VT,"yorigin",_WT._ZT);
			variable_struct_set(_VT,"oldtonew",_WT.__T?true:false);
			variable_struct_set(_VT,"global_space",_WT.globalSpaceParticles);
			for(var i=_WT.emitters.length-1;i>=0;--i)
			{
				var emitter=_WT.emitters[i];
				if(emitter)
				{
					emitters.push(emitter);
				}
			}
		}
	}
	else 
	{
		_u3=_AT(_u3);
		var _WT=_rA._F4(_u3);
		if(_WT!=null)
		{
			_VT=new _Yx();
			variable_struct_set(_VT,"name",_WT.name);
			variable_struct_set(_VT,"xorigin",_WT.originX);
			variable_struct_set(_VT,"yorigin",_WT.originY);
			variable_struct_set(_VT,"oldtonew",(_WT.drawOrder==0));
			variable_struct_set(_VT,"global_space",_WT.globalSpaceParticles);
			for(var i=0;i<_WT.emitters.length;++i)
			{
				var emitter=_0U[_WT.emitters[i]];
				if(emitter)
				{
					emitters.push(emitter);
				}
			}
		}
	}
	if(!_VT)
	{
		return _VT;
	}
	var _1U=[];
	for(var i=0;i<emitters.length;++i)
	{
		var emitter=emitters[i];
		var _2U=new _Yx();
		variable_struct_set(_2U,"ind",i);
		variable_struct_set(_2U,"name",emitter.name);
		variable_struct_set(_2U,"mode",emitter.mode);
		variable_struct_set(_2U,"number",emitter._3j);
		variable_struct_set(_2U,"delay_min",emitter.delayMin);
		variable_struct_set(_2U,"delay_max",emitter.delayMax);
		variable_struct_set(_2U,"delay_unit",emitter.delayUnit);
		variable_struct_set(_2U,"interval_min",emitter.intervalMin);
		variable_struct_set(_2U,"interval_max",emitter.intervalMax);
		variable_struct_set(_2U,"interval_unit",emitter.intervalUnit);
		variable_struct_set(_2U,"relative",emitter._3U);
		variable_struct_set(_2U,"xmin",emitter._4R);
		variable_struct_set(_2U,"xmax",emitter._5R);
		variable_struct_set(_2U,"ymin",emitter._6R);
		variable_struct_set(_2U,"ymax",emitter._7R);
		variable_struct_set(_2U,"distribution",emitter._4U);
		variable_struct_set(_2U,"shape",emitter.shape);
		variable_struct_set(_2U,"enabled",emitter.enabled);
		var _5U=new _Yx();
		var _6U=_NT[emitter._7U];
		variable_struct_set(_5U,"ind",emitter._7U);
		if(_6U!==undefined)
		{
			variable_struct_set(_5U,"sprite",_6U._xL);
			variable_struct_set(_5U,"frame",_6U._8U);
			variable_struct_set(_5U,"animate",_6U._9U);
			variable_struct_set(_5U,"stretch",_6U._aU);
			variable_struct_set(_5U,"random",_6U._bU);
			variable_struct_set(_5U,"shape",_6U.shape);
			variable_struct_set(_5U,"size_xmin",_6U.sizeMinX);
			variable_struct_set(_5U,"size_xmax",_6U.sizeMaxX);
			variable_struct_set(_5U,"size_ymin",_6U.sizeMinY);
			variable_struct_set(_5U,"size_ymax",_6U.sizeMaxY);
			variable_struct_set(_5U,"size_xincr",_6U._cU);
			variable_struct_set(_5U,"size_yincr",_6U._dU);
			variable_struct_set(_5U,"size_xwiggle",_6U._eU);
			variable_struct_set(_5U,"size_ywiggle",_6U._fU);
			variable_struct_set(_5U,"xscale",_6U._ZH);
			variable_struct_set(_5U,"yscale",_6U.__H);
			variable_struct_set(_5U,"life_min",_6U._gU);
			variable_struct_set(_5U,"life_max",_6U._hU);
			variable_struct_set(_5U,"death_type",_6U._iU);
			variable_struct_set(_5U,"death_number",_6U._jU);
			variable_struct_set(_5U,"step_type",_6U._kU);
			variable_struct_set(_5U,"step_number",_6U._lU);
			variable_struct_set(_5U,"speed_min",_6U._mU);
			variable_struct_set(_5U,"speed_max",_6U._nU);
			variable_struct_set(_5U,"speed_incr",_6U._oU);
			variable_struct_set(_5U,"speed_wiggle",_6U._pU);
			variable_struct_set(_5U,"dir_min",_6U._qU);
			variable_struct_set(_5U,"dir_max",_6U._rU);
			variable_struct_set(_5U,"dir_incr",_6U._sU);
			variable_struct_set(_5U,"dir_wiggle",_6U._tU);
			variable_struct_set(_5U,"grav_amount",_6U._uU);
			variable_struct_set(_5U,"grav_dir",_6U._vU);
			variable_struct_set(_5U,"ang_min",_6U._wU);
			variable_struct_set(_5U,"ang_max",_6U._xU);
			variable_struct_set(_5U,"ang_incr",_6U._yU);
			variable_struct_set(_5U,"ang_wiggle",_6U._zU);
			variable_struct_set(_5U,"ang_relative",_6U._AU);
			variable_struct_set(_5U,"color1",_6U._BU[0]);
			variable_struct_set(_5U,"color2",_6U._BU[1]);
			variable_struct_set(_5U,"color3",_6U._BU[2]);
			variable_struct_set(_5U,"alpha1",_6U._CU);
			variable_struct_set(_5U,"alpha2",_6U._DU);
			variable_struct_set(_5U,"alpha3",_6U._EU);
			variable_struct_set(_5U,"additive",_6U._FU);
		}
		variable_struct_set(_2U,"parttype",_5U);
		_1U.push(_2U);
	}
	variable_struct_set(_VT,"emitters",_1U);
	return _VT;
}

function particle_get_info(_u3)
{
	var _GU=((_u3 instanceof _gm)&&(_u3.type==_GT));
	return _TT(_u3,_GU);
}

function particle_exists(_u3)
{
	var _DA=_AT(_u3,true);
	return(_rA._F4(_DA)!=null);
}

function part_system_create(_HU)
{
	var id=-1;
	if(_HU===undefined)
	{
		id=_IU();
	}
	else 
	{
		_HU=_AT(_HU);
		var _JU=_rA._F4(_HU);
		if(_JU!=null)
		{
			id=_JU._fK();
		}
	}
	return _dm(_GT,(id!=-1)?id:0xffffffff);
}

function part_system_destroy(_u3)
{
	_u3=_FT(_u3,true);
	return _KU(_u3);
}

function part_system_exists(_u3)
{
	_u3=_FT(_u3,true);
	return _LU(_u3);
}

function part_system_clear(_u3)
{
	_u3=_FT(_u3);
	return _MU(_u3,true);
}

function part_system_draw_order(_u3,_NU)
{
	_u3=_FT(_u3);
	return _OU(_u3,_NU);
}

function part_system_depth(_u3,_wj)
{
	_u3=_FT(_u3);
	return _PU(_u3,_wj);
}

function part_system_color(_u3,_9l,_y8)
{
	_u3=_FT(_u3);
	return _QU(_u3,_9l,_y8);
}
var part_system_colour=part_system_color;

function part_system_position(_u3,_r4,_s4)
{
	_u3=_FT(_u3);
	return _RU(_u3,_r4,_s4);
}

function part_system_angle(_u3,_v4)
{
	_u3=_FT(_u3);
	return _SU(_u3,_v4);
}

function part_system_automatic_update(_u3,_TU)
{
	_u3=_FT(_u3);
	return _UU(_u3,_TU);
}

function part_system_automatic_draw(_u3,_TU)
{
	_u3=_FT(_u3);
	return _VU(_u3,_TU);
}

function part_system_update(_u3)
{
	_u3=_FT(_u3);
	return _WU(_u3);
}

function part_system_drawit(_u3)
{
	_u3=_FT(_u3);
	return _XU(_u3);
}

function part_particles_create(_u3,_r4,_s4,_YU,_Gc)
{
	_u3=_FT(_u3);
	_YU=_LT(_YU);
	return _ZU(_u3,_r4,_s4,_YU,_Gc);
}

function part_particles_create_color(_u3,_r4,_s4,_YU,_9l,_Gc)
{
	_u3=_FT(_u3);
	_YU=_LT(_YU);
	return __U(_u3,_r4,_s4,_YU,_9l,_Gc);
}
var part_particles_create_colour=part_particles_create_color;

function part_particles_burst(_u3,_r4,_s4,_HU)
{
	_u3=_FT(_u3);
	_HU=_AT(_HU);
	return _0V(_u3,_r4,_s4,_HU);
}

function part_particles_clear(_u3)
{
	_u3=_FT(_u3);
	return _1V(_u3);
}

function part_particles_count(_u3)
{
	_u3=_FT(_u3);
	return _2V(_u3);
}

function part_type_create()
{
	return _dm(_MT,_3V());
}
;

function part_type_destroy(_u3)
{
	_u3=_LT(_u3);
	return _4V(_u3);
}

function part_type_exists(_u3)
{
	_u3=_LT(_u3,true);
	return _5V(_u3);
}

function part_type_clear(_u3)
{
	_u3=_LT(_u3);
	return _6V(_u3);
}

function part_type_shape(_u3,_7V)
{
	_u3=_LT(_u3);
	return _8V(_u3,_7V);
}

function part_type_sprite(_u3,_r2,_9V,_aV,_bV)
{
	_u3=_LT(_u3);
	_r2=_OT(_r2);
	return _cV(_u3,_r2,_9V,_aV,_bV);
}

function part_type_subimage(_u3,_dV)
{
	_u3=_LT(_u3);
	return _eV(_u3,_dV);
}

function part_type_size(_u3,_fV,_gV,_hV,_iV)
{
	_u3=_LT(_u3);
	return _jV(_u3,_fV,_gV,_hV,_iV);
}

function part_type_size_x(_u3,_fV,_gV,_hV,_iV)
{
	_u3=_LT(_u3);
	return _kV(_u3,_fV,_gV,_hV,_iV);
}

function part_type_size_y(_u3,_fV,_gV,_hV,_iV)
{
	_u3=_LT(_u3);
	return _lV(_u3,_fV,_gV,_hV,_iV);
}

function part_type_scale(_u3,_7l,_8l)
{
	_u3=_LT(_u3);
	return _mV(_u3,_7l,_8l);
}

function part_type_blend(_u3,_nV)
{
	_u3=_LT(_u3);
	return _oV(_u3,_nV);
}

function part_type_color1(_u3,_pV)
{
	_u3=_LT(_u3);
	return _qV(_u3,_pV);
}
var part_type_colour1=part_type_color1;

function part_type_color2(_u3,_pV,_rV)
{
	_u3=_LT(_u3);
	return _sV(_u3,_pV,_rV);
}
var part_type_colour2=part_type_color2;

function part_type_color3(_u3,_pV,_rV,_tV)
{
	_u3=_LT(_u3);
	return _uV(_u3,_pV,_rV,_tV);
}
var part_type_colour3=part_type_color3;
var _vV=part_type_color3;
var _wV=part_type_color3;

function part_type_color_mix(_u3,_pV,_rV)
{
	_u3=_LT(_u3);
	return _xV(_u3,_pV,_rV);
}
var part_type_colour_mix=part_type_color_mix;

function part_type_color_rgb(_u3,_yV,_zV,_AV,_BV,_CV,_DV)
{
	_u3=_LT(_u3);
	return _EV(_u3,_yV,_zV,_AV,_BV,_CV,_DV);
}
var part_type_colour_rgb=_EV;

function part_type_color_hsv(_u3,_FV,_GV,_HV,_IV,_JV,_KV)
{
	_u3=_LT(_u3);
	return _LV(_u3,_FV,_GV,_HV,_IV,_JV,_KV);
}
var part_type_colour_hsv=_LV;

function part_type_alpha1(_u3,_MV)
{
	_u3=_LT(_u3);
	return _NV(_u3,_MV);
}

function part_type_alpha2(_u3,_MV,_OV)
{
	_u3=_LT(_u3);
	return _PV(_u3,_MV,_OV);
}

function part_type_alpha3(_u3,_MV,_OV,_QV)
{
	_u3=_LT(_u3);
	return _RV(_u3,_MV,_OV,_QV);
}

function part_type_life(_u3,_SV,_TV)
{
	_u3=_LT(_u3);
	return _UV(_u3,_SV,_TV);
}

function part_type_step(_u3,_VV,_WV)
{
	_u3=_LT(_u3);
	_WV=_LT(_WV,true);
	return _XV(_u3,_VV,_WV);
}

function part_type_death(_u3,_YV,_ZV)
{
	_u3=_LT(_u3);
	_ZV=_LT(_ZV,true);
	return __V(_u3,_YV,_ZV);
}

function part_type_orientation(_u3,_0W,_1W,_2W,_3W,_4W)
{
	_u3=_LT(_u3);
	return _5W(_u3,_0W,_1W,_2W,_3W,_4W);
}

function part_type_speed(_u3,_6W,_7W,_8W,_9W)
{
	_u3=_LT(_u3);
	return _aW(_u3,_6W,_7W,_8W,_9W);
}

function part_type_direction(_u3,_bW,_cW,_dW,_eW)
{
	_u3=_LT(_u3);
	return _fW(_u3,_bW,_cW,_dW,_eW);
}

function part_type_gravity(_u3,_gW,_hW)
{
	_u3=_LT(_u3);
	return _iW(_u3,_gW,_hW);
}

function part_emitter_create(_JT)
{
	_JT=_FT(_JT);
	return _dm(_KT,_jW(_JT));
}

function part_emitter_destroy(_JT,_u3)
{
	_JT=_FT(_JT,true);
	_u3=_IT(_JT,_u3,true);
	return _kW(_JT,_u3);
}

function part_emitter_destroy_all(_JT)
{
	_JT=_FT(_JT);
	return _lW(_JT);
}

function part_emitter_enable(_JT,_u3,_Np)
{
	_JT=_FT(_JT);
	_u3=_IT(_JT,_u3);
	return _mW(_JT,_u3,_Np);
}

function part_emitter_exists(_JT,_u3)
{
	_JT=_FT(_JT,true);
	_u3=_IT(_JT,_u3,true);
	return _nW(_JT,_u3);
}

function part_emitter_clear(_JT,_u3)
{
	_JT=_FT(_JT);
	_u3=_IT(_JT,_u3);
	return _oW(_JT,_u3);
}

function part_emitter_region(_JT,_u3,_pW,_qW,_rW,_sW,_7V,_tW)
{
	_JT=_FT(_JT);
	_u3=_IT(_JT,_u3);
	return _uW(_JT,_u3,_pW,_qW,_rW,_sW,_7V,_tW);
}

function part_emitter_burst(_JT,_u3,_YU,_Gc)
{
	_JT=_FT(_JT);
	_u3=_IT(_JT,_u3);
	_YU=_LT(_YU);
	return _vW(_JT,_u3,_YU,_Gc);
}

function part_emitter_stream(_JT,_u3,_YU,_Gc)
{
	_JT=_FT(_JT);
	_u3=_IT(_JT,_u3);
	_YU=_LT(_YU);
	return _wW(_JT,_u3,_YU,_Gc);
}

function part_emitter_delay(_JT,_u3,_xW,_yW,_zW)
{
	_JT=_FT(_JT);
	_u3=_IT(_JT,_u3);
	_zW=_PT(_zW);
	return _AW(_JT,_u3,_xW,_yW,_zW);
}

function part_emitter_interval(_JT,_u3,_BW,_CW,_DW)
{
	_JT=_FT(_JT);
	_u3=_IT(_JT,_u3);
	_DW=_PT(_DW);
	return _EW(_JT,_u3,_BW,_CW,_DW);
}

function part_emitter_relative(_JT,_u3,_Np)
{
	_JT=_FT(_JT);
	_u3=_IT(_JT,_u3);
	return _FW(_JT,_u3,_Np);
}

function effect_create_below(_eb,_r4,_s4,_Ab,_9l)
{
	if(_GW==-1)_HW();
	_IW(_GW,yyGetInt32(_eb),yyGetReal(_r4),yyGetReal(_s4),yyGetInt32(_Ab),yyGetInt32(_9l));
}

function effect_create_above(_eb,_r4,_s4,_Ab,_9l)
{
	if(_JW==-1)_HW();
	_IW(_JW,yyGetInt32(_eb),yyGetReal(_r4),yyGetReal(_s4),yyGetInt32(_Ab),yyGetInt32(_9l));
}

function effect_create_layer(_NM,_eb,_r4,_s4,_Ab,_9l)
{
	var layer=_RT(_NM);
	if(!_LU(layer._gI))layer._gI=_IU(layer._Uc,false);
	var _DA=layer._gI;
	_IW(_DA,yyGetInt32(_eb),yyGetReal(_r4),yyGetReal(_s4),yyGetInt32(_Ab),yyGetInt32(_9l));
}

function effect_create_depth(_wj,_eb,_r4,_s4,_Ab,_9l)
{
	_wj=yyGetInt32(_wj);
	var layer=_tm._zK(_u2,_wj,true);
	if(layer==null)layer=_tm._AK(_u2,_wj);
	if(!_LU(layer._gI))layer._gI=_IU(layer._Uc,false);
	var _DA=layer._gI;
	_IW(_DA,yyGetInt32(_eb),yyGetReal(_r4),yyGetReal(_s4),yyGetInt32(_Ab),yyGetInt32(_9l));
}

function effect_clear()
{
	_1V(_GW);
	_1V(_JW);
}

function part_system_create_layer(_NM,_KW,_HU)
{
	var id=-1;
	var layer=_RT(_NM);
	_KW=(_KW!==undefined)?yyGetBool(_KW):false;
	if(_HU===undefined)
	{
		id=_IU(layer._Uc,_KW);
	}
	else 
	{
		_HU=_AT(_HU);
		var _JU=_rA._F4(_HU);
		if(_JU!=null)
		{
			id=_JU._fK(layer._Uc,_KW);
		}
	}
	return _dm(_GT,(id!=-1)?id:0xffffffff);
}

function part_system_get_layer(_u3)
{
	_u3=_FT(_u3);
	return _LW(_u3);
}

function part_system_layer(_u3,_NM)
{
	_u3=_FT(_u3);
	var layer=_RT(_NM);
	return _MW(_u3,layer._Uc);
}

function part_system_global_space(_u3,_Np)
{
	_u3=_FT(_u3);
	return _NW(_u3,_Np);
}

function part_system_get_info(_u3)
{
	return _TT(_u3,true);
}

function path_exists(_u3)
{
	if(_IA.Paths[yyGetInt32(_u3)])return true;
	return false;
}

function path_get_name(_u3)
{
	_u3=yyGetInt32(_u3);
	if(!_IA.Paths[_u3])return "";
	return _IA.Paths[_u3].name;
}

function path_get_length(_u3)
{
	_u3=yyGetInt32(_u3);
	if(!_IA.Paths[_u3])return 0;
	return _IA.Paths[_u3].length;
}

function path_get_kind(_u3)
{
	_u3=yyGetInt32(_u3);
	if(!_IA.Paths[_u3])return 0;
	return _IA.Paths[_u3].kind;
}

function path_get_closed(_u3)
{
	_u3=yyGetInt32(_u3);
	if(!_IA.Paths[_u3])return true;
	return _IA.Paths[_u3].closed;
}

function path_get_precision(_u3)
{
	_u3=yyGetInt32(_u3);
	if(!_IA.Paths[_u3])return 8;
	return _IA.Paths[_u3].precision;
}

function path_get_number(_u3)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return 0;
	if(!_YP.points)return 0;
	return _YP.points.length;
}

function path_get_point_x(_u3,_9F)
{
	_9F=yyGetInt32(_9F);
	if(_9F<0)return 0;
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return 0;
	if(!_YP.points)return 0;
	if(_YP.points._OW>=_9F)return 0;
	return _YP.points[_9F].x;
}

function path_get_point_y(_u3,_9F)
{
	_9F=yyGetInt32(_9F);
	if(_9F<0)return 0;
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return 0;
	if(!_YP.points)return 0;
	if(_YP.points._OW>=_9F)return 0;
	return _YP.points[_9F].y;
}

function path_get_point_speed(_u3,_9F)
{
	_9F=yyGetInt32(_9F);
	if(_9F<0)return 0;
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return 0;
	if(!_YP.points)return 0;
	if(_YP.points._OW>=_9F)return 0;
	return _YP.points[_9F].speed;
}

function path_get_x(_u3,_Li)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return -1;
	return _YP._PW(yyGetReal(_Li));
}

function path_get_y(_u3,_Li)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return -1;
	return _YP._QW(yyGetReal(_Li));
}

function path_get_speed(_u3,_Li)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return -1;
	return _YP._RW(yyGetReal(_Li));
}

function path_set_kind(_u3,_eb)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return -1;
	_YP._ZP(yyGetInt32(_eb));
}

function path_set_closed(_u3,_SW)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return -1;
	_YP._0Q(yyGetBool(_SW));
}

function path_set_precision(_u3,_ah)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return -1;
	_YP._TW(yyGetInt32(_ah));
}

function path_add()
{
	var _YP=new _UW();
	_IA._ce(_YP);
	return _YP.id;
}

function path_duplicate(_u3)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return -1;
	var _VW=new _UW();
	_IA._ce(_VW);
	_VW._PG(_YP);
	return _VW.id;
}

function path_assign(_u3,_TP)
{
	var _WW=_IA.Paths[yyGetInt32(_u3)];
	if(!_WW)return;
	var _XW=_IA.Paths[yyGetInt32(_TP)];
	if(!_XW)return;
	_WW._PG(_XW);
}

function path_start(_g6,_TP,_IG,_YW,_ZW)
{
	_g6.__W(yyGetInt32(_TP),yyGetReal(_IG),1,0,yyGetBool(_ZW),yyGetInt32(_YW));
}

function path_end(_g6)
{
	_g6.__W(-1,0,1,0,false,0);
}
var draw_path=_0X;

function _0X(_Qe,_1X,_2X,_ZW)
{
	_1X=yyGetReal(_1X);
	_2X=yyGetReal(_2X);
	var _YP=_IA.Paths[yyGetInt32(_Qe)];
	if(!_YP)return;
	_59.globalAlpha=_lb;
	_59.strokeStyle=_JB;
	var _O5,_Q5,_3X;
	var _4X=0;
	var _5X=_YP._6X(0);
	if(!yyGetBool(_ZW))
	{
		_1X=_1X-_5X.x;
		_2X=_2X-_5X.y;
	}
	else 
	{
		_1X=0;
		_2X=0;
	}
	_4X=_Si(_YP.length/4.0);
	if(_4X==0)return;
	var first=true;
	_59._ZB();
	for(var i=0;i<=_4X;i++)
	{
		_5X=_YP._6X(i/_4X);
		if(first)
		{
			_59.__B(_1X+_5X.x,_2X+_5X.y);
			first=false;
		}
		else 
		{
			_59._0C(_1X+_5X.x,_2X+_5X.y);
		}
	}
	_59._2C();
	_59._1C();
}

function path_shift(_Qe,_1X,_2X)
{
	var _YP=_IA.Paths[yyGetInt32(_Qe)];
	if(!_YP)return;
	_YP._7X(yyGetReal(_1X),yyGetReal(_2X));
}

function path_rescale(_Qe,_7l,_8l)
{
	var _YP=_IA.Paths[yyGetInt32(_Qe)];
	if(!_YP)return;
	_YP._8X(yyGetReal(_7l),yyGetReal(_8l));
}

function path_rotate(_Qe,_v4)
{
	var _YP=_IA.Paths[yyGetInt32(_Qe)];
	if(!_YP)return;
	_YP._9X(yyGetReal(_v4));
}

function path_reverse(_Qe)
{
	var _YP=_IA.Paths[yyGetInt32(_Qe)];
	if(!_YP)return;
	_YP._XQ();
}

function path_flip(_Qe)
{
	var _YP=_IA.Paths[yyGetInt32(_Qe)];
	if(!_YP)return;
	_YP._aX();
}

function path_mirror(_Qe)
{
	var _YP=_IA.Paths[yyGetInt32(_Qe)];
	if(!_YP)return;
	_YP._bX();
}

function path_change_point(_Qe,_u3,_cX,_dX,_IG)
{
	var _YP=_IA.Paths[yyGetInt32(_Qe)];
	if(!_YP)return;
	_YP._eX(_u3,yyGetReal(_cX),yyGetReal(_dX),yyGetReal(_IG));
}

function path_delete(_u3)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return;
	_IA._Hj(_YP);
}

function path_append(_u3,_TP)
{
	var _Bi=_IA.Paths[yyGetInt32(_u3)];
	if(!_Bi)return;
	var _Ci=_IA.Paths[yyGetInt32(_TP)];
	if(!_Ci)return;
	_Bi._fX(_Ci);
}

function path_add_point(_u3,_r4,_s4,_IG)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return 0;
	_YP._1Q(yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_IG));
}

function path_insert_point(_u3,_9F,_r4,_s4,_IG)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return 0;
	_YP._gX(yyGetInt32(_9F),yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_IG));
}

function path_delete_point(_u3,_9F)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return 0;
	_YP._hX(yyGetInt32(_9F));
}

function path_clear_points(_u3)
{
	var _YP=_IA.Paths[yyGetInt32(_u3)];
	if(!_YP)return 0;
	_YP._se();
}
var _iX=new _jX();
var _kX=new _jX();
var _lX=new _jX();

function physics_world_create(_mX)
{
	_mX=yyGetReal(_mX);
	if(_u2._nX)
	{
		_u2._nX._oX(_mX);
		_u2._nX._pX(_y2._z2());
	}
	else 
	{
		var physicsWorld=new _qX(_mX,_y2._z2());
		_u2._nX=physicsWorld;
	}
}

function physics_world_draw_debug(_rX)
{
	_u2._nX._sX(yyGetInt32(_rX));
}

function physics_world_gravity(_tX,_uX)
{
	_u2._nX._vX(yyGetReal(_tX),yyGetReal(_uX));
}

function physics_world_update_speed(_IG)
{
	_u2._nX._pX(yyGetInt32(_IG));
}

function physics_world_update_iterations(_xR)
{
	_u2._nX._wX(yyGetInt32(_xR));
}

function physics_pause_enable(_xX)
{
	if(yyGetBool(_xX))
	{
		_u2._nX._XA();
	}
	else 
	{
		_u2._nX._yX();
	}
}

function physics_fixture_create()
{
	var _zX=_iX._ce(new _AX());
	return _zX;
}

function physics_fixture_set_kinematic(_BX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX._DX();
}

function physics_fixture_set_density(_BX,_EX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX._FX(yyGetReal(_EX));
}

function physics_fixture_set_restitution(_BX,_GX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX._HX(yyGetReal(_GX));
}

function physics_fixture_set_friction(_BX,_IX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX._JX(yyGetReal(_IX));
}

function physics_fixture_set_collision_group(_BX,_KX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX._LX(yyGetInt32(_KX));
}

function physics_fixture_set_sensor(_BX,_MX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX._NX(yyGetBool(_MX));
}

function physics_fixture_set_linear_damping(_BX,_OX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX._PX(yyGetReal(_OX));
}

function physics_fixture_set_angular_damping(_BX,_OX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX._QX(yyGetReal(_OX));
}

function physics_fixture_set_awake(_BX,_RX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX._SX(yyGetInt32(_RX));
}

function physics_fixture_set_circle_shape(_BX,_TX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX._UX(yyGetReal(_TX)*_u2._nX._VX);
}

function physics_fixture_set_box_shape(_BX,_WX,_XX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	var scale=_u2._nX._VX;
	_CX._YX(yyGetReal(_WX)*scale,yyGetReal(_XX)*scale);
}

function physics_fixture_set_edge_shape(_BX,_wa,_xa,_ya,_za)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	var scale=_u2._nX._VX;
	_CX._ZX(yyGetReal(_wa)*scale,yyGetReal(_xa)*scale,yyGetReal(_ya)*scale,yyGetReal(_za)*scale);
}

function physics_fixture_set_polygon_shape(_BX)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX.__X();
}

function physics_fixture_set_chain_shape(_BX,_P2)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	_CX._0Y(yyGetBool(_P2));
}

function physics_fixture_add_point(_BX,_1Y,_2Y)
{
	var _CX=_iX._F4(yyGetInt32(_BX));
	var scale=_u2._nX._VX;
	_CX._3Y(yyGetReal(_1Y)*scale,yyGetReal(_2Y)*scale);
}

function physics_fixture_bind_ext(_g6,_BX,_Qe,_v3,_w3)
{
	_v3=yyGetReal(_v3);
	_w3=yyGetReal(_w3);
	var _4Y=-1;
	var _5Y=-1;
	var _CX=_iX._F4(yyGetInt32(_BX));
	var _ui=yyGetInt32(_Qe);
	if(_ui==_CR)
	{
		_ui=_g6.id;
	}
	if(_ui==_aH)
	{
		var _Qi=_Sv._0R();
		for(var _Uv=0;_Uv<_Qi.length;_Uv++)
		{
			var _rm=_Qi[_Uv];
			if(_rm.marked)continue;
			_4Y=_u2._nX._6Y(_CX,_rm,_v3,_w3,false);
		}
	}
	else if(_ui<100000)
	{
		var _Ow=_j2._F4(_ui);
		if(_Ow===null)
		{
			return _5Y;
		}
		var _Qi=_Ow._7Y();
		for(var _Uv=0;_Uv<_Qi.length;_Uv++)
		{
			var _rm=_Qi[_Uv];
			if(_rm.marked)continue;
			_4Y=_u2._nX._6Y(_CX,_rm,_v3,_w3,false);
		}
	}
	else 
	{
		var _rm=_Sv._F4(_ui);
		_4Y=_u2._nX._6Y(_CX,_rm,_v3,_w3,false);
	}
	return _4Y;
}

function physics_fixture_bind(_g6,_BX,_Qe,_8Y,_9Y)
{
	_BX=yyGetInt32(_BX);
	_Qe=yyGetInt32(_Qe);
	if(_8Y!==undefined&&_9Y!==undefined)
	{
		return physics_fixture_bind_ext(_g6,_BX,_Qe,yyGetReal(_8Y),yyGetReal(_9Y));
	}
	else 
	{
		return physics_fixture_bind_ext(_g6,_BX,_Qe,0.0,0.0);
	}
}

function physics_fixture_delete(_BX)
{
	_iX._lh(yyGetInt32(_BX));
}

function physics_joint_distance_create(_aY,_bY,_cY,_dY,_eY,_fY,_gY)
{
	var _hY=_Sv._F4(yyGetInt32(_aY));
	var _iY=_Sv._F4(yyGetInt32(_bY));
	var _jY=_u2._nX._kY(_hY._lY,_iY._lY,yyGetReal(_cY),yyGetReal(_dY),yyGetReal(_eY),yyGetReal(_fY),yyGetBool(_gY));
	if(_jY!=-1)
	{
		return _lX._ce(_jY);
	}
	return -1;
}

function physics_joint_rope_create(_aY,_bY,_cY,_dY,_eY,_fY,_mY,_gY)
{
	var _hY=_Sv._F4(yyGetInt32(_aY));
	var _iY=_Sv._F4(yyGetInt32(_bY));
	var _jY=_u2._nX._nY(_hY._lY,_iY._lY,yyGetReal(_cY),yyGetReal(_dY),yyGetReal(_eY),yyGetReal(_fY),yyGetReal(_mY),yyGetBool(_gY));
	if(_jY!=-1)
	{
		return _lX._ce(_jY);
	}
	return -1;
}

function physics_joint_revolute_create(_aY,_bY,_oY,_pY,_qY,_rY,_sY,_tY,_uY,_vY,_gY)
{
	var _hY=_Sv._F4(yyGetInt32(_aY));
	var _iY=_Sv._F4(yyGetInt32(_bY));
	var _jY=_u2._nX._wY(_hY._lY,_iY._lY,yyGetReal(_oY),yyGetReal(_pY),(yyGetReal(_qY)*Math.PI)/180.0,(yyGetReal(_rY)*Math.PI)/180.0,yyGetBool(_sY),yyGetReal(_tY),yyGetReal(_uY),yyGetBool(_vY),yyGetBool(_gY));
	if(_jY!=-1)
	{
		return _lX._ce(_jY);
	}
	return -1;
}

function physics_joint_prismatic_create(_aY,_bY,_oY,_pY,_xY,_yY,_zY,_AY,_sY,_BY,_uY,_vY,_gY)
{
	var _hY=_Sv._F4(yyGetInt32(_aY));
	var _iY=_Sv._F4(yyGetInt32(_bY));
	var _jY=_u2._nX._CY(_hY._lY,_iY._lY,yyGetReal(_oY),yyGetReal(_pY),yyGetReal(_xY),yyGetReal(_yY),yyGetReal(_zY),yyGetReal(_AY),yyGetBool(_sY),yyGetReal(_BY),yyGetReal(_uY),yyGetBool(_vY),yyGetBool(_gY));
	if(_jY!=-1)
	{
		return _lX._ce(_jY);
	}
	return -1;
}

function physics_joint_pulley_create(_aY,_bY,_cY,_dY,_eY,_fY,_DY,_EY,_FY,_GY,_HY,_gY)
{
	var _hY=_Sv._F4(yyGetInt32(_aY));
	var _iY=_Sv._F4(yyGetInt32(_bY));
	var _jY=_u2._nX._IY(_hY._lY,_iY._lY,yyGetReal(_cY),yyGetReal(_dY),yyGetReal(_eY),yyGetReal(_fY),yyGetReal(_DY),yyGetReal(_EY),yyGetReal(_FY),yyGetReal(_GY),yyGetReal(_HY),yyGetBool(_gY));
	if(_jY!=-1)
	{
		return _lX._ce(_jY);
	}
	return -1;
}

function physics_joint_wheel_create(_aY,_bY,_JY,_KY,_LY,_MY,_NY,_tY,_uY,_OY,_PY,_gY)
{
	var _hY=_Sv._F4(yyGetInt32(_aY));
	var _iY=_Sv._F4(yyGetInt32(_bY));
	var _jY=_u2._nX._QY(_hY._lY,_iY._lY,yyGetReal(_JY),yyGetReal(_KY),yyGetReal(_LY),yyGetReal(_MY),yyGetBool(_NY),yyGetReal(_tY),yyGetReal(_uY),yyGetReal(_OY),yyGetReal(_PY),yyGetBool(_gY));
	if(_jY!=-1)
	{
		return _lX._ce(_jY);
	}
	return -1;
}

function physics_joint_weld_create(_aY,_bY,_JY,_KY,_RY,_OY,_PY,_gY)
{
	var _hY=_Sv._F4(yyGetInt32(_aY));
	var _iY=_Sv._F4(yyGetInt32(_bY));
	var _jY=_u2._nX._SY(_hY._lY,_iY._lY,yyGetReal(_JY),yyGetReal(_KY),yyGetReal(_RY),yyGetReal(_OY),yyGetReal(_PY),yyGetBool(_gY));
	if(_jY!=-1)
	{
		return _lX._ce(_jY);
	}
	return -1;
}

function physics_joint_friction_create(_aY,_bY,_JY,_KY,_TY,_UY,_gY)
{
	var _hY=_Sv._F4(yyGetInt32(_aY));
	var _iY=_Sv._F4(yyGetInt32(_bY));
	var _jY=_u2._nX._VY(_hY._lY,_iY._lY,yyGetReal(_JY),yyGetReal(_KY),yyGetReal(_TY),yyGetReal(_UY),yyGetBool(_gY));
	if(_jY!=-1)
	{
		return _lX._ce(_jY);
	}
	return -1;
}

function physics_joint_gear_create(_aY,_bY,_WY,_XY,_HY)
{
	var _hY=_Sv._F4(yyGetInt32(_aY));
	var _iY=_Sv._F4(yyGetInt32(_bY));
	var _YY=_lX._F4(yyGetInt32(_WY));
	var _ZY=_lX._F4(yyGetInt32(_XY));
	if(_YY==null||_ZY==null)
	{
		_I3("A joint does not exist");
		return;
	}
	var _jY=_u2._nX.__Y(_hY._lY,_iY._lY,_YY,_ZY,yyGetReal(_HY));
	if(_jY!=-1)
	{
		return _lX._ce(_jY);
	}
	return -1;
}

function physics_joint_enable_motor(_0Z,_1Z)
{
	var _2Z=_lX._F4(yyGetInt32(_0Z));
	if(_2Z==null)
	{
		_I3("A joint does not exist");
		return;
	}
	_2Z._3Z(yyGetBool(_1Z));
}

function physics_joint_get_value(_0Z,_4Z)
{
	var _2Z=_lX._F4(yyGetInt32(_0Z));
	if(_2Z==null)
	{
		_I3("A joint does not exist");
		return;
	}
	return _2Z._5Z(yyGetInt32(_4Z));
}

function physics_joint_set_value(_0Z,_4Z,_5k)
{
	var _2Z=_lX._F4(yyGetInt32(_0Z));
	if(_2Z==null)
	{
		_I3("A joint does not exist");
		return;
	}
	return _2Z._6Z(yyGetInt32(_4Z),yyGetReal(_5k));
}

function physics_joint_delete(_7Z)
{
	_7Z=yyGetInt32(_7Z);
	var _2Z=_lX._F4(_7Z);
	if(_2Z!=null)
	{
		_u2._nX._8Z(_2Z);
	}
	_lX._lh(_7Z);
}

function physics_apply_force(_6m,_Hh,_Ih,_9Z,_aZ)
{
	var scale=_u2._nX._VX;
	var _bZ=yyGetReal(_Hh)*scale;
	var _cZ=yyGetReal(_Ih)*scale;
	_6m._lY._dZ(_bZ,_cZ,yyGetReal(_9Z),yyGetReal(_aZ));
}

function physics_apply_impulse(_6m,_Hh,_Ih,_eZ,_fZ)
{
	var scale=_u2._nX._VX;
	var _bZ=yyGetReal(_Hh)*scale;
	var _cZ=yyGetReal(_Ih)*scale;
	_6m._lY._gZ(_bZ,_cZ,yyGetReal(_eZ),yyGetReal(_fZ));
}

function physics_apply_local_force(_6m,_hZ,_iZ,_jZ,_kZ)
{
	var scale=_u2._nX._VX;
	var _lZ=yyGetReal(_hZ)*scale;
	var _mZ=yyGetReal(_iZ)*scale;
	_6m._lY._nZ(_lZ,_mZ,yyGetReal(_jZ),yyGetReal(_kZ));
}

function physics_apply_local_impulse(_6m,_hZ,_iZ,_oZ,_pZ)
{
	var scale=_u2._nX._VX;
	var _lZ=yyGetReal(_hZ)*scale;
	var _mZ=yyGetReal(_iZ)*scale;
	_6m._lY._qZ(_lZ,_mZ,yyGetReal(_oZ),yyGetReal(_pZ));
}

function physics_apply_angular_impulse(_6m,_rZ)
{
	_6m._lY._sZ(yyGetReal(_rZ));
}

function physics_apply_torque(_6m,_tZ)
{
	_6m._lY._uZ(yyGetReal(_tZ));
}

function physics_mass_properties(_6m,_vZ,_wZ,_xZ,_yZ)
{
	var scale=_u2._nX._VX;
	_6m._lY._zZ(yyGetReal(_vZ),yyGetReal(_wZ)*scale,yyGetReal(_xZ)*scale,yyGetReal(_yZ));
}

function physics_draw_debug(_6m)
{
	if((_6m._lY!=null)&&(_6m._lY!=undefined))
	{
		_6m._lY._sX(1.0/_u2._nX._VX);
	}
}

function physics_test_overlap(_g6,_r4,_s4,_v4,_ui)
{
	_ui=yyGetInt32(_ui);
	var _6m=_g6;
	if(_ui==_CR)
	{
		_ui=_6m.id;
	}
	var x=yyGetReal(_r4)*_u2._nX._VX;
	var y=yyGetReal(_s4)*_u2._nX._VX;
	var angle=(yyGetReal(_v4)*Math.PI)/180.0;
	if(_ui==_aH)
	{
		var _Qi=_Sv._0R();
		for(var _Uv=0;_Uv<_Qi.length;_Uv++)
		{
			var _rm=_Qi[_Uv];
			if(_rm.marked)continue;
			if(_u2._nX._AZ(_g6,_rm,x,y,angle))
			{
				return true;
			}
		}
	}
	else if(_ui<100000)
	{
		var _Ow=_j2._F4(_ui);
		if(_Ow===null)
		{
			return false;
		}
		var _Qi=_Ow._7Y();
		for(var _Uv=0;_Uv<_Qi.length;_Uv++)
		{
			var _rm=_Qi[_Uv];
			if(_rm.marked)continue;
			if(_u2._nX._AZ(_g6,_rm,x,y,angle))
			{
				return true;
			}
		}
	}
	else 
	{
		var _rm=_Sv._F4(_ui);
		return _u2._nX._AZ(_g6,_rm,x,y,angle);
	}
}

function physics_remove_fixture(_g6,_BZ)
{
	_BZ=yyGetInt32(_BZ);
	var _5Y=-1;
	var _ui=yyGetInt32(_g6);
	if(_ui==_CR)
	{
		_ui=_g6.id;
	}
	if(_ui==_aH)
	{
		var _Qi=_Sv._0R();
		for(var _Uv=0;_Uv<_Qi.length;_Uv++)
		{
			var _rm=_Qi[_Uv];
			if(_rm.marked)continue;
			if(_rm._lY)
			{
				_rm._lY._CZ(_BZ);
			}
		}
	}
	else if(_ui<100000)
	{
		var _Ow=_j2._F4(_ui);
		if(_Ow===null)
		{
			return _5Y;
		}
		var _Qi=_Ow._7Y();
		for(var _Uv=0;_Uv<_Qi.length;_Uv++)
		{
			var _rm=_Qi[_Uv];
			if(_rm.marked)continue;
			if(_rm._lY)
			{
				_rm._lY._CZ(_BZ);
			}
		}
	}
	else 
	{
		var _rm=_Sv._F4(_ui);
		if(_rm._lY)
		{
			_rm._lY._CZ(_BZ);
		}
	}
}

function physics_get_friction(_g6,_BZ)
{
	if(_g6._lY)
	{
		return _g6._lY._DZ(yyGetInt32(_BZ));
	}
	return 0.0;
}

function physics_get_density(_g6,_BZ)
{
	if(_g6._lY)
	{
		return _g6._lY._EZ(yyGetInt32(_BZ));
	}
	return 0.0;
}

function physics_get_restitution(_g6,_BZ)
{
	if(_g6._lY)
	{
		return _g6._lY._FZ(yyGetInt32(_BZ));
	}
	return 0.0;
}

function physics_set_friction(_g6,_BZ,_C2)
{
	if(_g6._lY)
	{
		_g6._lY._JX(yyGetInt32(_BZ),yyGetReal(_C2));
	}
}

function physics_set_density(_g6,_BZ,_C2)
{
	if(_g6._lY)
	{
		_g6._lY._FX(yyGetInt32(_BZ),yyGetReal(_C2));
	}
}

function physics_set_restitution(_g6,_BZ,_C2)
{
	if(_g6._lY)
	{
		_g6._lY._HX(yyGetInt32(_BZ),yyGetReal(_C2));
	}
}

function physics_particle_create(_GZ,x,y,_HZ,_IZ,_n3,alpha,_JZ)
{
	return _u2._nX._KZ(yyGetInt32(_GZ),yyGetReal(x),yyGetReal(y),yyGetReal(_HZ),yyGetReal(_IZ),yyGetInt32(_n3),yyGetReal(alpha),yyGetInt32(_JZ));
}

function physics_particle_delete(_o8)
{
	_u2._nX._LZ(yyGetInt32(_o8));
}

function physics_particle_delete_region_circle(x,y,_MZ)
{
	_u2._nX._NZ(yyGetReal(x),yyGetReal(y),yyGetReal(_MZ));
}

function physics_particle_delete_region_box(x,y,_OZ,_PZ)
{
	_u2._nX._QZ(yyGetReal(x),yyGetReal(y),yyGetReal(_OZ),yyGetReal(_PZ));
}

function physics_particle_delete_region_poly(_RZ)
{
	_RZ=yyGetInt32(_RZ);
	var points=[];
	for(var _u5=0;_u5<ds_list_size(_RZ);_u5++)
	{
		points.push(ds_list_find_value(_RZ,_u5));
	}
	_u2._nX._SZ(points,points.length>>1);
}

function physics_particle_group_begin(_GZ,_TZ,x,y,_UZ,_HZ,_IZ,_VZ,_n3,alpha,_WZ,_JZ)
{
	_u2._nX._XZ(yyGetInt32(_GZ),yyGetInt32(_TZ),yyGetReal(x),yyGetReal(y),yyGetReal(_UZ),yyGetReal(_HZ),yyGetReal(_IZ),yyGetReal(_VZ),yyGetInt32(_n3),yyGetReal(alpha),yyGetReal(_WZ),yyGetInt32(_JZ));
}

function physics_particle_group_circle(_MZ)
{
	_u2._nX._YZ(yyGetReal(_MZ));
}

function physics_particle_group_box(_OZ,_PZ)
{
	_u2._nX._ZZ(yyGetReal(_OZ),yyGetReal(_PZ));
}

function physics_particle_group_polygon()
{
	_u2._nX.__Z();
}

function physics_particle_group_add_point(x,y)
{
	_u2._nX._0_(yyGetReal(x),yyGetReal(y));
}

function physics_particle_group_end()
{
	return _u2._nX._1_();
}

function physics_particle_group_join(_2_,from)
{
	_u2._nX._3_(yyGetInt32(_2_),yyGetInt32(from));
}

function physics_particle_group_delete(_o8)
{
	_u2._nX._4_(yyGetInt32(_o8));
}

function physics_particle_draw(_5_,_JZ,_xL,_6_)
{
	var _1w=_E4._F4(yyGetInt32(_xL));
	if(_1w!==null)
	{
		_u2._nX._7_(yyGetInt32(_5_),yyGetInt32(_JZ),_1w,yyGetInt32(_6_));
	}
}

function physics_particle_draw_ext(_5_,_JZ,_xL,_6_,_ZH,__H,angle,_n3,alpha)
{
	var _1w=_E4._F4(yyGetInt32(_xL));
	if(_1w!==null)
	{
		_u2._nX._8_(yyGetInt32(_5_),yyGetInt32(_JZ),_1w,yyGetInt32(_6_),yyGetReal(_ZH),yyGetReal(__H),yyGetReal(angle),yyGetInt32(_n3),yyGetReal(alpha));
	}
}

function physics_particle_count()
{
	return _u2._nX._9_();
}

function physics_particle_get_data(buffer,_a_)
{
	var _G9=_JE._F4(yyGetInt32(buffer));
	if(_G9)
	{
		_u2._nX._b_(_G9,yyGetInt32(_a_));
	}
}

function physics_particle_get_max_count()
{
	return _u2._nX._c_();
}

function physics_particle_get_radius()
{
	return _u2._nX._d_();
}

function physics_particle_get_density()
{
	return _u2._nX._e_();
}

function physics_particle_get_damping()
{
	return _u2._nX._f_();
}

function physics_particle_get_gravity_scale()
{
	return _u2._nX._g_();
}

function physics_particle_set_max_count(_u7)
{
	_u2._nX._h_(yyGetInt32(_u7));
}

function physics_particle_set_radius(_MZ)
{
	_u2._nX._i_(yyGetReal(_MZ));
}

function physics_particle_set_density(_j_)
{
	_u2._nX._k_(yyGetReal(_j_));
}

function physics_particle_set_damping(_l_)
{
	_u2._nX._m_(yyGetReal(_l_));
}

function physics_particle_set_gravity_scale(scale)
{
	_u2._nX._n_(yyGetReal(scale));
}

function physics_particle_set_flags(_u3,_o_)
{
	_u2._nX._p_(yyGetInt32(_u3),yyGetInt32(_o_));
}

function physics_particle_set_category_flags(_q_,_o_)
{
	_u2._nX._r_(yyGetInt32(_q_),yyGetInt32(_o_));
}

function physics_particle_set_group_flags(_KX,_rX)
{
	_u2._nX._s_(yyGetInt32(_KX),yyGetInt32(_rX));
}

function physics_particle_get_group_flags(_KX)
{
	return _u2._nX._t_(yyGetInt32(_KX));
}

function physics_particle_get_data_particle(_o8,buffer,_a_)
{
	var _G9=_JE._F4(yyGetInt32(buffer));
	if(_G9)
	{
		_u2._nX._u_(yyGetInt32(_o8),_G9,yyGetInt32(_a_));
	}
}

function physics_particle_group_count(_v_)
{
	return _u2._nX._w_(yyGetInt32(_v_));
}

function physics_particle_group_get_data(_v_,buffer,_a_)
{
	var _G9=_JE._F4(yyGetInt32(buffer));
	if(_G9)
	{
		_u2._nX._x_(yyGetInt32(_v_),_G9,yyGetInt32(_a_));
	}
}

function physics_particle_group_get_mass(_v_)
{
	return _u2._nX._y_(yyGetInt32(_v_));
}

function physics_particle_group_get_inertia(_v_)
{
	return _u2._nX._z_(yyGetInt32(_v_));
}

function physics_particle_group_get_centre_x(_v_)
{
	return _u2._nX._A_(yyGetInt32(_v_));
}

function physics_particle_group_get_centre_y(_v_)
{
	return _u2._nX._B_(yyGetInt32(_v_));
}

function physics_particle_group_get_vel_x(_v_)
{
	return _u2._nX._C_(yyGetInt32(_v_));
}

function physics_particle_group_get_vel_y(_v_)
{
	return _u2._nX._D_(yyGetInt32(_v_));
}

function physics_particle_group_get_ang_vel(_v_)
{
	return _u2._nX._E_(yyGetInt32(_v_));
}

function physics_particle_group_get_x(_v_)
{
	return _u2._nX._F_(yyGetInt32(_v_));
}

function physics_particle_group_get_y(_v_)
{
	return _u2._nX._G_(yyGetInt32(_v_));
}

function physics_particle_group_get_angle(_v_)
{
	return _u2._nX._H_(yyGetInt32(_v_));
}

function _I_(_J_,_K_,_L_,_M_,_ui,_N_,_O_)
{
	var _r3=undefined;
	if(_ui==_CR)
	{
		_ui=_g6.id;
	}
	if(_ui==_aH)
	{
		var _P_=Number.MAX_VALUE;
		var _Q_=undefined;
		var _Qi=_Sv._0R();
		for(var _Uv=0;_Uv<_Qi.length;_Uv++)
		{
			var _rm=_Qi[_Uv];
			if(_rm.marked)continue;
			if(_rm._lY)
			{
				var _B5=_rm._lY._R_(_J_,_K_,_L_,_M_,_O_);
				if(_B5!=undefined)
				{
					variable_struct_set(_B5,"instance",_rm.id);
					let _S_=yyGetReal(variable_struct_get(_B5,"fraction"));
					if(_N_)
					{
						if(_r3==undefined)_r3=[];
						_r3=_r3.concat(_B5);
					}
					else if(_S_<_P_)
					{
						_Q_=_B5;
						_P_=_S_;
					}
				}
			}
		}
		if(_Q_!=undefined)
		{
			_r3=[_Q_];
		}
	}
	else if(_ui<100000)
	{
		var _Ow=_j2._F4(_ui);
		if(_Ow!==null)
		{
			var _P_=Number.MAX_VALUE;
			var _Q_=undefined;
			var _Qi=_Ow._7Y();
			for(var _Uv=0;_Uv<_Qi.length;_Uv++)
			{
				var _rm=_Qi[_Uv];
				if(_rm.marked)continue;
				if(_rm._lY)
				{
					var _B5=_rm._lY._R_(_J_,_K_,_L_,_M_,_O_);
					if(_B5!=undefined)
					{
						variable_struct_set(_B5,"instance",_rm.id);
						let _S_=yyGetReal(variable_struct_get(_B5,"fraction"));
						if(_N_)
						{
							if(_r3==undefined)_r3=[];
							_r3=_r3.concat(_B5);
						}
						else if(_S_<_P_)
						{
							_Q_=_B5;
							_P_=_S_;
						}
					}
				}
			}
			if(_Q_!=undefined)
			{
				_r3=[_Q_];
			}
		}
	}
	else 
	{
		var _rm=_Sv._F4(_ui);
		if(_rm._lY)
		{
			var _B5=_rm._lY._R_(_J_,_K_,_L_,_M_,_O_);
			if(_B5!=undefined)
			{
				variable_struct_set(_B5,"instance",_rm.id);
				if(_r3==undefined)_r3=[];
				_r3=_r3.concat(_B5);
			}
		}
	}
	return _r3;
}

function physics_raycast(_J_,_K_,_L_,_M_,ids,_N_,_O_)
{
	_N_??=false;
	_O_??=1.0;
	if(Array.isArray(ids))
	{
		var _P_=Number.MAX_VALUE;
		var _Q_=undefined;
		var _r3=undefined;
		for(var i=0;i<ids.length;++i)
		{
			var _f3=_I_(_J_,_K_,_L_,_M_,yyGetInt32(ids[i]),_N_,_O_);
			if(_f3!=undefined)
			{
				if(_N_)
				{
					if(_r3==undefined)_r3=[];
					_r3=_r3.concat(_f3);
				}
				else 
				{
					for(h in _f3)
					{
						if(h._T_<_P_)
						{
							_P_=h._T_;
							_Q_=h;
						}
					}
				}
			}
		}
		if(_Q_!=undefined)
		{
			_r3=[_Q_];
		}
		return _r3;
	}
	else 
	{
		return _I_(_J_,_K_,_L_,_M_,yyGetInt32(ids),_N_,_O_);
	}
}
var _U_=false;
var _V_=false;

function room_exists(_u3)
{
	var room=_HA._F4(yyGetInt32(_u3));
	if((room===null)||(room==undefined))
	{
		return false;
	}
	return true;
}

function room_get_name(_u3)
{
	var _sm=_HA._F4(yyGetInt32(_u3));
	if(_sm===null)return "";
	if((_sm._W_===undefined)||(_sm._W_===null))return "";
	return _sm._W_.pName;
}

function _X_(_u3)
{
	return room_get_name(_u3);
}

function room_get_info(_u3,_Y_,_Z_,___,_001,_101)
{
	var _sm=_HA._F4(yyGetInt32(_u3));
	var _r3=
	{
	}
	;
	_r3.__yyIsGMLObject=true;
	if((_sm!==null)&&(_sm._W_!==undefined)&&(_sm._W_!==null))
	{
		_Y_=_Y_??true;
		_Z_=_Z_??true;
		___=___??true;
		_001=_001??true;
		_101=_101??true;
		var _201=_sm._W_;
		variable_struct_set(_r3,"width",_201.width?_201.width:1024);
		variable_struct_set(_r3,"height",_201.height?_201.height:768);
		variable_struct_set(_r3,"persistent",_201.persistent?_201.persistent:false);
		variable_struct_set(_r3,"colour",_201.colour?_201.colour:0xc0c0c0);
		variable_struct_set(_r3,"creationCode",_201.pCode?_201.pCode:-1);
		variable_struct_set(_r3,"physicsWorld",_201.physicsWorld?_201.physicsWorld:false);
		if(_201.physicsWorld)
		{
			variable_struct_set(_r3,"physicsGravityX",_201.physicsGravityX?_201.physicsGravityX:0);
			variable_struct_set(_r3,"physicsGravityY",_201.physicsGravityY?_201.physicsGravityY:0);
			variable_struct_set(_r3,"physicsPixToMeters",_201.physicsPixToMeters?_201.physicsPixToMeters:0);
		}
		variable_struct_set(_r3,"enableViews",_201.enableViews?_201.enableViews:false);
		variable_struct_set(_r3,"clearDisplayBuffer",_201._301?_201._301:true);
		variable_struct_set(_r3,"clearViewportBackground",_201._401?_201._401:true);
		if(_Y_)
		{
			var views=new Array(_201.views.length);
			for(var i=0;i<_201.views.length;i++)
			{
				var _501=_201.views[i];
				if(_501)
				{
					var _Z3=
					{
					}
					;
					_Z3.__yyIsGMLObject=true;
					variable_struct_set(_Z3,"visible",_501.visible?_501.visible:false);
					variable_struct_set(_Z3,"xview",_501.xview?_501.xview:0);
					variable_struct_set(_Z3,"yview",_501.yview?_501.yview:0);
					variable_struct_set(_Z3,"wview",_501.wview?_501.wview:640);
					variable_struct_set(_Z3,"hview",_501.hview?_501.hview:480);
					variable_struct_set(_Z3,"xport",_501.xport?_501.xport:0);
					variable_struct_set(_Z3,"yport",_501.yport?_501.yport:0);
					variable_struct_set(_Z3,"wport",_501.wport?_501.wport:640);
					variable_struct_set(_Z3,"hport",_501.hport?_501.hport:480);
					variable_struct_set(_Z3,"hborder",_501.hborder?_501.hborder:32);
					variable_struct_set(_Z3,"vborder",_501.vborder?_501.vborder:32);
					variable_struct_set(_Z3,"hspeed",_501.hspeed?_501.hspeed:-1);
					variable_struct_set(_Z3,"vspeed",_501.vspeed?_501.vspeed:-1);
					var _601=_501.index?((_501.index>=100000)?_dm(_em,_501.index):_dm(_701,_501.index)):-1;
					variable_struct_set(_Z3,"object",_601);
					variable_struct_set(_Z3,"cameraID",_501._801?_501._801:-1);
					views[i]=_Z3;
				}
			}
			variable_struct_set(_r3,"views",views);
		}
		if(_Z_)
		{
			var _ET=new Array(_201.pInstances.length);
			for(var i=0;i<_201.pInstances.length;i++)
			{
				var _901=_201.pInstances[i];
				if(_901)
				{
					var _Ow=_j2._F4(yyGetInt32(_901.index));
					var _Uv=
					{
					}
					;
					_Uv.__yyIsGMLObject=true;
					variable_struct_set(_Uv,"x",_901.x?_901.x:0);
					variable_struct_set(_Uv,"y",_901.y?_901.y:0);
					_Uv.object_index=_Ow._0w;
					_Uv.id=_901.id;
					variable_struct_set(_Uv,"angle",_901.angle?_901.angle:0);
					variable_struct_set(_Uv,"xscale",_901.scaleX?_901.scaleX:1);
					variable_struct_set(_Uv,"yscale",_901.scaleY?_901.scaleY:1);
					variable_struct_set(_Uv,"image_speed",_901.imageSpeed?_901.imageSpeed:1);
					variable_struct_set(_Uv,"image_index",_901.imageIndex?_901.imageIndex:0);
					variable_struct_set(_Uv,"colour",_901.image_blend?_901.image_blend:0x00ffffff);
					variable_struct_set(_Uv,"creation_code",_901.pCode?_901.pCode:-1);
					variable_struct_set(_Uv,"pre_creation_code",_901.pPreCreateCode?_901.pPreCreateCode:-1);
					_ET[i]=_Uv;
				}
			}
			variable_struct_set(_r3,"instances",_ET);
		}
		if(___)
		{
			var layers=new Array(_201.layers.length);
			for(var i=0;i<_201.layers.length;i++)
			{
				var _a01=_201.layers[i];
				if(_a01!=null)
				{
					var _b01=
					{
					}
					;
					_b01.__yyIsGMLObject=true;
					variable_struct_set(_b01,"name",_a01.pName?_a01.pName:"");
					variable_struct_set(_b01,"id",_a01.id?_a01.id:0);
					variable_struct_set(_b01,"type",_a01.type?_a01.type:0);
					variable_struct_set(_b01,"depth",_a01.depth?_a01.depth:0);
					variable_struct_set(_b01,"xoffset",_a01.x?_a01.x:0);
					variable_struct_set(_b01,"yoffset",_a01.y?_a01.y:0);
					variable_struct_set(_b01,"hspeed",_a01.hspeed?_a01.hspeed:0);
					variable_struct_set(_b01,"vspeed",_a01.vspeed?_a01.vspeed:0);
					variable_struct_set(_b01,"visible",_a01.visible?_a01.visible:true);
					variable_struct_set(_b01,"effectEnabled",_a01.effectEnabled?_a01.effectEnabled:true);
					variable_struct_set(_b01,"effectType",_a01.effectType?_a01.effectType:-1);
					_c01=new Array(_a01.effectProperties.length);
					var _d01;
					for(_d01=0;_d01<_a01.effectProperties.length;_d01++)
					{
						var _e01=
						{
						}
						;
						_e01.__yyIsGMLObject=true;
						variable_struct_set(_e01,"type",_a01.effectProperties[_d01].type);
						variable_struct_set(_e01,"name",_a01.effectProperties[_d01].name);
						variable_struct_set(_e01,"value",_a01.effectProperties[_d01].value);
						_c01[_d01]=_e01;
					}
					variable_struct_set(_b01,"effectParams",_c01);
					layers[i]=_b01;
					if(_001)
					{
						var elements=[];
						switch(_a01.type)
						{
							case _CH:var _Sb=
							{
							}
							;
							_Sb.__yyIsGMLObject=true;
							variable_struct_set(_Sb,"type",_a01.type);
							elements[0]=_Sb;
							variable_struct_set(_Sb,"visible",_a01.bvisible?_a01.bvisible:true);
							variable_struct_set(_Sb,"foreground",_a01.bforeground?_a01.bforeground:false);
							variable_struct_set(_Sb,"sprite_index",_a01.bindex?_dm(_f01,_a01.bindex):0);
							variable_struct_set(_Sb,"htiled",_a01.bhtiled?_a01.bhtiled:false);
							variable_struct_set(_Sb,"vtiled",_a01.bvtiled?_a01.bvtiled:false);
							variable_struct_set(_Sb,"stretch",_a01.bstretch?_a01.bstretch:false);
							variable_struct_set(_Sb,"blendColour",_a01.bblend?_a01.bblend&0xffffff:0x00ffffff);
							variable_struct_set(_Sb,"blendAlpha",_a01.bblend?(((_a01.bblend&0xff000000)>>24)&0xff)/255:1);
							variable_struct_set(_Sb,"image_speed",_a01.bimage_speed?_a01.bimage_speed:1);
							variable_struct_set(_Sb,"image_index",_a01.bimage_index?_a01.bimage_index:0);
							variable_struct_set(_Sb,"speed_type",_a01.playbackspeedtype?_a01.playbackspeedtype:0);
							break;
							case _DH:elements=new Array(_a01.iinstIDs.length);
							for(var _5w=0;_5w<_a01.iinstIDs.length;
++_5w)
							{
								var _Sb=
								{
								}
								;
								_Sb.__yyIsGMLObject=true;
								variable_struct_set(_Sb,"type",_a01.type);
								variable_struct_set(_Sb,"inst_id",_dm(_em,_a01.iinstIDs[_5w]));
								elements[_5w]=_Sb;
							}
							break;
							case _FH:var _Sb=
							{
							}
							;
							_Sb.__yyIsGMLObject=true;
							variable_struct_set(_Sb,"type",_a01.type);
							elements[0]=_Sb;
							variable_struct_set(_Sb,"x",0);
							variable_struct_set(_Sb,"y",0);
							variable_struct_set(_Sb,"width",_a01.tMapWidth?_a01.tMapWidth:0);
							variable_struct_set(_Sb,"height",_a01.tMapHeight?_a01.tMapHeight:0);
							variable_struct_set(_Sb,"tileset_index",_a01.tIndex?_dm(_g01,_a01.tIndex):0);
							if(_101)variable_struct_set(_Sb,"tiles",_a01.ttiles?_oM(_a01.ttiles):[]);
							break;
							case _EH:var _h01;
							for(_h01=0;_h01<_a01.assets.length;_h01++)
							{
								var _Sb=
								{
								}
								;
								_Sb.__yyIsGMLObject=true;
								variable_struct_set(_Sb,"type",7);
								variable_struct_set(_Sb,"x",_a01.assets[_h01].ax);
								variable_struct_set(_Sb,"y",_a01.assets[_h01].ay);
								variable_struct_set(_Sb,"sprite_index",_dm(_f01,_a01.assets[_h01].aindex));
								variable_struct_set(_Sb,"xo",_a01.assets[_h01].aXO);
								variable_struct_set(_Sb,"yo",_a01.assets[_h01].aYO);
								variable_struct_set(_Sb,"width",_a01.assets[_h01].aW);
								variable_struct_set(_Sb,"height",_a01.assets[_h01].aH);
								variable_struct_set(_Sb,"id",_a01.assets[_h01].aId);
								variable_struct_set(_Sb,"image_xscale",_a01.assets[_h01].aXScale);
								variable_struct_set(_Sb,"image_yscale",_a01.assets[_h01].aYScale);
								variable_struct_set(_Sb,"image_blend",_a01.assets[_h01].aBlend&0x00ffffff);
								variable_struct_set(_Sb,"image_alpha",(((_a01.assets[_h01].aBlend&0xff000000)>>24)&0xff)/255);
								variable_struct_set(_Sb,"visible",true);
								elements.push(_Sb);
							}
							for(_h01=0;_h01<_a01.sprites.length;_h01++)
							{
								var _Sb=
								{
								}
								;
								_Sb.__yyIsGMLObject=true;
								variable_struct_set(_Sb,"type",4);
								variable_struct_set(_Sb,"id",_a01.sprites[_h01].sName);
								variable_struct_set(_Sb,"sprite_index",_dm(_f01,_a01.sprites[_h01].sIndex));
								variable_struct_set(_Sb,"x",_a01.sprites[_h01].sX);
								variable_struct_set(_Sb,"y",_a01.sprites[_h01].sY);
								variable_struct_set(_Sb,"image_xscale",_a01.sprites[_h01].sXScale);
								variable_struct_set(_Sb,"image_yscale",_a01.sprites[_h01].sYScale);
								variable_struct_set(_Sb,"image_blend",_a01.sprites[_h01].sBlend&0x00ffffff);
								variable_struct_set(_Sb,"image_alpha",(((_a01.sprites[_h01].sBlend&0xff000000)>>24)&0xff)/255);
								variable_struct_set(_Sb,"speed_type",_a01.sprites[_h01].sPlaybackSpeedType);
								variable_struct_set(_Sb,"image_speed",_a01.sprites[_h01].sImageSpeed);
								variable_struct_set(_Sb,"image_index",_a01.sprites[_h01].sImageIndex);
								variable_struct_set(_Sb,"image_angle",_a01.sprites[_h01].sRotation);
								elements.push(_Sb);
							}
							for(_h01=0;_h01<_a01.sequences.length;
_h01++)
							{
								var _Sb=
								{
								}
								;
								_Sb.__yyIsGMLObject=true;
								variable_struct_set(_Sb,"type",8);
								variable_struct_set(_Sb,"id",_a01.sequences[_h01].sName);
								variable_struct_set(_Sb,"seq_id",_dm(_i01,_a01.sequences[_h01].sIndex));
								variable_struct_set(_Sb,"x",_a01.sequences[_h01].sX);
								variable_struct_set(_Sb,"y",_a01.sequences[_h01].sY);
								variable_struct_set(_Sb,"image_xscale",_a01.sequences[_h01].sXScale);
								variable_struct_set(_Sb,"image_yscale",_a01.sequences[_h01].sYScale);
								variable_struct_set(_Sb,"image_blend",_a01.sequences[_h01].sBlend&0x00ffffff);
								variable_struct_set(_Sb,"image_alpha",(((_a01.sequences[_h01].sBlend&0xff000000)>>24)&0xff)/255);
								variable_struct_set(_Sb,"speed_type",_a01.sequences[_h01].sPlaybackSpeedType);
								variable_struct_set(_Sb,"image_speed",_a01.sequences[_h01].sImageSpeed);
								variable_struct_set(_Sb,"head_position",_a01.sequences[_h01].sHeadPosition);
								variable_struct_set(_Sb,"angle",_a01.sequences[_h01].sRotation);
								elements.push(_Sb);
							}
							for(_h01=0;i<_a01.particles.length;_h01++)
							{
								var _j01=_a01.particles[_h01];
								var _Sb=
								{
								}
								;
								_Sb.__yyIsGMLObject=true;
								variable_struct_set(_Sb,"type",6);
								variable_struct_set(_Sb,"id",_j01.sName);
								variable_struct_set(_Sb,"ps",_dm(_GT,_j01.sIndex));
								variable_struct_set(_Sb,"x",_j01.sX);
								variable_struct_set(_Sb,"y",_j01.sY);
								variable_struct_set(_Sb,"xscale",_j01.sXScale);
								variable_struct_set(_Sb,"yscale",_j01.sYScale);
								variable_struct_set(_Sb,"blend",_j01.sBlend&0x00ffffff);
								variable_struct_set(_Sb,"alpha",(((_j01.sBlend&0xff000000)>>24)&0xff)/255);
								variable_struct_set(_Sb,"angle",_j01.sRotation);
								elements.push(_Sb);
							}
							for(_h01=0;
_h01<_a01.textitems.length;_h01++)
							{
								var _Sb=
								{
								}
								;
								_Sb.__yyIsGMLObject=true;
								variable_struct_set(_Sb,"type",9);
								variable_struct_set(_Sb,"id",_a01.textitems[_h01].sName);
								variable_struct_set(_Sb,"font_id",_dm(_5N,_a01.textitems[_h01].sFontIndex));
								variable_struct_set(_Sb,"text",_a01.textitems[_h01].sText);
								variable_struct_set(_Sb,"x",_a01.textitems[_h01].sX);
								variable_struct_set(_Sb,"y",_a01.textitems[_h01].sY);
								variable_struct_set(_Sb,"xorigin",_a01.textitems[_h01].sXOrigin);
								variable_struct_set(_Sb,"yorigin",_a01.textitems[_h01].sYOrigin);
								variable_struct_set(_Sb,"h_align",_a01.textitems[_h01].sAlignment&0xff);
								variable_struct_set(_Sb,"v_align",(_a01.textitems[_h01].sAlignment>>8)&0xff);
								variable_struct_set(_Sb,"char_spacing",_a01.textitems[_h01].sCharSpacing);
								variable_struct_set(_Sb,"line_spacing",_a01.textitems[_h01].sLineSpacing);
								variable_struct_set(_Sb,"frame_width",_a01.textitems[_h01].sFrameW);
								variable_struct_set(_Sb,"frame_height",_a01.textitems[_h01].sFrameH);
								variable_struct_set(_Sb,"wrap",_a01.textitems[_h01].sWrap);
								variable_struct_set(_Sb,"xscale",_a01.textitems[_h01].sXScale);
								variable_struct_set(_Sb,"yscale",_a01.textitems[_h01].sYScale);
								variable_struct_set(_Sb,"blend",_a01.textitems[_h01].sBlend&0x00ffffff);
								variable_struct_set(_Sb,"alpha",(((_a01.textitems[_h01].sBlend&0xff000000)>>24)&0xff)/255);
								variable_struct_set(_Sb,"angle",_a01.textitems[_h01].sRotation);
								elements.push(_Sb);
							}
							break;
							case _HH:break;
						}
						variable_struct_set(_b01,"elements",elements);
					}
				}
			}
			variable_struct_set(_r3,"layers",layers);
		}
	}
	return _r3;
}

function room_set_width(_u3,_eh)
{
	var _sm=_HA._F4(yyGetInt32(_u3));
	if(_sm===null)return;
	_sm._W_.width=yyGetInt32(_eh);
}

function room_set_height(_u3,_fh)
{
	var _sm=_HA._F4(yyGetInt32(_u3));
	if(_sm===null)return;
	_sm._W_.height=yyGetInt32(_fh);
}

function room_set_persistent(_u3,_C2)
{
	var _sm=_HA._F4(yyGetInt32(_u3));
	if(_sm===null)return;
	var persistent=yyGetBool(_C2);
	_sm._W_.persistent=persistent;
}

function room_set_background_color(_u3,_nb,_k01)
{
	var _sm=_HA._F4(yyGetInt32(_u3));
	if(_sm===null)return;
	_sm._W_.colour=yyGetInt32(_nb);
	_sm._W_.showColour=yyGetBool(_k01);
}
var room_set_background_colour=room_set_background_color;

function room_get_camera(_l01,_m01)
{
	var _sm=_HA._F4(yyGetInt32(_l01));
	if(_sm)
	{
		var _n01=_sm._W_.views;
		if(!_n01)return -1;
		var _Tp=_n01[yyGetInt32(_m01)];
		if(_Tp)
		{
			if(_Tp._801!==undefined)
			{
				return _Tp._801;
			}
		}
	}
	return -1;
}

function room_set_camera(_l01,_m01,_o01)
{
	_m01=yyGetInt32(_m01);
	var _sm=_HA._F4(yyGetInt32(_l01));
	if(_sm)
	{
		var _n01=_sm._W_.views;
		if(!_n01)
		{
			_sm._W_.views=[];
			_n01=_sm._W_.views;
			for(var i=0;i<8;i++)
			{
				_n01[i]=
				{
				}
				;
			}
		}
		var _Tp=_n01[_m01];
		if(!_Tp)
		{
			_n01[_m01]=
			{
			}
			;
			_Tp=_n01[_m01];
		}
		_Tp._801=yyGetInt32(_o01);
	}
}

function room_get_viewport(_l01,_m01)
{
	var _r3=[];
	_r3[0]=0;
	_r3[1]=0;
	_r3[2]=0;
	_r3[3]=640;
	_r3[4]=480;
	var _sm=_HA._F4(yyGetInt32(_l01));
	if(_sm)
	{
		var _n01=_sm._W_.views;
		if(_n01)
		{
			var _Tp=_n01[yyGetInt32(_m01)];
			if(_Tp)
			{
				if(_Tp.visible!==undefined)_r3[0]=_Tp.visible;
				if(_Tp.xport!==undefined)_r3[1]=_Tp.xport;
				if(_Tp.yport!==undefined)_r3[2]=_Tp.yport;
				if(_Tp.wport!==undefined)_r3[3]=_Tp.wport;
				if(_Tp.hport!==undefined)_r3[4]=_Tp.hport;
				return _r3;
			}
		}
	}
	_r3[0]=0;
	_r3[1]=0;
	_r3[2]=0;
	_r3[3]=0;
	_r3[4]=0;
	return _r3;
}

function room_set_viewport(_l01,_m01,_p01,_q01,_r01,_s01,_t01)
{
	_m01=yyGetInt32(_m01);
	var _sm=_HA._F4(yyGetInt32(_l01));
	if(_sm)
	{
		if(_sm._W_)
		{
			var _Tp=_sm._W_.views;
			if(!_Tp)
			{
				_sm._W_.views=[];
				for(var i=0;i<8;i++)
				{
					_sm._W_.views[i]=
					{
					}
					;
				}
			}
			_Tp=_Tp[_m01];
			if(_Tp===undefined)
			{
				_Tp[_m01]=
				{
				}
				;
				_Tp=_Tp[_m01];
			}
			_Tp.visible=yyGetBool(_p01);
			_Tp.xport=yyGetInt32(_q01);
			_Tp.yport=yyGetInt32(_r01);
			_Tp.wport=yyGetInt32(_s01);
			_Tp.hport=yyGetInt32(_t01);
		}
	}
}

function room_set_view_enabled(_u3,_C2)
{
	var _sm=_HA._F4(yyGetInt32(_u3));
	if(_sm)
	{
		_sm._W_.enableViews=yyGetBool(_C2);
	}
}

function room_add()
{
	var _sm=new _u01();
	_sm._v01();
	_HA._ce(_sm);
	return _sm.id;
}

function room_duplicate(_u3)
{
	_u3=yyGetInt32(_u3);
	var _sm=_HA._F4(_u3);
	if(!_sm)
	{
		debug("Trying to duplicate non-existent room.");
		return 0;
	}
	return _HA._w01(_u3);
}

function room_assign(_u3,_VJ)
{
	_u3=yyGetInt32(_u3);
	_VJ=yyGetInt32(_VJ);
	if(_HA._F4(_u3)&&_HA._F4(_VJ))
	{
		_HA._x01(_u3,_VJ);
		return true;
	}
	return false;
}

function room_instance_add(_u3,_r4,_s4,_ui)
{
	var _sm=_HA._F4(yyGetInt32(_u3));
	if(_sm)
	{
		var instance_id=_NG++;
		var _fO=_sm._W_.pInstances.length;
		_sm._W_.pInstances[_fO]=
		{
			x:yyGetReal(_r4),y:yyGetReal(_s4),index:yyGetInt32(_ui),id:instance_id		}
		;
		return _dm(_em,instance_id);
	}
	return 0;
}

function room_instance_clear(_u3)
{
	var _sm=_HA._F4(yyGetInt32(_u3));
	if(_sm)
	{
		_sm._y01();
	}
}

function room_goto_next()
{
	if((_u2._z01+1)>=_HA._A01.length)return;
	_B01=_HA._C01(_u2._z01+1).id;
}

function room_restart()
{
	_B01=_u2.id;
}
;

function room_goto(_VJ)
{
	_VJ=yyGetInt32(_VJ);
	var _D01=_HA._F4(_VJ);
	if((_D01==null)||(_D01==undefined))
	{
		_sg("Error: Room "+_VJ+" is not a valid room index");
	}
	else 
	{
		_B01=_VJ;
	}
}
;

function room_goto_previous()
{
	if((_u2._z01-1)<0)return;
	_B01=_HA._C01(_u2._z01-1).id;
}
;

function room_previous(_hy)
{
	var _ej=-1;
	for(var i=0;i<_HA._E01.length;i++)
	{
		if(_HA._E01[i]==yyGetInt32(_hy))return _ej;
		_ej=_HA._E01[i];
	}
	return -1;
}
;

function room_next(_hy)
{
	for(var i=0;i<(_HA._E01.length-1);i++)
	{
		if(_HA._E01[i]==yyGetInt32(_hy))
		{
			return _HA._E01[i+1];
		}
	}
	return -1;
}
;

function game_end()
{
	_B01=_F01;
	if(_U_==false)
	{
		_U_=true;
		if(typeof(gmlGameEndScripts)=="function")
		{
			gmlGameEndScripts();
		}
	}
	if(!_V_)
	{
		if(arguments.length>0)show_debug_message("###game_end###"+arguments[0]);
		else show_debug_message("###game_end###0");
		_V_=true;
	}
}

function game_restart()
{
	g_pBuiltIn.score=0;
	g_pBuiltIn.lives=0;
	g_pBuiltIn.health=100;
	_B01=_G01;
}

function _H01(_C2)
{
	var _I01=null;
	if(typeof(_C2)=="object")
	{
		return _C2;
	}
	else 
	{
		var _J01=yyGetInt32(_C2);
		_I01=_KA._YN(_J01);
	}
	return _I01;
}

function sequence_create()
{
	var _I01=_KA._K01();
	if(_I01==null)
	{
		_I3("sequence_create() - could not create new sequence");
	}
	else 
	{
		return _I01;
	}
	return -1;
}

function sequence_destroy(_L01)
{
	if(arguments.length!=1)
	{
		_I3("sequence_destroy() - requires a sequence ID or object");
	}
	var _I01=_H01(_L01);
	if(_I01==null)
	{
		_I3("sequence_destroy() - specified sequence not valid");
	}
	else if(_I01._9k==true)
	{
		_I3("sequence_destroy() - can't delete a sequence created in the IDE");
	}
	else 
	{
		_KA._M01(_I01);
	}
}

function sequence_get(_N01)
{
	if(arguments.length!=1)
	{
		_I3("sequence_get() - requires a sequence ID");
	}
	var _I01=_H01(_N01);
	if(_I01==null)
	{
		_I3("sequence_get() - specified sequence not valid");
	}
	else 
	{
		return _I01;
	}
}

function sequence_exists(_O01)
{
	if(arguments.length!=1)
	{
		_I3("sequence_exists() - requires a sequence ID or struct");
	}
	var _bk=false;
	if(typeof(_O01)=="object")
	{
		if(_O01 instanceof _P01)
		{
			if(_KA._Q01(_O01))
			{
				_bk=true;
			}
		}
	}
	else 
	{
		var _J01=yyGetInt32(_O01);
		if(_KA._YN(_J01)!=null)
		{
			_bk=true;
		}
	}
	return _bk?1.0:0.0;
}

function _R01(_Ob)
{
	if(arguments.length!=1)
	{
		_I3("sequencekeyframestore_new() - requires a type parameter");
	}
	_Ob=yyGetInt32(_Ob);
	var _S01=null;
	switch(_Ob)
	{
		case _T01:case _U01:case _V01:case _W01:case _DL:case _X01:case _Y01:case _Z01:case __01:case _011:case _111:case _211:_S01=new _311(_Ob);
		break;
		default :_I3("Unsupported keyframe store type");
		break;
	}
	if(_S01==null)
	{
		return -1;
	}
	else 
	{
		return _S01;
	}
}

function sequence_keyframe_new(_Ob)
{
	if(arguments.length!=1)
	{
		_I3("sequencekeyframe_new() - requires a type parameter");
	}
	_Ob=yyGetInt32(_Ob);
	var _411=null;
	switch(_Ob)
	{
		case _T01:case _U01:case _V01:case _W01:case _511:case _DL:case _X01:case _Y01:case _Z01:case __01:case _011:case _111:case _211:_411=new _611(_Ob);
		break;
		default :_I3("Unsupported keyframe type");
		break;
	}
	if(_411==null)
	{
		return -1;
	}
	else 
	{
		return _411;
	}
}

function sequence_keyframedata_new(_Ob)
{
	if(arguments.length!=1)
	{
		_I3("sequencekeyframedata_new() - requires a type parameter");
	}
	_Ob=yyGetInt32(_Ob);
	var _3F=null;
	switch(_Ob)
	{
		case _T01:_3F=new _711();
		break;
		case _U01:_3F=new _811();
		break;
		case _V01:_3F=new _911();
		break;
		case _W01:_3F=new _a11();
		break;
		case _511:_3F=new _b11();
		break;
		case _DL:_3F=new _c11();
		break;
		case _X01:_3F=new _d11();
		break;
		case _Y01:_3F=new _e11();
		break;
		case _Z01:_3F=new _f11();
		break;
		case __01:_3F=new _g11();
		break;
		case _011:_3F=new _h11();
		break;
		case _111:_3F=new _i11();
		break;
		case _211:_3F=new _j11();
		break;
		default :_I3("Unsupported keyframe type");
		break;
	}
	if(_3F==null)
	{
		return -1;
	}
	else 
	{
		return _3F;
	}
}

function sequence_track_new(_Ob)
{
	if(arguments.length!=1)
	{
		_I3("sequencetrack_new() - requires a type parameter");
	}
	_Ob=yyGetInt32(_Ob);
	var _SM=null;
	switch(_Ob)
	{
		case _T01:_SM=new _k11();
		break;
		case _U01:_SM=new _l11();
		break;
		case _W01:_SM=new _m11();
		break;
		case _511:_SM=new _n11();
		break;
		case _Z01:_SM=new _o11();
		break;
		case __01:_SM=new _p11();
		break;
		case _X01:_SM=new _q11();
		break;
		case _Y01:_SM=new _r11();
		break;
		case _011:_SM=new _s11();
		break;
		case _V01:_SM=new _t11();
		break;
		case _u11:_SM=new _v11();
		break;
		case _w11:_SM=new _x11();
		break;
		case _y11:_SM=new _z11();
		break;
		case _A11:_SM=new _B11();
		break;
		case _C11:_SM=new _D11();
		break;
		case _DL:_SM=new _E11();
		break;
		default :_I3("Unsupported track type");
		break;
	}
	if(_SM==null)
	{
		return -1;
	}
	else 
	{
		return _SM;
	}
}

function sequence_get_objects(_L01)
{
	if(arguments.length!=1)
	{
		_I3("sequence_get_objects() - wrong number of arguments");
		return;
	}
	var _I01=null;
	_I01=_H01(_L01);
	if(_I01!=null)
	{
		return _I01._F11().map((id)=>_dm(_701,id));
	}
	return -1;
}

function sequence_instance_override_object(_g6,_eO,_CK)
{
	if(arguments.length!=3)
	{
		_I3("sequence_instance_override_object() - wrong number of arguments");
		return;
	}
	if((typeof(_g6)!=="object")||(_g6==null)||!(_g6 instanceof _G11))
	{
		_I3("sequence_instance_override_object() - specified sequence instance is not valid");
		return;
	}
	var _H11=_g6;
	var _I01=_KA._YN(_H11._LI);
	if(_I01!=null)
	{
		_eO=yyGetInt32(_eO);
		_CK=yyGetInt32(_CK);
		_I11.push(_I01);
		_H11._J11(_I01._CL,_eO,_CK,-1);
		_I11.pop();
	}
}

function _K11()
{
}

function _L11()
{
}

function _M11()
{
}

function _N11()
{
}

function _O11()
{
}

function _P11()
{
}

function _Q11()
{
}

function _R11()
{
}

function _S11()
{
}

function _T11()
{
}

function _U11()
{
}

function _V11()
{
}

function _W11()
{
}

function _X11()
{
}

function _Y11()
{
}

function _Z11()
{
}
(()=>
{
	let __a=(_O2,_C2)=>()=>_0b(_O2,_C2);
	compile_if_used(texture_get_texel_width,_K11=__a("fn_texture_get_texel_width",0));
	compile_if_used(texture_get_texel_height,_L11=__a("fn_texture_get_texel_height",0));
	compile_if_used(texture_set_stage,_M11=__a("fn_texture_set_stage"));
	compile_if_used(shader_is_compiled,_N11=__a("fn_shader_is_compiled",0));
	_O11=__a("fn_shader_set");
	compile_if_used(shader_get_uniform,_P11=__a("fn_shader_get_uniform",-1));
	compile_if_used(shader_set_uniform_i,_Q11=__a("fn_shader_set_uniform_i"));
	compile_if_used(shader_set_uniform_f,_R11=__a("fn_shader_set_uniform_f"));
	compile_if_used(shader_set_uniform_matrix,_S11=__a("fn_shader_set_uniform_matrix"));
	compile_if_used(shader_get_sampler_index,_T11=__a("fn_shader_get_sampler_index",-1));
	compile_if_used(shader_enable_corner_id,_U11=__a("fn_shader_enable_corner_id"));
	compile_if_used(shader_set_uniform_i_array,_V11=__a("fn_shader_set_uniform_i_array"));
	compile_if_used(shader_set_uniform_f_array,_W11=__a("fn_shader_set_uniform_f_array"));
	compile_if_used(shader_set_uniform_f_buffer,_X11=__a("fn_shader_set_uniform_f_buffer"));
	compile_if_used(shader_set_uniform_matrix_array,_Y11=__a("fn_shader_set_uniform_matrix_array"));
	compile_if_used(shader_get_name,_Z11=__a("fn_shader_get_name","<undefined>"));
}
)();
var _y9=-1;

function __11(name)
{
	for(var i=0;i<_nu.Shaders.length;i++)
	{
		if((_nu.Shaders[i]!=null)&&(_nu.Shaders[i]!=undefined)&&(_nu.Shaders[i].name===name))
		{
			return i;
		}
	}
}

function texture_get_texel_width(_s7)
{
	return _K11(_s7);
}

function texture_get_texel_height(_s7)
{
	return _L11(_s7);
}

function texture_set_stage(_021,_Ec)
{
	_M11(yyGetInt32(_021),_Ec);
}

function shaders_are_supported()
{
	return 0;
}

function shader_is_compiled(_121)
{
	return _N11(yyGetInt32(_121));
}

function shader_set(_121)
{
	_121=yyGetInt32(_121);
	_y9=_121;
	_O11(_121);
}

function shader_reset()
{
	_y9=-1;
	_O11(-1);
}

function shader_current()
{
	return _y9;
}

function shader_get_uniform(_121,_221)
{
	if(_121<0||_121>=_nu.Shaders.length)
	{
		_I3("shader_get_uniform :: Illegal shader handle");
	}
	return _P11(yyGetInt32(_121),yyGetString(_221));
}

function shader_set_uniform_i()
{
	var _cP=arguments[0];
	var _321=[].splice.call(arguments,1,arguments.length);
	_Q11(_cP,_321);
}

function shader_set_uniform_f()
{
	var _cP=arguments[0];
	var _321=[].splice.call(arguments,1,arguments.length);
	_R11(_cP,_321);
}

function _421()
{
	var _cP=arguments[0];
	var _321=[];
	_321[0]=arguments[1];
	_Q11(_cP,_321);
}

function shader_set_uniform_matrix()
{
	var _cP=arguments[0];
	_S11(_cP);
}

function shader_get_sampler_index(_121,_Ec)
{
	return _T11(yyGetInt32(_121),yyGetString(_Ec));
}

function shader_enable_corner_id(_521)
{
	_U11(yyGetBool(_521));
}

function shader_set_uniform_i_array(_621,_dj)
{
	_V11(yyGetInt32(_621),_dj);
}

function shader_set_uniform_f_array(_621,_dj)
{
	_W11(yyGetInt32(_621),_dj);
}

function shader_set_uniform_f_buffer(_621,_oj,_Fc,_Lc)
{
	_X11(yyGetInt32(_621),yyGetInt32(_oj),yyGetInt32(_Fc),yyGetInt32(_Lc));
}

function shader_set_uniform_matrix_array(_621,_dj)
{
	_Y11(yyGetInt32(_621),_dj);
}

function shader_get_name(_K2)
{
	return _Z11(_K2);
}
var _721=[];
var _821=300000;
var _921=_821;
var _a21=[];
var audio_sampledata=[];
var _b21=false;
var _c21=128;
var _d21=100000;
var _e21=[];
var _f21=[];
var _g21=0;
var _h21=200000;
var _i21=[];
var _j21=[];
var _k21=0;
var _l21=1024;
var _m21=0;
var _n21=[];
var _o21=[];
var _p21=
{
	_0d:false,_q21:undefined}
;
var _r21=
{
	_s21:0,_t21:1,_u21:2,_v21:3,_w21:4,_x21:5,_y21:6,_z21:7,_A21:8}
;
var _B21=
{
	_C21:0,_D21:1,_E21:2}
;
const _F21=
{
	_G21:0,_H21:1}
;
var _I21=
{
	_J21:'init',_K21:'loading',_L21:'loaded',_M21:'decoding',_N21:'ready'}
;
const _O21=
{
	_P21:'suspended',_Q21:'running',_R21:'closed'}
;
const _S21=
{
	_K21:"Loading",_P21:"Suspended",_Q21:"Running",_R21:"Closed",_T21:"Unknown"}
;
_S21._U21=_S21._T21;
var _V21=
{
	_W21:"Audio_Play"}
;
var _X21=0;
var _Y21=1.0;
var _Z21=0;

function __21()
{
	if(_031!=_131)return;
	_231.forEach(_KX=>_KX.gain._N4());
	audio_sampledata.forEach(_331=>
	{
		if(_331!=null)
		{
			_331.gain._N4();
		}
	}
	);
	_721.forEach(_431=>_431._531());
}
var _631;

function _731()
{
	if(_031!==_131)return;
	_831.disconnect();
	_831=_931(g_WebAudioContext);
	_831.connect(g_WebAudioContext.destination);
	g_WebAudioContext.listener._Ri=new _Up(0,0,0);
	g_WebAudioContext.listener._a31=new _Up(0,0,0);
	g_WebAudioContext.listener._b31=new Array(0,0,0,0,0,0);
}

function _c31()
{
	if(_031!==_131)return;
	const AudioContext=window.AudioContext||window.webkitAudioContext;
	g_WebAudioContext=new AudioContext();
	g_WebAudioContext.addEventListener("statechange",_d31);
	_e31=(_f31==_g31);
	_p21=_h31();
	_831=_931(g_WebAudioContext);
	_831.connect(g_WebAudioContext.destination);
	if(_p21._0d===true)
	{
		_i31();
	}
	else 
	{
		g_WebAudioContext.audioWorklet.addModule(_M7+"sound/worklets/audio-worklet.js").catch((_j31)=>
		{
			_p21._0d=true;
			_p21._q21=_j31;
		}
		).finally(()=>
		{
			_i31();
		}
		);
	}
	audio_falloff_set_model(_r21._s21);
	var _k31;
	if(typeof document.hidden!=="undefined")
	{
		_631="hidden";
		_k31="visibilitychange";
	}
	else if(typeof document.mozHidden!=="undefined")
	{
		_631="mozHidden";
		_k31="mozvisibilitychange";
	}
	else if(typeof document.msHidden!=="undefined")
	{
		_631="msHidden";
		_k31="msvisibilitychange";
	}
	else if(typeof document.webkitHidden!=="undefined")
	{
		_631="webkitHidden";
		_k31="webkitvisibilitychange";
	}
	document.addEventListener(_k31,_l31,false);
	g_WebAudioContext.listener._Ri=new _Up(0,0,0);
	g_WebAudioContext.listener._a31=new _Up(0,0,0);
	g_WebAudioContext.listener._b31=new Array(0,0,0,0,0,0);
	audio_listener_position(0,0,0);
	audio_listener_orientation(0,0,1.0,0,1.0,0.0);
	_m31();
	_n31();
	_o31();
}

function _p31()
{
	if(g_WebAudioContext==null)return;
	if(g_WebAudioContext._q31==true)return;
	g_WebAudioContext._q31=true;
	g_WebAudioContext.removeEventListener("statechange",_d31);
	g_WebAudioContext.close().then(()=>
	{
		g_WebAudioContext=null;
	}
	);
}

function _931(_r31)
{
	if(window.AudioContext!==undefined&&_r31 instanceof window.AudioContext)
	{
		return new GainNode(_r31);
	}
	else if(window.webkitAudioContext!==undefined&&_r31 instanceof window.webkitAudioContext)
	{
		return _r31.createGain();
	}
	return undefined;
}

function _h31()
{
	const _r3=
	{
		_0d:false,_q21:undefined	}
	;
	if(_rE===_s31)
	{
		_r3._0d=true;
		_r3._q21="Using Safari on iOS.";
		return _r3;
	}
	if(g_WebAudioContext.audioWorklet===undefined)
	{
		_r3._0d=true;
		_r3._q21="Audio worklets are not supported on this browser.";
		return _r3;
	}
	if(isSecureContext===false)
	{
		_r3._0d=true;
		_r3._q21="Audio worklets require a secure context.";
		return _r3;
	}
	return _r3;
}

function _t31()
{
	return(_p21._0d===true)?_u31:_v31;
}

function _w31()
{
	try
	{
		return new(_t31())();
	}
	catch(_x31)
	{
		console.error("Cannot create audio buses until audio engine is running - check audio_system_is_initialised()");
		console.log("Note: exception thrown => "+_x31);
		return null;
	}
}

function _i31()
{
	if(_p21._0d===true)
	{
		console.warn("Audio Engine: Using audio worklet fallback.\nReason => "+_p21._q21);
	}
	_y31=_w31();
	_y31._z31(_831);
	g_pBuiltIn.audio_bus_main=_y31;
	_d31();
}

function _A31()
{
	return _y31 instanceof _v31||_y31 instanceof _u31;
}
/*@constructor */
function _B31()
{
	this.buffer=null;
	this.gain=new _C31(1);
	this._D31=1.0;
	this.pitch=1.0;
	this.duration=0.0;
	this._E31=0.0;
	this.loopStart=0.0;
	this.loopEnd=0.0;
	this.groupId=0;
	this.kind=_F21._G21;
	this.state=_I21._J21;
	this._F31=[];
}
_B31.prototype._G31=
function()
{
	for(var i=0;i<this._F31.length;++i)
	{
		var _H31=this._F31[i];
		switch(_H31[0])
		{
			case _V21._W21:_H31[1].play();
			break;
		}
	}
	this._F31.length=0;
}
;
_B31.prototype._I31=
function(_J31,_K31)
{
	if(this.state!=_I21._L21||!_J31)return false;
	var _L31=this;
	_L31.state=_I21._M21;
	g_WebAudioContext.decodeAudioData(_J31.response,
function(buffer)
	{
		_L31.buffer=buffer;
		_L31.state=_I21._N21;
		if(_K31)_L31._G31();
	}
	,
function(err)
	{
		_L31.state=_I21._L21;
		debug("ERROR: Failed to decode audio data: "+err);
	}
	);
	return true;
}
;
/*@constructor */
function _M31(_N31)
{
	this._O31=_931(g_WebAudioContext);
	this._P31=null;
	this._cP=0;
	this._FJ(_N31);
}
_M31.prototype._FJ=
function(_N31)
{
	this._Q31=false;
	this._R31=
	{
		_S31:0.0,_T31:0.0	}
	;
	this._U31=null;
	this._O31.disconnect();
	this.gain=new _C31(_N31.gain);
	this._V31=_N31.offset;
	this.pitch=_N31.pitch;
	this._P31=_N31.emitter;
	this.paused=false;
	this._W31=_N31.asset_index;
	this.loop=_N31.loop;
	this.loopStart=_N31.loopStart;
	this.loopEnd=_N31.loopEnd;
	this._X31=false;
	this.priority=_N31.priority;
	this._Y31=false;
	this._Z31=false;
	this.__31=false;
	this._O31.gain.value=_041._141(this);
	if(this._W31>=0)
	{
		this._Y31=_241(this._W31);
		this._Z31=_341(this._W31);
		this.__31=_441(this._W31);
		if(this.__31===false)
		{
			if(this._cP>=_821)
			{
				_n21[this._cP-_821]=null;
			}
			this._cP=_921;
			_n21[_921-_821]=this;
			++_921;
		}
	}
}
;
_M31.prototype.start=
function(_oj)
{
	const _541=_041._641(this);
	const _741=(this.loopEnd>0.0)?this.loopEnd:_oj.duration;
	const _841=(this.loop===true)&&(_541<_741);
	const options=
	{
		buffer:_oj,loop:_841,loopStart:this.loopStart,loopEnd:this.loopEnd,playbackRate:_041._941(this)	}
	;
	if(typeof AudioBufferSourceNode!=="undefined")
	{
		this._U31=new AudioBufferSourceNode(g_WebAudioContext,options);
	}
	else 
	{
		this._U31=g_WebAudioContext.createBufferSource();
		for(const _ij in options)
		{
			this._U31[_ij]=options[_ij];
		}
	}
	this._U31.onended=(_f2)=>
	{
		this._Q31=false;
		this._U31=null;
		if(this._O31!==null)this._O31.disconnect();
		this._P31=null;
		this._a41(false);
	}
	;
	this._U31.connect(this._O31);
	this._R31=
	{
		_S31:g_WebAudioContext.currentTime,_T31:_541	}
	;
	this._U31.start(0,_541);
	if(this.paused===true)this.pause();
}
;
_M31.prototype.play=
function()
{
	if(g_WebAudioContext===null)return;
	this._Q31=true;
	const _b41=_c41(this._W31);
	if(_b41.state!==_I21._N21)
	{
		const _d41=_LA._F4(this._W31);
		if(_b41.state==_I21._L21&&!this._Y31&&_d41)
		{
			const _e41=_f41[_d41.pName];
			if(_e41)_b41._I31(_e41,true);
		}
		_b41._F31.push([_V21._W21,this]);
		return;
	}
	if(this._Y31)
	{
		this._V31=_041._641(this);
		const _g41=_h41(this._W31);
		const _i41=new XMLHttpRequest();
		_i41.open("GET",_g41,true);
		_i41.responseType="arraybuffer";
		_i41.onload=()=>
		{
			const _j41=_i41.response;
			g_WebAudioContext.decodeAudioData(_j41).then((_oj)=>
			{
				this.start(_oj);
			}
			);
		}
		;
		_i41.send();
	}
	else 
	{
		if(this.__31)
		{
			const _k41=this._W31-_h21;
			const _l41=_i21[_k41];
			_l41.gainnode=this._O31;
			_l41._m41.connect(this._O31);
			_l41._m41.onended=(_f2)=>
			{
				this._Q31=false;
			}
			;
			this._R31._S31=g_WebAudioContext.currentTime;
		}
		else 
		{
			this.start(_b41.buffer);
		}
	}
}
;
_M31.prototype.stop=
function()
{
	if(this._Q31===false)return;
	if(this._W31>=_h21&&this._W31<(_h21+_k21))
	{
		var _n41=this._W31-_h21;
		_i21[_n41]._m41.onended=null;
		_i21[_n41]._m41.disconnect();
	}
	else if(this._U31!==null)
	{
		this._U31.onended=null;
		this._U31.loop=false;
		this._U31.stop(0);
		this._U31.disconnect();
	}
	if(this._O31!==null)this._O31.disconnect();
	this._P31=null;
	this._Q31=false;
	this._a41(true);
}
;
_M31.prototype.pause=
function()
{
	if(this._Q31===false)return;
	if(this.__31)
	{
		const _n41=this._W31-_h21;
		_i21[_n41]._m41.onended=null;
		_i21[_n41]._m41.disconnect(0);
	}
	else if(this._U31!==null)
	{
		this._U31.onended=null;
		this._U31.stop(0);
		this._U31.disconnect();
		this._o41();
	}
	this.paused=true;
}
;
_M31.prototype.resume=
function()
{
	if(this._Q31===false||this.paused===false)return;
	this.paused=false;
	if(this._W31>=_h21&&this._W31<(_h21+_k21))
	{
		const _n41=this._W31-_h21;
		_i21[_n41]._m41.connect(this._O31);
		_i21[_n41]._m41.onended=(_f2)=>
		{
			this._Q31=false;
		}
		;
	}
	else 
	{
		this._V31=this._R31._T31;
		if(this._U31===null)
		{
			return;
		}
		this.start(this._U31.buffer);
	}
}
;
_M31.prototype._p41=
function()
{
	if(this._Q31===false)return false;
	if(this.__31)
	{
		var _q41=_i21[this._W31-_h21];
		if(!_q41||!_q41._m41||!_q41._m41.onended)return false;
		return true;
	}
	else 
	{
		if(this._U31===null)return true;
		if(this._U31.playbackState==undefined||this._U31.playbackState!=this._U31.FINISHED_STATE||this.paused)
		{
			return true;
		}
	}
	return false;
}
;
_M31.prototype._r41=
function()
{
	if(this._Q31===false)return false;
	return(this.paused===true);
}
;
_M31.prototype._s41=
function(_t41)
{
	if(this._Q31===false)return;
	this._o41();
	this.loop=_t41;
	if(this._U31===null)return;
	const _u41=this._R31._T31;
	this._U31.loop=(this.loop===true)&&(_u41<this._v41());
}
;
_M31.prototype._w41=
function()
{
	if(this._Q31===false)return false;
	return(this.loop===true);
}
;
_M31.prototype._x41=
function(_y41)
{
	if(this._Q31===false||g_WebAudioContext===null)return;
	const _z41=1.0/g_WebAudioContext.sampleRate;
	const _741=this._v41();
	const _A41=_741-_z41;
	_y41=Math.max(0.0,_y41);
	_y41=Math.min(_y41,_A41);
	this._o41();
	this.loopStart=_y41;
	if(this._U31===null)return;
	this._U31.loopStart=_y41;
}
;
_M31.prototype._B41=
function(_y41)
{
	if(this._Q31===false||g_WebAudioContext===null)return;
	const _z41=1.0/g_WebAudioContext.sampleRate;
	const duration=this._U31.buffer.duration;
	const loopStart=this._U31.loopStart;
	const _C41=(_y41<=0.0)?0.0:(loopStart+_z41);
	_y41=Math.max(_C41,_y41);
	_y41=Math.min(_y41,duration);
	this._o41();
	this.loopEnd=_y41;
	if(this._U31===null)return;
	const _u41=this._R31._T31;
	const _741=(_y41>0.0)?_y41:duration;
	this._U31.loop=(this.loop===true)&&(_u41<_741);
	this._U31.loopEnd=_y41;
}
;
_M31.prototype._D41=
function()
{
	if(this._Q31===false)return 0.0;
	return this.loopStart;
}
;
_M31.prototype._E41=
function()
{
	if(this._Q31===false)return 0.0;
	return this.loopEnd;
}
;
_M31.prototype._v41=
function()
{
	if(this._Q31===false)return 0.0;
	if(this.loopEnd<=0.0)return audio_sound_length(this._W31);
	return this.loopEnd;
}
;
_M31.prototype._F41=
function()
{
	if(this._Q31===false)return 0.0;
	const loopStart=this.loopStart;
	const _741=this._v41();
	return(_741-loopStart);
}
;
_M31.prototype._o41=
function()
{
	if(g_WebAudioContext===null)return;
	const _S31=g_WebAudioContext.currentTime;
	this._R31=
	{
		_S31:_S31,_T31:this._G41(_S31)	}
	;
}
;
_M31.prototype._G41=
function(_H41)
{
	if(this._Q31===false||g_WebAudioContext===null)return 0.0;
	if(this._U31===null)return _041._641(this);
	const _I41=this._R31;
	if(this.paused===true)return _I41._T31;
	const pitch=this._U31.playbackRate.value;
	if(_H41===undefined)_H41=g_WebAudioContext.currentTime;
	const _J41=(_H41-_I41._S31)*pitch;
	const _741=this._v41();
	const _K41=(_I41._T31>_741);
	const _L41=this._U31.loop;
	let _u41=_I41._T31;
	if(_L41===false||_K41===true)
	{
		_u41+=_J41;
	}
	else 
	{
		const loopStart=this._D41();
		const _M41=loopStart-_I41._T31;
		if(_J41<_M41)
		{
			_u41+=_J41;
		}
		else 
		{
			const _N41=this._F41();
			_u41=loopStart+(_J41-_M41)%_N41;
		}
	}
	return _u41;
}
;
_M31.prototype._O41=
function(_Fc)
{
	if(this._Q31===false)return;
	const duration=audio_sound_length(this._W31);
	_Fc=Math.max(0.0,_Fc);
	_Fc=Math.min(_Fc,duration);
	if(this.paused===true)
	{
		this._R31._T31=_Fc;
	}
	else 
	{
		this._V31=_Fc;
		if(this._U31===null)return;
		this._U31.onended=null;
		this._U31.stop();
		this._U31.disconnect();
		this.start(this._U31.buffer);
	}
}
;
_M31.prototype._P41=
function(_Q41,_R41=0)
{
	if(this._Q31===false||this._O31===null)return;
	this.gain.set(_Q41,_R41);
	if(_R41===0)this._531();
}
;
_M31.prototype._531=
function()
{
	if(this._Q31===false||this._O31===null)return;
	this.gain._N4();
	this._O31.gain.value=_041._141(this);
}
;
_M31.prototype._S41=
function(_T41)
{
	if(this._Q31===false)return;
	this._o41();
	this.pitch=_T41;
	this._U41();
}
;
_M31.prototype._U41=
function()
{
	if(this._Q31===false||this._U31===null)return;
	this._o41();
	this._U31.playbackRate.value=_041._941(this);
}
;
_M31.prototype._V41=
function()
{
	if(this._Q31===false)return null;
	return _c41(this._W31);
}
;
_M31.prototype._W41=
function()
{
	if(this._Q31===false)return -1;
	return this._W31;
}
;
_M31.prototype._a41=
function(_X41)
{
	const _Y41=_be._ce(undefined,undefined,_Z41,undefined);
	_Y41.__41=this._cP;
	_Y41._051=this._W31;
	_Y41._151=_X41;
	_Y41._ge=true;
}
;

function _251(_C2,_351,_451,_551,_BT)
{
	let _651=_C2;
	if(isNaN(_651)===true)_651=0.0;
	if(isNaN(_351)===false)_651=Math.max(_351,_651);
	if(isNaN(_451)===false)_651=Math.min(_651,_451);
	if(_651!==_C2)console.warn(_551+": argument '"+_BT+"' was clamped ("+_C2+" => "+_651+").");
	return _651;
}

function _751(_621)
{
	if(_621<_821||_621>=_921)
	{
		debug("Error: invalid sound handle "+_621);
		return null;
	}
	var sound=_n21[_621-_821];
	if(sound==undefined)
	{
		return null;
	}
	return sound;
}

function _241(_W31)
{
	if(_e31)return false;
	if(_W31>=0&&_W31<audio_sampledata.length)
	{
		if(audio_sampledata[_W31].kind==_F21._H21)
		{
			return true;
		}
	}
	else if(_W31<_d21)
	{
		debug("IsSoundStreamed - Error: soundid "+_W31+" not found");
	}
	return false;
}

function _341(_W31)
{
	if(_W31>=_d21&&_W31<_h21)
	{
		return true;
	}
	return false;
}

function _441(_W31)
{
	if(_W31>=_h21&&_W31<_821)
	{
		return true;
	}
	return false;
}

function _h41(_851)
{
	var sound=_nu.Sounds[_851];
	if(sound==null)
	{
		_xf="";
		sound=audio_sampledata[_851];
		if(sound!=null&&sound._951!==undefined)
		{
			_xf=_a51(sound._951);
		}
		return _xf;
	}
	var _xf=_M7+sound.origName;
	var _b51=sound.extension;
	_xf=_a51(_xf);
	var index=_xf.indexOf(_b51);
	if(index>0)
	{
		_xf=_xf.substr(0,index);
	}
	if(_c51)
	{
		_b51="ogg";
	}
	else if(_d51)
	{
		_b51="mp3";
	}
	else 
	{
		_b51="ogg";
	}
	_xf=_xf+"."+_b51;
	return _xf;
}
var _e51=false;
var _e31=false;

function _f51()
{
	return g_WebAudioContext!=null;
}

function _g51()
{
	_h51=_i51();
	return _j51(_h51)===true;
}

function _j51(_k51)
{
	return _k51===_S21._Q21;
}

function _i51()
{
	if(_A31()===false)return _S21._K21;
	if(_f51()===false||g_WebAudioContext.state===_O21._R21)return _S21._R21;
	if(g_WebAudioContext.state===_O21._P21)return _S21._P21;
	if(g_WebAudioContext.state===_O21._Q21)return _S21._Q21;
	return _S21._T21;
}

function _o31()
{
	if(_e51)return;
	_e51=true;
	var _l51="mousedown";
	var _m51="mouseup";
	if("ontouchstart" in window)
	{
		_l51="touchstart";
		_m51="touchend";
	}
	if((window.PointerEvent)||(window.navigator.pointerEnabled)||(window.navigator.msPointerEnabled))
	{
		_l51="pointerdown";
		_m51="pointerup";
	}
	var _n51=
function()
	{
		g_WebAudioContext.resume().then(
function()
		{
			document.body.removeEventListener(_l51,_n51);
			document.body.removeEventListener(_m51,_n51);
			_e51=false;
		}
		,
function(_q21)
		{
			debug("ERROR: Failed to unlock WebAudio Context. Reason: "+_q21);
		}
		);
	}
	;
	document.body.addEventListener(_l51,_n51,false);
	document.body.addEventListener(_m51,_n51,false);
}

function _d31()
{
	const _h51=_i51();
	if(_h51!==_S21._U21)
	{
		debug("Audio Engine => "+_h51);
		_S21._U21=_h51;
	}
	const _o51=_j51(_h51);
	const map=ds_map_create();
	g_pBuiltIn.async_load=map;
	ds_map_add(map,"event_type","audio_system_status");
	ds_map_add(map,"status",_o51?"available":"unavailable");
	_j2._k2(_p51,0);
	ds_map_destroy(map);
	g_pBuiltIn.async_load=-1;
}

function audio_system_is_available()
{
	return _g51()===true;
}

function audio_system_is_initialised()
{
	return _A31()===true;
}

function audio_sound_is_playable(_q51)
{
	_q51=yyGetInt32(_q51);
	var _L31=_c41(_q51);
	if(_L31==null)return false;
	if(!audio_system_is_available())return false;
	var _d41=_LA._F4(_q51);
	if(_L31.state==_I21._L21&&_d41)
	{
		var _e41=_f41[_d41.pName];
		if(_e41)_L31._I31(_e41,true);
	}
	return(_L31.state==_I21._N21);
}

function _r51(_N31)
{
	if(_031!=_131)return null;
	var i;
	var sound;
	for(i=0;i<_m21;++i)
	{
		sound=_721[i];
		if(!sound._Q31)
		{
			sound._FJ(_N31);
			return sound;
		}
		else 
		{
			if(sound.__31&&sound._W31==_N31.asset_index)return null;
			const _s51=((sound._U31!=null&&sound._U31.playbackState!=undefined&&sound._U31.playbackState==sound._U31.FINISHED_STATE)&&!sound.paused);
			if(_s51===true)
			{
				sound._FJ(_N31);
				return sound;
			}
		}
	}
	if(_m21<_c21)
	{
		var _t51=new _M31(_N31);
		_721[_m21]=_t51;
		++_m21;
		return _t51;
	}
	var _u51=_N31.priority;
	var _v51=-1;
	for(i=0;i<_m21;++i)
	{
		sound=_721[i];
		if(sound.priority<_u51)
		{
			_v51=i;
			_u51=sound.priority;
		}
	}
	if(_v51>=0)
	{
		debug("killing sound on channel "+_v51);
		var _w51=_721[_v51];
		_w51.stop();
		_w51._FJ(_N31);
		return _w51;
	}
	debug("reached max sounds and no lower priority");
	return null;
}

function _c41(_W31)
{
	if(_W31>=0&&_W31<audio_sampledata.length)
	{
		return audio_sampledata[_W31];
	}
	const _x51=_W31-_d21;
	if(_x51>=0&&_x51<_g21)
	{
		return _f21[_x51];
	}
	const _n41=_W31-_h21;
	if(_n41>=0&&_n41<_k21)
	{
		return _j21[_n41];
	}
	return null;
}

function _y51(_z51)
{
	const _A51=audio_emitter_exists(_z51);
	if(_A51===false)
	{
		_I3("Emitter with index "+_z51+" does not exist!");
		return undefined;
	}
	return _a21[_z51];
}

function _B51(_N31)
{
	if(_N31._C51())return -1;
	const _D51=_r51(_N31);
	if(_D51===null)return -1;
	switch(_N31.type)
	{
		case _E51._F51:_y31._G51(_D51._O31);
		break;
		case _E51._H51:const _Ri=_N31.position;
		_N31.emitter=new _I51();
		_N31.emitter.setPosition(_Ri.x,_Ri.y,_Ri.z);
		_N31.emitter._J51(_Ri.falloff_ref,_Ri.falloff_max,_Ri.falloff_factor);
		case _E51._K51:_D51._P31=_N31.emitter;
		_D51._O31.connect(_D51._P31._L51());
		break;
		default :debug("Warning: Unknown audio playback type => "+_N31.type);
		return -1;
	}
	_D51.play();
	return _D51._cP;
}

function audio_play_sound(_M51,_N51,_P2,_Q41,_Fc,_T41)
{
	const _0j=new _O51(
	{
		sound:_M51,priority:_N51,loop:_P2,gain:_Q41,offset:_Fc,pitch:_T41	}
	);
	return _B51(_0j);
}

function audio_play_sound_on(_P51,_M51,_P2,_N51,_Q41,_Fc,_T41)
{
	const _0j=new _O51(
	{
		emitter:_P51,sound:_M51,loop:_P2,priority:_N51,gain:_Q41,offset:_Fc,pitch:_T41	}
	);
	return _B51(_0j);
}

function audio_play_sound_at(_M51,_r4,_s4,_Qq,_Q51,_R51,_S51,_P2,_N51,_Q41,_Fc,_T41)
{
	const _0j=new _O51(
	{
		sound:_M51,position:
		{
			x:_r4,y:_s4,z:_Qq,falloff_ref:_Q51,falloff_max:_R51,falloff_factor:_S51		}
		,loop:_P2,priority:_N51,gain:_Q41,offset:_Fc,pitch:_T41	}
	);
	return _B51(_0j);
}

function audio_play_sound_ext(_Pl)
{
	if(typeof _Pl!=="object")_I3("Error: audio_play_sound_ext => argument must be a struct");
	const _0j=new _O51(_Pl);
	return _B51(_0j);
}

function audio_stop_sound(_851)
{
	if(_031!==_131)return;
	_851=yyGetInt32(_851);
	if(_851>=_821)
	{
		const _D51=_751(_851);
		if(_D51===null)return;
		if(_D51.__31)
		{
			_n21[_D51._cP-_821]=undefined;
		}
		_D51.stop();
	}
	else 
	{
		_721.filter(_431=>_431._W31===_851).forEach(_431=>_431.stop());
	}
}

function audio_pause_sound(_851)
{
	if(_031!==_131)return;
	_851=yyGetInt32(_851);
	if(_851>=_821)
	{
		const _D51=_751(_851);
		if(_D51===null)return;
		_D51.pause();
	}
	else 
	{
		_721.filter(_431=>_431._W31===_851).forEach(_431=>_431.pause());
	}
}

function audio_resume_sound(_851)
{
	if(_031!==_131)return;
	_851=yyGetInt32(_851);
	if(_851>=_821)
	{
		const _D51=_751(_851);
		if(_D51===null)return;
		_D51.resume();
	}
	else 
	{
		_721.filter(_431=>_431._W31===_851).forEach(_431=>_431.resume());
	}
}

function audio_play_music(_851,_T51)
{
	debug("audio_play_music :: deprecated function\n");
}

function audio_stop_music()
{
	debug("audio_stop_music :: deprecated function");
}

function audio_pause_music()
{
	debug("audio_pause_music :: deprecated function");
}

function audio_resume_music()
{
	debug("audio_resume_music :: deprecated function");
}

function audio_music_is_playing()
{
	debug("audio_music_is_playing :: deprecated function");
	return 0;
}

function audio_exists(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	var _U51=_c41(_Qe);
	if(_U51!=null)return true;
	var sound=_n21[_Qe-_821];
	if(sound&&sound._Q31)return true;
	return false;
}

function audio_sound_get_pitch(_851)
{
	if(_031==_131)
	{
		_851=yyGetInt32(_851);
		if(_851>=_821)
		{
			const _D51=_751(_851);
			if(_D51!=null&&_D51._Q31)
			{
				return _D51.pitch;
			}
		}
		else 
		{
			const _V51=_c41(_851);
			if(_V51!=null&&_441(_851)==false)
			{
				return _V51.pitch;
			}
		}
	}
	return 1.0;
}

function audio_sound_pitch(_851,_T41)
{
	_851=yyGetInt32(_851);
	_T41=yyGetReal(_T41);
	if(_851<0)return;
	if(_031!=_131)return;
	if(_851>=_821)
	{
		const _D51=_751(_851);
		if(_D51===null)return;
		_D51._S41(_T41);
	}
	else 
	{
		const _V51=_c41(_851);
		if(_V51==null||_441(_851))return;
		_V51.pitch=_T41;
		_721.filter(_431=>_431._W31===_851).forEach(_431=>_431._U41());
	}
}

function audio_sound_get_gain(_K2)
{
	if(_031!=_131)return;
	_K2=yyGetInt32(_K2);
	if(_K2>=_821)
	{
		const _D51=_751(_K2);
		if(_D51!=null&&_D51._Q31)return _D51.gain.get();
	}
	else 
	{
		const _b41=_c41(_K2);
		if(_b41!==null)
		{
			return _b41.gain.get();
		}
	}
	return 0;
}

function audio_sound_gain(_K2,_Q41,_W51)
{
	_K2=yyGetInt32(_K2);
	_Q41=yyGetReal(_Q41);
	_Q41=_251(_Q41,0.0,undefined,"audio_sound_gain","gain");
	_W51=yyGetInt32(_W51);
	_W51=_251(_W51,0,undefined,"audio_sound_gain","timeMs");
	if(_K2>=_821)
	{
		const _D51=_751(_K2);
		if(_D51===null)return;
		_D51._P41(_Q41,_W51);
	}
	else 
	{
		const _b41=_c41(_K2);
		if(_b41===null)return;
		_b41.gain.set(_Q41,_W51);
		if(_W51>0.0)return;
		_721.filter(_431=>_431._W31===_K2).forEach(_431=>_431._531());
	}
}

function audio_music_gain(_X51,time)
{
	debug("audio_music_gain :: deprecated function\n");
}

function _l31()
{
	if(g_WebAudioContext)
	{
		(document.visibilityState==='visible')?g_WebAudioContext.resume():g_WebAudioContext.suspend();
	}
	if(_031==_131)
	{
		if(document[_631]==true)
		{
			if(!_b21)
			{
				_b21=true;
				_Y51(true);
			}
		}
		else if(document[_631]==false)
		{
			if(_b21)
			{
				_Z51(true);
				_b21=false;
			}
		}
	}
}

function audio_sound_length(_851)
{
	if(_031!==_131)return -1.0;
	_851=yyGetInt32(_851);
	let _051=-1;
	if(_851<_821)
	{
		if(_c41(_851)!==null)_051=_851;
	}
	else 
	{
		const _D51=_751(_851);
		if(_D51!==null)_051=_D51._W31;
	}
	if(_051!==-1)
	{
		if(_241(_051))return audio_sampledata[_051].duration;
		else if(_341(_051))return _f21[_051-_d21].buffer.duration;
		else if(_441(_051))return 0.0;
		else return audio_sampledata[_051].buffer.duration;
	}
	return -1.0;
}

function audio_sound_get_track_position(_851)
{
	if(_031!=_131)return 0;
	_851=yyGetInt32(_851);
	if(_851>=_821)
	{
		const _D51=_751(_851);
		if(_D51!=null)
		{
			return _D51._G41();
		}
	}
	else if(_851>=0)
	{
		const _V51=_c41(_851);
		if(_V51!==null)
		{
			return _V51._E31;
		}
	}
	return 0.0;
}

function audio_sound_set_track_position(_851,_a5)
{
	if(_031!=_131)return;
	_851=yyGetInt32(_851);
	_a5=yyGetReal(_a5);
	if(_851>=_821)
	{
		const _D51=_751(_851);
		if(_D51===null)return;
		_D51._O41(_a5);
	}
	else if(_851>=0)
	{
		_a5=_I5(_a5,0);
		const duration=audio_sound_length(_851);
		if(_a5<duration)
		{
			const _L31=_c41(_851);
			if(_L31!==null)
			{
				_L31._E31=_a5;
			}
		}
	}
}

function audio_sound_loop(__51,_t41)
{
	__51=yyGetInt32(__51);
	_t41=yyGetBool(_t41);
	const _D51=_751(__51);
	if(_D51===null)return;
	_D51._s41(_t41);
}

function audio_sound_get_loop(__51)
{
	__51=yyGetInt32(__51);
	const _D51=_751(__51);
	if(_D51===null)return false;
	return _D51._w41();
}

function audio_sound_loop_start(_K2,_y41)
{
	_K2=yyGetInt32(_K2);
	_y41=yyGetReal(_y41);
	const _061=audio_sound_length(_K2);
	if(_061===-1)
	{
		debug("audio_sound_loop_start() - could not determine length of asset");
		return;
	}
	_y41=clamp(_y41,0,_061);
	if(_K2>=_821)
	{
		const _D51=_751(_K2);
		if(_D51!==null)_D51._x41(_y41);
	}
	else 
	{
		const _b41=_c41(_K2);
		if(_b41===null)
		{
			debug("audio_sound_loop_start() - no asset found with index "+_K2);
			return;
		}
		_b41.loopStart=_y41;
		_721.filter(_431=>_431._W31===_K2).forEach(_431=>_431._x41(_y41));
	}
}

function audio_sound_get_loop_start(_K2)
{
	_K2=yyGetInt32(_K2);
	if(_K2>=_821)
	{
		const _D51=_751(_K2);
		if(_D51===null)return 0.0;
		return _D51._D41();
	}
	else 
	{
		const _b41=_c41(_K2);
		if(_b41===null)
		{
			debug("audio_sound_get_loop_start() - no asset found with index "+_K2);
			return 0.0;
		}
		return _b41.loopStart;
	}
}

function audio_sound_loop_end(_K2,_y41)
{
	_K2=yyGetInt32(_K2);
	_y41=yyGetReal(_y41);
	const _061=audio_sound_length(_K2);
	if(_061===-1)
	{
		debug("audio_sound_loop_end() - could not determine length of asset");
		return;
	}
	_y41=clamp(_y41,0,_061);
	if(_K2>=_821)
	{
		const _D51=_751(_K2);
		if(_D51!==null)_D51._B41(_y41);
	}
	else 
	{
		const _b41=_c41(_K2);
		if(_b41===null)
		{
			debug("audio_sound_loop_end() - no asset found with index "+_K2);
			return;
		}
		_b41.loopEnd=_y41;
		_721.filter(_431=>_431._W31===_K2).forEach(_431=>_431._B41(_y41));
	}
}

function audio_sound_get_loop_end(_K2)
{
	_K2=yyGetInt32(_K2);
	if(_K2>=_821)
	{
		const _D51=_751(_K2);
		if(_D51===null)return 0.0;
		return _D51._E41();
	}
	else 
	{
		const _b41=_c41(_K2);
		if(_b41===null)
		{
			debug("audio_sound_get_loop_end() - no asset found with index "+_K2);
			return 0.0;
		}
		return _b41.loopEnd;
	}
}

function audio_system()
{
	if(_031==_131)return 1;
	else return 0;
}

function audio_emitter_exists(_z51)
{
	if(_z51===undefined)return false;
	_z51=yyGetInt32(_z51);
	const emitter=_a21[_z51];
	return emitter instanceof _I51&&emitter._161()===true;
}

function audio_get_type(_851)
{
	if(_031!=_131)return -1;
	if(_241(yyGetInt32(_851)))
	{
		return 1;
	}
	return 0;
}

function audio_get_name(_K2)
{
	if(_031==_131)
	{
		_K2=yyGetInt32(_K2);
		var _261=-1;
		if(_K2>=_821)
		{
			var sound=_751(_K2);
			if(sound!=null)
			{
				_261=sound._W31;
			}
		}
		else 
		{
			_261=_K2;
		}
		if(_261>=0&&_261<_nu.Sounds.length)
		{
			var name=_nu.Sounds[_261].pName;
			return name;
		}
	}
	return "<undefined>";
}
var _361;
var _461;

function audio_falloff_set_model(_561)
{
	if(_031!=_131)
	{
		return;
	}
	_561=yyGetInt32(_561);
	if(_561==_461)return;
	var _661=g_WebAudioContext.createPanner();
	switch(_561)
	{
		case _r21._s21:_361=_661.INVERSE_DISTANCE;
		if(_361==undefined)_361="inverse";
		break;
		case _r21._t21:_361=_661.INVERSE_DISTANCE;
		if(_361==undefined)_361="inverse";
		break;
		case _r21._u21:console.warn("audio_falloff_inverse_distance_clamped is not supported in html5\n");
		console.log("Note: Falloff will mimic audio_falloff_inverse_distance");
		_361=_661.INVERSE_DISTANCE;
		if(_361==undefined)_361="inverse";
		break;
		case _r21._v21:_361=_661.LINEAR_DISTANCE;
		if(_361==undefined)_361="linear";
		break;
		case _r21._w21:console.warn("audio_falloff_linear_distance_clamped is not supported in html5\n");
		console.log("Note: Falloff will mimic audio_falloff_linear_distance");
		_361=_661.LINEAR_DISTANCE;
		if(_361==undefined)_361="linear";
		break;
		case _r21._x21:_361=_661.EXPONENTIAL_DISTANCE;
		if(_361==undefined)_361="exponential";
		break;
		case _r21._y21:console.warn("audio_falloff_exponent_distance_clamped is not supported in html5\n");
		console.log("Note: Falloff will mimic audio_falloff_exponent_distance");
		_361=_661.EXPONENTIAL_DISTANCE;
		if(_361==undefined)_361="exponential";
		break;
		case _r21._z21:console.warn("audio_falloff_inverse_distance_scaled is not supported in html5\n");
		console.log("Note: Falloff will mimic audio_falloff_inverse_distance");
		_361=_661.INVERSE_DISTANCE;
		if(_361==undefined)_361="inverse";
		break;
		case _r21._A21:console.warn("audio_falloff_exponent_distance_scaled is not supported in html5\n");
		console.log("Note: Falloff will mimic audio_falloff_exponent_distance");
		_361=_661.EXPONENTIAL_DISTANCE;
		if(_361==undefined)_361="exponential";
		break;
		default :console.warn("Ignored attempt to set audio falloff to unknown model\n");
		return;
	}
	_461=_561;
	_a21.filter(_761=>_761._161()===true).forEach(_761=>
	{
		_761._861.distanceModel=_361;
		if(_461==_r21._s21)
		{
			_761._961=_761._861.rolloffFactor;
			_761._861.rolloffFactor=0;
		}
		else if(_761._961!==undefined)
		{
			_761._861.rolloffFactor=_761._961;
			_761._961=undefined;
		}
	}
	);
}

function _Y51(_a61)
{
	for(var i=0;i<_m21;++i)
	{
		var sound=_721[i];
		if(sound._Q31)
		{
			if(!sound.paused)
			{
				sound.pause();
				if(_a61)sound._X31=true;
			}
		}
	}
}

function audio_stop_all()
{
	_721.forEach(_431=>_431.stop());
}

function _b61(_c61)
{
	_721.filter(_431=>audio_sampledata[_431._W31].groupId===_c61).forEach(_431=>_431.stop());
}

function audio_pause_all()
{
	_Y51(false);
}

function audio_resume_all()
{
	_Z51(false);
}

function _Z51(_a61)
{
	for(var i=0;i<_m21;++i)
	{
		var sound=_721[i];
		if(sound._Q31)
		{
			if(sound.paused)
			{
				if(_a61)
				{
					if(sound._X31)
					{
						sound.resume();
						sound._X31=false;
					}
				}
				else 
				{
					sound.resume();
				}
			}
		}
	}
}

function audio_is_paused(_851)
{
	if(_031!==_131)return false;
	_851=yyGetInt32(_851);
	if(_851>=_821)
	{
		const _D51=_751(_851);
		if(_D51===null)return false;
		return _D51._r41();
	}
	return _721.filter(_431=>_431._W31===_851).some(_431=>_431._r41());
}

function audio_is_playing(_851)
{
	if(_031!==_131)return false;
	_851=yyGetInt32(_851);
	if(_851>=_821)
	{
		const _D51=_751(_851);
		if(_D51===null)return false;
		return _D51._p41();
	}
	return _721.filter(_431=>_431._W31===_851).some(_431=>_431._p41());
}

function audio_listener_position(_d61,_e61,_f61)
{
	if(_031==_131)
	{
		_d61=yyGetReal(_d61);
		_e61=yyGetReal(_e61);
		_f61=yyGetReal(_f61);
		var _g61=g_WebAudioContext.listener;
		_g61.setPosition(_d61,_e61,_f61);
		if(_g61._Ri)
		{
			_g61._Ri._5q=_d61;
			_g61._Ri._6q=_e61;
			_g61._Ri._7q=_f61;
		}
		else 
		{
			_g61._Ri=new _Up(_d61,_e61,_f61);
		}
	}
}

function audio_listener_velocity(_d61,_e61,_f61)
{
	if(_031==_131)
	{
		_d61=yyGetReal(_d61);
		_e61=yyGetReal(_e61);
		_f61=yyGetReal(_f61);
		var _g61=g_WebAudioContext.listener;
		if(_g61._a31)
		{
			_g61._a31._5q=_d61;
			_g61._a31._6q=_e61;
			_g61._a31._7q=_f61;
		}
		else 
		{
			_g61._a31=new _Up(_d61,_e61,_f61);
		}
	}
}

function audio_listener_orientation(_d61,_e61,_f61,_h61,_i61,_j61)
{
	if(_031==_131)
	{
		_d61=yyGetReal(_d61);
		_e61=yyGetReal(_e61);
		_f61=yyGetReal(_f61);
		_h61=yyGetReal(_h61);
		_i61=yyGetReal(_i61);
		_j61=yyGetReal(_j61);
		var _g61=g_WebAudioContext.listener;
		_g61.setOrientation(_d61,_e61,_f61,_h61,_i61,_j61);
		if(_g61._b31)
		{
			_g61._b31[0]=_d61;
			_g61._b31[1]=_e61;
			_g61._b31[2]=_f61;
			_g61._b31[3]=_h61;
			_g61._b31[4]=_i61;
			_g61._b31[5]=_j61;
		}
		else 
		{
			_g61._b31=new Array(_d61,_e61,_f61,_h61,_i61,_j61);
		}
	}
}

function audio_listener_set_position(_k61,_r4,_s4,_Qq)
{
	if(yyGetInt32(_k61)==0)
	{
		audio_listener_position(yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_Qq));
	}
}

function audio_listener_set_velocity(_k61,_l61,_m61,_n61)
{
	if(yyGetInt32(_k61)==0)
	{
		audio_listener_velocity(yyGetReal(_l61),yyGetReal(_m61),yyGetReal(_n61));
	}
}

function audio_listener_set_orientation(_k61,_o61,_p61,_q61,_r61,_s61,_t61)
{
	if(yyGetInt32(_k61)==0)
	{
		audio_listener_orientation(yyGetReal(_o61),yyGetReal(_p61),yyGetReal(_q61),yyGetReal(_r61),yyGetReal(_s61),yyGetReal(_t61));
	}
}

function audio_listener_get_data(_k61)
{
	if(yyGetInt32(_k61)==0)
	{
		var _g61=g_WebAudioContext.listener;
		var map=ds_map_create();
		ds_map_add(map,"x",_g61._Ri._5q);
		ds_map_add(map,"y",_g61._Ri._6q);
		ds_map_add(map,"z",_g61._Ri._7q);
		ds_map_add(map,"vx",_g61._a31._5q);
		ds_map_add(map,"vy",_g61._a31._6q);
		ds_map_add(map,"vz",_g61._a31._7q);
		ds_map_add(map,"lookat_x",_g61._b31[0]);
		ds_map_add(map,"lookat_y",_g61._b31[1]);
		ds_map_add(map,"lookat_z",_g61._b31[2]);
		ds_map_add(map,"up_x",_g61._b31[3]);
		ds_map_add(map,"up_y",_g61._b31[4]);
		ds_map_add(map,"up_z",_g61._b31[5]);
		return map;
	}
	return -1;
}

function audio_emitter_position(_z51,_r4,_s4,_Qq)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return;
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	_Qq=yyGetReal(_Qq);
	emitter.setPosition(_r4,_s4,_Qq);
}

function audio_emitter_get_x(_z51)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return 0.0;
	return emitter._u61();
}

function audio_emitter_get_y(_z51)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return 0.0;
	return emitter._v61();
}

function audio_emitter_get_z(_z51)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return 0.0;
	return emitter._w61();
}

function audio_emitter_create()
{
	const _x61=_a21.findIndex(_761=>_761.active===false);
	if(_x61!==-1)
	{
		_a21[_x61]._y61();
		return _x61;
	}
	const emitter=new _I51();
	if(emitter===null)return undefined;
	return _a21.push(emitter)-1;
}

function audio_emitter_free(_z51)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return;
	_721.filter(_431=>_431._P31===emitter).forEach(_431=>_431.stop());
	emitter.gainnode.disconnect();
	emitter.active=false;
}

function audio_master_gain(_d61)
{
	if(_031!=_131)return;
	_831.gain.value=yyGetReal(_d61);
}

function audio_set_master_gain(_k61,_Q41)
{
	if(yyGetInt32(_k61)==0)
	{
		audio_master_gain(yyGetReal(_Q41));
	}
}

function audio_get_master_gain(_k61)
{
	if(yyGetInt32(_k61)==0)
	{
		return _831.gain.value;
	}
	return 0;
}

function audio_emitter_gain(_z51,_Q41)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return;
	_Q41=yyGetReal(_Q41);
	_Q41=Math.max(0.0,_Q41);
	emitter.gainnode.gain.value=_Q41;
}

function audio_emitter_get_gain(_z51)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return 0.0;
	return emitter.gainnode.gain.value;
}

function audio_emitter_pitch(_z51,_T41)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return;
	_T41=yyGetReal(_T41);
	_T41=Math.max(0.0,_T41);
	emitter.pitch=_T41;
	_721.filter(_431=>_431._P31===emitter).forEach(_431=>_431._U41());
}

function audio_emitter_get_pitch(_z51)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return 1.0;
	return emitter.pitch;
}

function audio_emitter_falloff(_z51,_z61,_A61,_B61)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return;
	_z61=yyGetReal(_z61);
	_A61=yyGetReal(_A61);
	_B61=yyGetReal(_B61);
	emitter._J51(_z61,_A61,_B61);
}

function audio_channel_num(_C61)
{
	_C61=yyGetInt32(_C61);
	if(_C61<_c21)
	{
		for(var i=_C61;i<_m21;++i)
		{
			var sound=_721[i];
			if(sound._Q31)
			{
				sound.stop();
			}
		}
		if(_m21>_C61)_m21=_C61;
	}
	_c21=_C61;
}

function audio_sound_get_listener_mask(__51)
{
	return 1;
}

function audio_emitter_get_listener_mask(_z51)
{
	return 1;
}

function audio_get_listener_mask()
{
	return 1;
}

function audio_get_listener_count()
{
	return 1;
}

function audio_get_listener_info(index)
{
	if(_031==_131)
	{
		index=yyGetInt32(index);
		if(index==0)
		{
			var map=ds_map_create();
			ds_map_add(map,"name","default");
			ds_map_add(map,"mask",1);
			ds_map_add(map,"index",index);
			return map;
		}
	}
	return -1;
}

function audio_debug(_D61)
{
}
/*@this {XMLHttpRequest} */
function _E61(e)
{
	if(_031!=_131)return;
	var targetid=e.target.targetid;
	debug("error loading sound"+targetid);
	if(targetid!=undefined)
	{
		debug("AudioError: "+this.URL);
		this.completed=false;
		_F61++;
		ClearEventListeners(this);
	}
}
/*@this {XMLHttpRequest} */
function _G61(e)
{
	if(_031!=_131)return;
	var targetid=e.target.targetid;
	if(_H61)debug("sound loaded: "+targetid);
	if(targetid!=undefined)
	{
		this.completed=true;
		ClearEventListeners(this);
		try
		{
			var _L31=audio_sampledata[targetid];
			_L31.state=_I21._M21;
			g_WebAudioContext.decodeAudioData(e.target.response,
function(buffer)
			{
				_L31.buffer=buffer;
				_L31.state=_I21._N21;
				_F61++;
			}
			,
function(err)
			{
				_L31.state=_I21._L21;
				_F61++;
				debug("error decoding audio data:"+err);
			}
			);
		}
		catch(_5i)
		{
			debug("error decoding audio data: "+_5i.message);
			_F61++;
		}
	}
}

function _I61(_f2)
{
	if(_031!=_131)return;
	this.completed=true;
	ClearEventListeners(this);
	var targetid=_f2.target.targetid;
	if(_H61)debug("streamed sound pre-loaded: "+targetid);
	var _L31=audio_sampledata[targetid];
	if(_L31)
	{
		_L31.state=_I21._L21;
	}
	else 
	{
		debug("ERROR: No sample data sound for sound ID "+targetid+" in Audio_StreamedSoundPreloaded");
	}
}

function _J61(_cE,_Qe,_O2,_K61)
{
	var _L31=audio_sampledata[_Qe];
	_L31.buffer=null;
	if(_e31)
	{
		_L61(_cE,_Qe,_O2,_K61);
	}
	else 
	{
		_L31.state=_I21._N21;
	}
}

function _M61(e)
{
	var targetid=e.target.targetid;
	debug("Audio_SoundReadyStateChange:targetid/readyState/status:"+targetid+'/'+e.target.readyState+'/'+e.target.status);
}

function _N61(e)
{
	var targetid=e.target.targetid;
	debug("Audio_SoundProgress:targetid/loaded/total:"+targetid+'/'+e._Hf+'/'+e._O61);
}

function _P61(_cE,_K61)
{
	_cE=_a51(_cE);
	var index;
	index=_cE.indexOf(_K61);
	if(index>0)
	{
		_cE=_cE.substr(0,index);
	}
	if(_c51)
	{
		_K61="ogg";
	}
	else if(_d51)
	{
		_K61="mp3";
	}
	else 
	{
		_K61="ogg";
	}
	_cE=_cE+"."+_K61;
	var _i41=new XMLHttpRequest();
	_i41.open('GET',_cE,true);
	_i41.responseType='arraybuffer';
	_i41.URL=_cE;
	_i41.completed=false;
	return _i41;
}

function _Q61(_cE,_Qe,_O2,_K61,_R61)
{
	if((_031!=_131)||(_S61==false))
	{
		return undefined;
	}
	var _i41=_P61(_cE,_K61);
	if(_R61!=undefined)
	{
		_i41.targetid=
		{
			_v_:_R61,_261:_Qe		}
		;
		_i41.onload=_T61;
		_i41.onerror=_U61;
	}
	else 
	{
		_i41.targetid=_Qe;
		_i41.onload=_G61;
		_i41.onerror=_E61;
		_i41.ontimeout=_E61;
		_i41._AE=_N61;
		_i41.onreadystatechange=_M61;
	}
	_i41.send();
	_f41[_O2]=_i41;
	return _Qe;
}

function _L61(_cE,_Qe,_O2,_K61)
{
	if((_031!=_131)||(_S61==false))
	{
		return undefined;
	}
	var _i41=_P61(_cE,_K61);
	_i41.targetid=_Qe;
	_i41.onload=_I61;
	_i41.onerror=_E61;
	_i41.send();
	_f41[_O2]=_i41;
	return _Qe;
}
var _V61="Unloaded";
var _W61="Loading";
var _X61="Loaded";
var _Y61="Unloading";
var _Z61=0;
var _231=[];
/*@constructor */
function __61(_c61)
{
	this.groupId=_c61;
	this._071=_V61;
	this._171=0;
	this._271=0;
	this._371=[];
	this.gain=new _C31(1);
}
__61.prototype._471=
function(_571)
{
	this._371.push(_571);
}
;
__61.prototype._671=
function(_771)
{
	if(this._071!=_771)
	{
		this._071=_771;
		debug("Audio Group "+this.groupId+"-> "+this._071);
		if(_771==_X61)
		{
			var map=ds_map_create();
			g_pBuiltIn.async_load=map;
			ds_map_add(map,"type","audiogroup_load");
			ds_map_add(map,"group_id",this.groupId);
			_j2._k2(_871,0);
		}
	}
}
;
__61.prototype._971=
function()
{
	return this.gain.get();
}
;
__61.prototype._P41=
function(_Q41,_W51)
{
	_Q41=Math.max(0,_Q41);
	_W51=Math.max(0,_W51);
	this.gain.set(_Q41,_W51);
	if(_W51==0)
	{
		_721.forEach(_431=>
		{
			const _051=this._371.find(_a71=>_a71==_431._W31);
			if(_051!==undefined)_431._O31.gain.value=_041._141(_431);
		}
		);
	}
}
;
/*@this {XMLHttpRequest} */
function _T61(e)
{
	var targetid=this.targetid._261;
	var _b71=this.targetid._v_;
	if(_H61)debug("sound loaded "+targetid);
	if(targetid!=undefined)
	{
		e.target.completed=true;
		ClearEventListeners(this);
		try
		{
			var _L31=audio_sampledata[targetid];
			_L31.state=_I21._M21;
			g_WebAudioContext.decodeAudioData(e.target.response,
function(buffer)
			{
				_L31.buffer=buffer;
				_L31.state=_I21._N21;
				_b71._c71();
			}
			,
function(err)
			{
				_L31.state=_I21._L21;
				_b71._c71();
				debug("error decoding audio data:"+err);
			}
			);
		}
		catch(_5i)
		{
			debug("error decoding audio data: "+_5i.message);
			_b71._c71();
		}
	}
}
/*@this {XMLHttpRequest} */
function _U61(e)
{
	var targetid=this.targetid._261;
	var _b71=this.targetid._v_;
	debug("error loading sound"+targetid);
	if(targetid!=undefined)
	{
		debug("AudioError: "+this.URL);
		this.completed=false;
		ClearEventListeners(this);
		_b71._c71();
	}
}
__61.prototype._c71=
function()
{
	this._171--;
	if(this._371.length>0)
	{
		this._271=((this._371.length-this._171)*100)/(this._371.length);
	}
	if(this._171<=0)
	{
		this._671(_X61);
	}
}
;
__61.prototype._w7=
function()
{
	if(this._071!=_V61)
	{
		return 0;
	}
	if(this._371.length==0)
	{
		return 0;
	}
	this._671(_W61);
	this._171=this._371.length;
	this._271=0;
	var i;
	for(i=0;i<this._371.length;
++i)
	{
		var index=this._371[i];
		if(_nu.Sounds[index].kind==_F21._G21)
		{
			var id=_Q61(_M7+_nu.Sounds[index].origName,index,_nu.Sounds[index].pName,_nu.Sounds[index].extension,this);
			if(id===undefined)this._c71();
		}
		else 
		{
			this._c71();
		}
	}
}
;
__61.prototype._d71=
function()
{
	if(this._071!=_X61)
	{
		return 0;
	}
	this._671(_Y61);
	_b61(this.groupId);
	var i;
	for(i=0;i<this._371.length;++i)
	{
		var index=this._371[i];
		var _L31=audio_sampledata[index];
		if(_L31!=undefined)
		{
			_L31.buffer=null;
		}
	}
	this._671(_V61);
}
;
__61.prototype._e71=
function()
{
	if(this._071==_X61)
	{
		return 1;
	}
	return 0;
}
;
__61.prototype._f71=
function()
{
	if(this._071==_X61)
	{
		return 100;
	}
	if(this._071==_W61)
	{
		return ~~this._271;
	}
	return 0;
}
;

function _m31()
{
	var index;
	for(index=0;index<_nu.Sounds.length;index++)
	{
		if(_nu.Sounds[index]&&(_nu.Sounds[index]!==null))
		{
			var _L31=new _B31();
			audio_sampledata[index]=_L31;
			_L31.buffer=null;
			var _g71=_nu.Sounds[index].volume;
			_L31.gain=new _C31(_g71);
			_L31._D31=_g71;
			_L31.pitch=1.0;
			_L31.kind=_nu.Sounds[index].kind;
			if(_nu.Sounds[index].duration!=undefined)
			{
				_L31.duration=_nu.Sounds[index].duration;
			}
			_L31.groupId=0;
			var groupId=_nu.Sounds[index].groupId;
			if(groupId!=undefined)
			{
				_L31.groupId=groupId;
			}
		}
	}
}

function _n31()
{
	if(_nu.AudioGroups)
	{
		var i;
		_Z61=_nu.AudioGroups.length;
		for(i=0;i<_Z61;++i)
		{
			_231[i]=new __61(i);
		}
		for(i=0;i<audio_sampledata.length;++i)
		{
			var sound=audio_sampledata[i];
			if(sound!=undefined)
			{
				var groupId=sound.groupId;
				if(_231[groupId]!=undefined)
				{
					if(_nu.AudioGroups[groupId].enabled)_231[groupId]._471(i);
				}
			}
		}
	}
}

function audio_group_load(_c61)
{
	_c61=yyGetInt32(_c61);
	if(_c61>0&&_c61<_Z61)
	{
		var _b71=_231[_c61];
		var result=_b71._w7();
		return result;
	}
	return 0;
}

function audio_group_unload(_c61)
{
	_c61=yyGetInt32(_c61);
	if(_c61>0&&_c61<_Z61)
	{
		var _b71=_231[_c61];
		var result=_b71._d71();
		return result;
	}
	return 0;
}

function audio_group_is_loaded(_c61)
{
	_c61=yyGetInt32(_c61);
	if(_c61==0)
	{
		return 1;
	}
	if(_c61>0&&_c61<_Z61)
	{
		var _b71=_231[_c61];
		var result=_b71._e71();
		return result;
	}
	return 0;
}

function audio_group_load_progress(_c61)
{
	_c61=yyGetInt32(_c61);
	if(_c61==0)
	{
		return 100;
	}
	if(_c61>0&&_c61<_Z61)
	{
		var _b71=_231[_c61];
		var result=_b71._f71();
		return result;
	}
	return 0;
}

function audio_group_name(_c61)
{
	_c61=yyGetInt32(_c61);
	if(_c61>=0&&_c61<_Z61)
	{
		var name=_nu.AudioGroups[_c61].name;
		return name;
	}
	return "<undefined>";
}

function audio_group_stop_all(_c61)
{
	_b61(yyGetInt32(_c61));
}

function audio_group_set_gain(_c61,_Q41,_W51)
{
	_c61=yyGetInt32(_c61);
	_Q41=yyGetReal(_Q41);
	_W51=yyGetInt32(_W51);
	const _v_=_231[_c61];
	if(_v_!==undefined)_v_._P41(_Q41,_W51);
}

function audio_group_get_gain(_c61)
{
	_c61=yyGetInt32(_c61);
	const _v_=_231[_c61];
	if(_v_!==undefined)return _v_._971();
	return 1;
}

function audio_group_get_assets(_h71)
{
	_h71=yyGetInt32(_h71);
	const _v_=_231[_h71];
	if(_v_===undefined)return [];
	return _v_._371;
}

function audio_sound_get_audio_group(_i71)
{
	_i71=yyGetInt32(_i71);
	if(_i71>=_821)
	{
		const _D51=_751(_i71);
		if(_D51===null)return -1;
		_i71=_D51._W41();
	}
	const _b41=_c41(_i71);
	if(_b41===null)return -1;
	return _b41.groupId;
}

function audio_sound_get_asset(__51)
{
	const _D51=_751(__51);
	if(_D51===null||_D51._Q31===false)
	{
		return undefined;
	}
	return _D51._W31;
}

function audio_create_stream(_jj)
{
	var _L31=new _B31();
	_L31.buffer=null;
	_L31.gain=new _C31(1);
	_L31._D31=1;
	_L31.pitch=1;
	_L31.kind=_F21._H21;
	_L31.duration=-1;
	_L31.groupId=0;
	_L31._951=yyGetString(_jj);
	_L31.state=_I21._N21;
	var index=audio_sampledata.length;
	for(var i=_nu.Sounds.length;i<audio_sampledata.length;++i)
	{
		if(audio_sampledata[i]==null)
		{
			index=i;
			break;
		}
	}
	audio_sampledata[index]=_L31;
	const _i41=new XMLHttpRequest();
	_i41.open("GET",_h41(index),true);
	_i41.responseType="arraybuffer";
	_i41.onload=()=>
	{
		g_WebAudioContext.decodeAudioData(_i41.response).then((_oj)=>
		{
			_L31.duration=_oj.duration;
		}
		);
	}
	;
	_i41.send();
	return index;
}

function audio_destroy_stream(_851)
{
	_851=yyGetInt32(_851);
	const _U51=audio_sampledata[_851];
	if(_U51!=null)
	{
		if(_U51._951!==undefined)
		{
			audio_stop_sound(_851);
			audio_sampledata[_851]=null;
		}
		return 1;
	}
	return -1;
}

function _j71()
{
	if(_031!=_131)return null;
	for(var i=0;i<_g21;i++)
	{
		const sound=_e21[i];
		if(sound!=null&&!sound._Z31)
		{
			const _0j=new _O51(
			{
				sound:_d21+i,priority:10			}
			);
			sound._FJ(_0j);
			return sound;
		}
	}
	if(_g21<_c21)
	{
		const _0j=new _O51(
		{
			sound:_d21+_g21,priority:10		}
		);
		var _t51=new _M31(_0j);
		_e21[_g21]=_t51;
		_t51._cP=_d21+_g21;
		++_g21;
		return _t51;
	}
	return null;
}

function _k71(_l71)
{
	return _l71;
}

function _m71(_l71)
{
	return _l71;
}

function audio_create_buffer_sound(_n71,_o71,_p71,_Fc,_q71,_r71)
{
	var _t51=_j71();
	if(_t51==null)return -1;
	_n71=yyGetInt32(_n71);
	_o71=yyGetInt32(_o71);
	_p71=yyGetInt32(_p71);
	_Fc=yyGetInt32(_Fc);
	_q71=yyGetInt32(_q71);
	_r71=yyGetInt32(_r71);
	var _s71=1;
	if(_r71==_B21._D21)_s71=2;
	else if(_r71>_B21._E21)
	{
		debug("audio_create_buffer_sound - unhandled _channels setting : "+_r71);
		return -1;
	}
	let _t71=8;
	if(_o71==_u71)_t71=16;
	else if(_o71!=_PE)
	{
		debug("audio_create_buffer_sound - unhandled _bufferFormat setting : "+_o71);
		return -1;
	}
	_p71=Math.min(Math.max(_p71,8000),48000);
	buffer_seek(_n71,_7i,_Fc);
	const _yz=Math.pow(2,_t71-1);
	const _v71=
	{
		length:_q71/(_s71*_t71/8),numberOfChannels:_s71,sampleRate:_p71	}
	;
	const _w71=new AudioBuffer(_v71);
	for(let _At=0;_At<_w71.length;++_At)
	{
		for(let _x71=0;_x71<_w71.numberOfChannels;++_x71)
		{
			const _y71=_w71.getChannelData(_x71);
			_y71[_At]=(buffer_read(_n71,_o71)/_yz)-1.0;
		}
	}
	var _L31=new _B31();
	_L31.gain=new _C31(1);
	_L31._D31=1.0;
	_L31.pitch=1.0;
	_L31.kind=_F21._G21;
	_L31.duration=_w71.duration;
	_L31.groupId=0;
	_L31._F31=[];
	_L31.state=_I21._N21;
	_L31.buffer=_w71;
	_f21[_t51._cP-_d21]=_L31;
	return _t51._cP;
}

function audio_free_buffer_sound(_q51)
{
	_q51=yyGetInt32(_q51);
	var _x51=_q51-_d21;
	if(_x51<0||_x51>=_g21)
	{
		debug("sound "+_q51+" does not appear to be a buffer sound, not freeing");
		return -1;
	}
	_e21[_x51]._Z31=false;
	_f21[_x51]=null;
	return 0;
}

function _z71()
{
	if(_031!=_131)return null;
	for(let i=0;
i<_k21;i++)
	{
		const sound=_i21[i];
		if(sound&&!sound.__31)
		{
			const _0j=new _O51(
			{
				sound:_h21+i,priority:10			}
			);
			sound._FJ(_0j);
			return sound;
		}
	}
	if(_k21<_c21)
	{
		var _0t=_k21;
		for(let i=0;i<_k21;i++)
		{
			const sound=_i21[i];
			if(!sound)
			{
				_0t=i;
				break;
			}
		}
		const _0j=new _O51(
		{
			sound:_h21+_0t,priority:10		}
		);
		var _t51=new _M31(_0j);
		_i21[_0t]=_t51;
		_t51._cP=_h21+_0t;
		if(_0t==_k21)++_k21;
		return _t51;
	}
	return null;
}

function audio_create_play_queue(_A71,_p71,_r71)
{
	_A71=yyGetInt32(_A71);
	_p71=yyGetInt32(_p71);
	_r71=yyGetInt32(_r71);
	if(_r71!=_B21._C21&&_r71!=_B21._D21&&_r71!=_B21._E21)
	{
		debug("audio_create_play_queue: channels should be audio_mono, audio_stereo or audio_3d");
		return -1;
	}
	var _B71=1;
	if(_r71==_B21._D21)_B71=2;
	if(_p71<1000)_p71=1000;
	if(_p71>48000)_p71=48000;
	if(_A71!=_PE&&_A71!=_u71)
	{
		debug("audio_create_play_queue: unsupported format (use buffer_u8,buffer_s16)");
		return -1;
	}
	var _t51=_z71();
	if(_t51==null)
	{
		debug("Failed to create play queue.");
		return -1;
	}
	_t51._C71=_A71;
	_t51._D71=_p71;
	_t51._E71=_r71;
	_t51._m41=g_WebAudioContext.createScriptProcessor(_l21,0,_B71);
	_t51._m41.sourceBuffers=[];
	_t51._m41._F71=0;
	_t51._m41._G71=0;
	_t51._m41.onaudioprocess=
function(_H71)
	{
		var outputBuffer=_H71.outputBuffer;
		var _m41=_t51._m41;
		var _I71=outputBuffer.numberOfChannels;
		for(var _J71=0;_J71<_l21;_J71++)
		{
			if(_m41.sourceBuffers.length>0)
			{
				for(let _K71=0;_K71<_I71;_K71++)
				{
					const _L71=outputBuffer.getChannelData(_K71);
					_L71[_J71]=_m41.sourceBuffers[0].getChannelData(_K71)[_m41._G71];
				}
				_m41._G71++;
				if(_m41._G71>=_m41.sourceBuffers[0].length)
				{
					var _M71=_m41.sourceBuffers.shift();
					var _ae=_be._ce(_t51._cP,undefined,_N71,undefined);
					_ae._k41=_t51._cP;
					_ae._O71=_M71._P71;
					_ae._Q71=0;
					_ae._fe=0;
					_ae._ge=true;
					_m41._G71=0;
				}
			}
			else 
			{
				for(let _K71=0;_K71<_I71;_K71++)
				{
					const _L71=outputBuffer.getChannelData(_K71);
					_L71[_J71]=0;
				}
			}
		}
	}
	;
	var _L31=new _B31();
	_L31.gain=new _C31(1);
	_L31._D31=1.0;
	_L31.pitch=1.0;
	_L31.kind=_F21._G21;
	_L31.duration=0.0;
	_L31.groupId=0;
	_L31._F31=[];
	_L31.state=_I21._N21;
	_j21[_t51._cP-_h21]=_L31;
	return _t51._cP;
}

function audio_queue_sound(_R71,_n71,_Fc,_JO)
{
	_R71=yyGetInt32(_R71);
	_n71=yyGetInt32(_n71);
	_Fc=yyGetInt32(_Fc);
	_JO=yyGetInt32(_JO);
	var _n41=_R71-_h21;
	if(_n41<0&&_n41>=_k21)
	{
		debug("sound "+_R71+" does not appear to be a queue sound, can't queue a sound behind it.");
		return -1;
	}
	var _l41=_i21[_n41];
	if(!_l41||_i21[_n41].__31==false)
	{
		debug("looks like queue sound "+_R71+" has been freed already, not queueing behind it.");
		return -1;
	}

		{
		var _s71=1;
		if(_l41._E71==_B21._D21)_s71=2;
		else if(_l41._E71>_B21._E21)
		{
			debug("audio_create_buffer_sound - unhandled queueSound.queueChannels setting : "+_l41._E71);
			return -1;
		}
		var _t71=8;
		if(_l41._C71==_u71)_t71=16;
		else if(_l41._C71!=_PE)
		{
			debug("audio_create_buffer_sound - unhandled queueSound.queueFormat setting : "+_l41._C71);
			return -1;
		}
		buffer_seek(_n71,_S71,0);
		var _T71=_JO;
		var wavBuffer=buffer_create(44+_T71,_U71,1);
		buffer_write(wavBuffer,__h,_k71(0x46464952));
		buffer_write(wavBuffer,__h,_k71(36+_T71));
		buffer_write(wavBuffer,__h,_k71(0x45564157));
		buffer_write(wavBuffer,__h,_k71(0x20746d66));
		buffer_write(wavBuffer,__h,_k71(16));
		buffer_write(wavBuffer,_V71,_m71(1));
		buffer_write(wavBuffer,_V71,_m71(_s71));
		buffer_write(wavBuffer,__h,_k71(_l41._D71));
		buffer_write(wavBuffer,__h,_k71(_l41._D71*_s71*_t71/8));
		buffer_write(wavBuffer,_V71,_m71(_s71*_t71/8));
		buffer_write(wavBuffer,_V71,_m71(_t71));
		buffer_write(wavBuffer,__h,_k71(0x61746164));
		buffer_write(wavBuffer,__h,_k71(_T71));
		buffer_copy(_n71,_Fc,_T71,wavBuffer,44);
		var _G9=buffer_get_address(wavBuffer);
		_l41._m41._F71++;
		try
		{
			g_WebAudioContext.decodeAudioData(_G9,
function(buffer)
			{
				buffer_delete(wavBuffer);
				buffer._P71=_n71;
				_l41._m41.sourceBuffers.push(buffer);
				_l41._m41._F71--;
			}
			,
function(err)
			{
				debug("error decoding audio data:"+err);
				buffer_delete(wavBuffer);
			}
			);
		}
		catch(_5i)
		{
			debug("audio_create_buffer_sound - error decoding audio data: "+_5i+" -- "+_5i.message);
		}
	}
	return -1;
}

function audio_free_play_queue(_R71)
{
	_R71=yyGetInt32(_R71);
	var _n41=_R71-_h21;
	if(_n41<0||_n41>=_k21)
	{
		debug("sound "+_R71+" does not appear to be a queue sound, not freeing");
		return -1;
	}
	audio_stop_sound(_R71);
	_i21[_n41].__31=false;
	_i21[_n41]=undefined;
	delete _i21[_n41];
	return 0;
}
navigator.getUserMedia=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia||navigator.msGetUserMedia;

function audio_get_recorder_count()
{
	if(navigator.getUserMedia)
	{
		return 1;
	}
	return 0;
}

function audio_get_recorder_info(_K2)
{
	_K2=yyGetInt32(_K2);
	if(_K2<0||_K2>audio_get_recorder_count())
	{
		debug("audio_get_recorder_info - device "+_K2+" is not available");
		return -1;
	}
	var map=ds_map_create();
	ds_map_add(map,"name","User provided audio input");
	ds_map_add(map,"index",0);
	ds_map_add(map,"data_format",_u71);
	ds_map_add(map,"sample_rate",16000);
	ds_map_add(map,"channels",0);
	return map;
}
var _W71=false;
var _X71=undefined;

function audio_start_recording(_Y71)
{
	var _u7=audio_get_recorder_count();
	if(_u7<=0)
	{
		debug("audio_start_recording - not available in this browser.");
		return -1;
	}
	_Y71=yyGetInt32(_Y71);
	if(_Y71>=_u7)
	{
		debug("audio_start_recording - device "+_Y71+" is not available.");
		return -1;
	}
	var _Z71=4096;
	if(_X71===undefined)
	{
		_X71=g_WebAudioContext.createScriptProcessor(_Z71,1,1);
		_X71.wavBuffer=buffer_create(_Z71*2,_U71,1);
		_X71.onaudioprocess=
function(_H71)
		{
			var inputBuffer=_H71.inputBuffer;
			buffer_seek(_X71.wavBuffer,_7i,0);
			var __71=g_WebAudioContext.sampleRate/16000;
			for(var _K71=0;_K71<inputBuffer.numberOfChannels;_K71++)
			{
				var _081=inputBuffer.getChannelData(_K71);
				var _181=0;
				for(var _J71=0;_J71<_Z71;_J71+=__71)
				{
					buffer_write(_X71.wavBuffer,_u71,Math.round(_081[Math.floor(_J71)]*32767));
					++_181;
				}
				if(_W71)
				{
					var map=ds_map_create();
					g_pBuiltIn.async_load=map;
					ds_map_add(map,"buffer_id",_X71.wavBuffer);
					ds_map_add(map,"channel_index",0);
					ds_map_add(map,"data_len",_181*2);
					_j2._k2(_281,0);
				}
			}
		}
		;
		var _381=
		{
			"audio":true		}
		;
		navigator.getUserMedia(_381,
function(_481)
		{
			var source=g_WebAudioContext.createMediaStreamSource(_481);
			source.connect(_X71);
			var _581=_931(g_WebAudioContext);
			_X71.connect(_581);
			_581.connect(g_WebAudioContext.destination);
		}
		,
function(err)
		{
			debug("audio_start_recording : error has occured in getUserMedia call "+err);
		}
		);
	}
	_W71=true;
	return 0;
}

function audio_stop_recording(_Y71)
{
	_W71=false;
}

function audio_bus_create()
{
	const _681=_w31();
	if(_681===null)return undefined;
	_y31._G51(_681._781);
	return _681;
}

function audio_effect_create(_Ob,_Pl)
{
	if(_Pl&&typeof _Pl!=="object")
	{
		_I3("Error: Audio effect parameters must be a struct");
		return undefined;
	}
	return _881._981(_Ob,_Pl);
}

function audio_emitter_bus(_z51,_a81)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return;
	if(_a81 instanceof _t31()===false)
	{
		_I3("audio_emitter_bus() - argument 'bus' should be a Struct.AudioBus");
		return;
	}
	emitter._b81(_a81);
}

function audio_emitter_get_bus(_z51)
{
	const emitter=_y51(_z51);
	if(emitter===undefined)return undefined;
	return emitter._c81();
}

function audio_bus_get_emitters(_a81)
{
	if(_a81 instanceof _t31()===false)
	{
		_I3("audio_bus_get_emitters() - argument 'bus' should be a Struct.AudioBus");
		return undefined;
	}
	const _d81=[];
	_a21.forEach((_761,_K2)=>
	{
		if(_761._681===_a81&&_761._161()===true)_d81.push(_K2);
	}
	);
	return _d81;
}

function audio_bus_clear_emitters(_a81)
{
	if(_A31()===false||_a81 instanceof _t31()===false||_a81===_y31)return;
	_a21.filter(_761=>_761._681===_a81).filter(_761=>_761._161()===true).forEach(_761=>
	{
		_761.gainnode.disconnect();
		_y31._G51(_761.gainnode);
		_761._681=_y31;
	}
	);
}

function lin_to_db(_r4)
{
	_r4=yyGetReal(_r4);
	return 20*Math.log10(_r4);
}

function db_to_lin(_r4)
{
	_r4=yyGetReal(_r4);
	return Math.pow(10,_r4/20);
}

function _e81(_K2)
{
	if(_031!=_f81)return;
	_LA._g81(_K2);
}

function _h81(_K2)
{
	if(_031!=_f81)return;
	_LA._i81(_K2);
}

function _j81(_K2)
{
	if(_031!=_f81)return;
	_LA._k81(_K2);
}

function _l81()
{
	if(_031!=_f81)return;
	_LA._m81();
}

function _n81(_K2)
{
	if(_031!=_f81)return false;
	return _LA._o81(_K2);
}

function _p81(_K2,_5k)
{
	if(_031!=_f81)return;
	_LA._q81(_K2,_5k);
}

function _r81(_5k)
{
	if(_031!=_f81)return;
	_LA._s81(_5k);
}

function _t81(_K2,_5k,_a5)
{
	if(_031!=_f81)return;
	_LA._u81(_Si(_K2),_5k,_Si(_a5));
}

function _wA(_Qe)
{
	if(_031!=_f81)return false;
	if(_LA._F4(_Qe)===null)return false;
	return true;
}

function _v81(_w81)
{
	if(_031!=_f81)return -1;
	var _U51=_LA._F4(_w81);
	if(_U51===null)return -1;
	return _U51.kind;
}

function _xA(_Qe)
{
	if(_031!=_f81)return "";
	var _U51=_LA._F4(_Qe);
	if(_U51===null)return "";
	return _U51.pName;
}

function _x81(_Qe)
{
	if(_031!=_f81)return "";
	return _xA(_Qe);
}

function _y81(_hw,_eb,_z81)
{
	_hw=_a51(_hw);
	if(_031!=_f81)return;
	var _b51=filename_ext(_hw);
	if(_hw.substring(0,5)=="file:")return -1;
	var _ol=_b51;
	_A81(_ol,_hw,_b51,_pl,_ql);
	var _CN=_LA._981();
	var _B81=_LA._F4(_CN);
	_B81.pName=_hw;
	_B81.extension=_b51;
	_B81.origName=_hw;
	_be._ce(_CN,_hw,_C81,_f41[_hw]);
	return _CN;
}

function _D81(_K2,_hw,_eb,_z81)
{
	if(_031!=_f81)return;
	_j81(_K2);
	var _b51=filename_ext(_hw);
	if(_hw.substring(0,5)=="file:")return -1;
	var _ol=_b51;
	_A81(_ol,_hw,_b51,_pl,_ql);
	var _B81=_LA._F4(_K2);
	_f41[_B81.pName]=undefined;
	_B81._E81=[];
	_B81.pName=_hw;
	_B81.extension=_b51;
	_B81.origName=_hw;
	_be._ce(_K2,_hw,_C81,_f41[_B81.pName]);
	return _K2;
}

function _F81(_K2)
{
	if(_031!=_f81)return;
	_LA._Hj(_K2);
}
var _G81=0,_H81=1,_I81=2,_J81=3;

function sprite_exists(_K2)
{
	return _E4._F4(yyGetInt32(_K2))!=null;
	return false;
}

function sprite_get_width(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w!=null)return _1w.width;
	return 0;
}

function sprite_get_height(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w!=null)return _1w.height;
	;
	return 0;
}

function sprite_get_name(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return "";
	return _1w.pName;
}

function _K81(_K2)
{
	return sprite_get_name(_K2);
}

function sprite_get_number(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return 0;
	return _1w._F5;
}

function _L81(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return 0;
	return _1w.transparent;
}

function sprite_get_xoffset(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return 0;
	return _1w.xOrigin;
}

function sprite_get_yoffset(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return 0;
	return _1w.yOrigin;
}

function sprite_get_bbox_left(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return 0;
	return _1w._7G.left;
}

function sprite_get_bbox_right(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return 0;
	return _1w._7G.right;
}

function sprite_get_bbox_top(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return 0;
	return _1w._7G.top;
}

function sprite_get_bbox_bottom(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return 0;
	return _1w._7G.bottom;
}

function sprite_get_bbox_mode(_K2)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return -1;
	return _1w._M81;
}

function sprite_set_offset(_K2,_lB,_mB)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return;
	_1w.xOrigin=yyGetReal(_lB);
	_1w.yOrigin=yyGetReal(_mB);
	_1w._N81();
}

function sprite_set_bbox(_K2,_2l,_3l,_O81,_P81)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w===null)return;
	var left=yyGetInt32(_2l);
	var right=yyGetInt32(_O81);
	var top=yyGetInt32(_3l);
	var bottom=yyGetInt32(_P81);
	var _Q81=false;
	if(_1w._7G.left!=left||_1w._7G.right!=right||_1w._7G.top!=top||_1w._7G.bottom!=bottom)_Q81=true;
	_1w._7G.left=left;
	_1w._7G.top=top;
	_1w._7G.right=right;
	_1w._7G.bottom=bottom;
	if(_Q81)
	{
		_1w._R81();
		_1w._S81();
	}
}

function sprite_set_bbox_mode(_K2,_Hr)
{
	var _1w=_E4._F4(yyGetInt32(_K2));
	if(_1w==null)return;
	_Hr=yyGetInt32(_Hr);
	if((_Hr<0)||(_Hr>2))return;
	if(_Hr==_1w._M81)return;
	_1w._M81=_Hr;
	_1w._S81();
}

function sprite_set_alpha_from_sprite(_ji,_ih)
{
	var _Bi=_E4._F4(yyGetInt32(_ji));
	if(_Bi===null)return false;
	if(!_Bi._Sk)
	{
		_I3("Error: Can't set the alpha channel of normal sprite. It must 'duplicated' first");
		return false;
	}
	var _Ci=_E4._F4(yyGetInt32(_ih));
	if(_Ci===null)return false;
	var _u7=_Ci._F5;
	if(_u7>_Bi._F5)
	{
		_u7=_Bi._F5;
	}
	for(var i=0;i<_u7;i++)
	{
		var _T81=_Bi._D3[i];
		var _U81=_Ci._D3[i];
		_ll(_T81,_U81);
	}
	return true;
}

function _V81()
{
}

function _W81(_u3,_r4,_s4,_eh,_fh,_rk,_sk)
{
	_u3=yyGetInt32(_u3);
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	_eh=yyGetInt32(_eh);
	_fh=yyGetInt32(_fh);
	_rk=yyGetBool(_rk);
	var _X81=document.createElement(_bv);
	var _Y81=_X81.getContext('2d');
	_Z81(_Y81);
	var __81=_E4._F4(_u3);
	__81._F5++;
	_X81.width=__81.width;
	_X81.height=__81.height;
	_Y81._091(canvas,_r4,_s4,_eh,_fh,0,0,_X81.width,_X81.height);
	if(_rk)
	{
		_X81.complete=_xk(_Y81,_eh,_fh);
	}
	else 
	{
		_X81.complete=true;
	}
	__81._F5++;
	var _C3=new _Ak();
	__81._D3[__81._D3.length]=_C3;
	_C3.x=0;
	_C3.y=0;
	_C3.w=__81.width;
	_C3.h=__81.height;
	_C3.XOffset=0;
	_C3.YOffset=0;
	_C3.CropWidth=_C3.w;
	_C3.CropHeight=_C3.h;
	_C3.ow=_C3.w;
	_C3.oh=_C3.h;
	_C3.tp=_Tk(_X81);
	_C3.texture=_G3[_C3.tp];
	_C3.texture.complete=true;
	return _u3;
}
compile_if_used(_V81=_W81);

function sprite_create_from_surface()
{
}

function _191(_Qe,_r4,_s4,_eh,_fh,_rk,_sk,_291,_391)
{
	_Qe=yyGetInt32(_Qe);
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	_eh=yyGetInt32(_eh);
	_fh=yyGetInt32(_fh);
	_rk=yyGetBool(_rk);
	_291=yyGetInt32(_291);
	_391=yyGetInt32(_391);
	var _X81=document.createElement(_bv);
	var _Y81=_X81.getContext('2d');
	_Z81(_Y81);
	_X81.width=_vk._F4(_Qe).width;
	_X81.height=_vk._F4(_Qe).height;
	_Y81._091(_vk._F4(_Qe),0,0);
	if(_rk)
	{
		_X81.complete=_xk(_Y81,_eh,_fh);
	}
	else 
	{
		_X81.complete=true;
	}
	var __81=new _491();
	var _CN=_E4._591(__81);
	__81.pName="surface.copy";
	__81.width=_eh;
	__81.height=_fh;
	__81._7G=new _Lv();
	__81._7G.right=__81.width;
	__81._7G.bottom=__81.height;
	__81.transparent=true;
	__81.smooth=true;
	__81.preload=true;
	__81._M81=0;
	__81._691=_791._891;
	__81.xOrigin=_291;
	__81.yOrigin=_391;
	__81._Sk=true;
	__81._F5=1;
	__81._991=false;
	__81._a91=false;
	__81._G5=[];
	__81._D3=[];
	__81.Masks=[];
	__81._N81();
	var _C3=new _Ak();
	__81._D3[0]=_C3;
	_C3.x=0;
	_C3.y=0;
	_C3.w=__81.width;
	_C3.h=__81.height;
	_C3.XOffset=0;
	_C3.YOffset=0;
	_C3.CropWidth=_C3.w;
	_C3.CropHeight=_C3.h;
	_C3.ow=_C3.w;
	_C3.oh=_C3.h;
	_C3.tp=_Tk(_X81);
	_C3.texture=_G3[_C3.tp];
	_C3.texture.complete=true;
	_b91(_C3);
	return _CN;
}
compile_if_used(sprite_create_from_surface=_191);

function sprite_add_from_surface()
{
}

function _c91(_u3,_Qe,_r4,_s4,_eh,_fh,_rk,_sk)
{
	_u3=yyGetInt32(_u3);
	_Qe=yyGetInt32(_Qe);
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	_eh=yyGetInt32(_eh);
	_fh=yyGetInt32(_fh);
	_rk=yyGetBool(_rk);
	var _X81=document.createElement(_bv);
	var _Y81=_X81.getContext('2d');
	_Z81(_Y81);
	var __81=_E4._F4(_u3);
	__81._F5++;
	_X81.width=__81.width;
	_X81.height=__81.height;
	_Y81._091(_vk._F4(_Qe),0,0,_eh,_fh,0,0,_X81.width,_X81.height);
	if(_rk)
	{
		_X81.complete=_xk(_Y81,_eh,_fh);
	}
	else 
	{
		_X81.complete=true;
	}
	var _C3=new _Ak();
	__81._D3[__81._D3.length]=_C3;
	_C3.x=0;
	_C3.y=0;
	_C3.w=__81.width;
	_C3.h=__81.height;
	_C3.XOffset=0;
	_C3.YOffset=0;
	_C3.CropWidth=_C3.w;
	_C3.CropHeight=_C3.h;
	_C3.ow=_C3.w;
	_C3.oh=_C3.h;
	_C3.tp=_Tk(_X81);
	_C3.texture=_G3[_C3.tp];
	_C3.texture.complete=true;
	return _u3;
}
compile_if_used(sprite_add_from_surface=_c91);

function sprite_delete(_u3)
{
	_E4._Hj(yyGetInt32(_u3));
}

function sprite_save(_u3,_dV,_hw)
{
	_0b("sprite_save()");
}

function sprite_duplicate(_u3)
{
	var _1w=_E4._F4(yyGetInt32(_u3));
	if(_1w==null)return 0;
	var __81=new _491();
	var _CN=_E4._591(__81);
	__81.pName=_1w.pName+".copy";
	__81.width=_1w.width;
	__81.height=_1w.height;
	__81._7G._hh(_1w._7G);
	__81.transparent=_1w.transparent;
	__81.smooth=_1w.smooth;
	__81.preload=_1w.preload;
	__81._M81=_1w._M81;
	__81._691=_1w._691;
	__81.xOrigin=_1w.xOrigin;
	__81.yOrigin=_1w.yOrigin;
	__81._Sk=true;
	__81._F5=_1w._F5;
	__81._d91=_1w._d91;
	__81._991=_1w._991;
	__81.playbackspeedtype=_1w.playbackspeedtype;
	__81.playbackspeed=_1w.playbackspeed;
	__81._a91=_1w._a91;
	__81._G5=[];
	__81._D3=[];
	__81.Masks=[];
	for(var i=0;i<_1w._F5;i++)
	{
		var _C3=new _Ak();
		__81._D3[i]=_C3;
		_C3._Sk(_1w._D3[i]);
		var _Qk=_Rk(_1w._D3[i]);
		_C3.tp=_Tk(_Qk);
		_C3.x=0;
		_C3.y=0;
		_C3.texture=_G3[_C3.tp];
		_C3.texture.complete=true;
	}
	return _CN;
}

function sprite_add(_jj,_e91,_rk,_sk,_291,_391,_f91)
{
	_jj=yyGetString(_jj);
	_e91=yyGetInt32(_e91);
	if(_e91<0)return -1;
	if(_e91==0)_e91=1;
	var __81=new _491();
	__81._g91=true;
	if(_jj.substring(0,5)=="file:")return -1;
	__81.pName=_jj;
	if(_f91!=undefined)
	{
		if(_f91)
		{
			__81._O7=true;
		}
	}
	var _CN=_E4._591(__81);
	if(_jj.endsWith('.json'))
	{
		__81._h91(_jj,
function(err)
		{
			var _Fj=_be._ce(_CN,_jj,_i91,
			{
			}
			);
			_Fj._ge=true;
			_Fj._fe=err?_sv:_ov;
		}
		);
		return _CN;
	}
	var _ol=_jj;
	var _T3=_L7(_ol);
	_G3[_T3].onload=_pl;
	_G3[_T3].onerror=_ql;
	_be._ce(_CN,_jj,_i91,_G3[_T3]);
	__81.width=-1;
	__81.height=-1;
	__81._7G=new _Lv();
	__81._7G.right=0;
	__81._7G.bottom=0;
	__81.transparent=_rk;
	__81.smooth=yyGetBool(_sk);
	__81.preload=true;
	__81._M81=0;
	__81._691=_791._891;
	__81.xOrigin=yyGetInt32(_291);
	__81.yOrigin=yyGetInt32(_391);
	__81._Sk=false;
	__81._F5=_e91;
	__81._d91=0;
	__81._991=false;
	__81._a91=false;
	__81._G5=[];
	__81._D3=[];
	__81.Masks=[];
	for(var i=0;i<_e91;
i++)
	{
		var _C3=new _Ak();
		__81._D3[i]=_C3;
		_C3.x=0;
		_C3.y=0;
		_C3.w=0;
		_C3.h=0;
		_C3.XOffset=0;
		_C3.YOffset=0;
		_C3.CropWidth=0;
		_C3.CropHeight=0;
		_C3.ow=_C3.w;
		_C3.oh=_C3.h;
		_C3.tp=_T3;
		_C3.texture=_G3[_C3.tp];
	}
	return _CN;
}

function sprite_add_ext(_jj,_e91,_291,_391,_f91)
{
	return sprite_add(_jj,_e91,false,false,_291,_391,_f91);
}

function sprite_replace(_u3,_jj,_e91,_rk,_sk,_291,_391)
{
	_u3=yyGetInt32(_u3);
	_jj=yyGetString(_jj);
	_e91=yyGetInt32(_e91);
	if(_e91<0)return -1;
	if(_e91==0)_e91=1;
	var __81=_E4._F4(_u3);
	__81._g91=true;
	if(_jj.substring(0,5)=="file:")return -1;
	var _ol=_jj;
	if(_jj.endsWith('.json'))
	{
		__81._h91(_jj,
function(err)
		{
			var _Fj=_be._ce(_u3,_jj,_i91,
			{
			}
			);
			_Fj._ge=true;
			_Fj._fe=err?_sv:_ov;
		}
		);
		return _u3;
	}
	var _T3=_L7(_ol);
	_G3[_T3].onload=_pl;
	_G3[_T3].onerror=_ql;
	_be._ce(_u3,_jj,_i91,_G3[_T3]);
	__81.width=0;
	__81.height=0;
	__81._7G=new _Lv();
	__81._7G.right=0;
	__81._7G.bottom=0;
	__81.transparent=yyGetBool(_rk);
	__81.smooth=yyGetBool(_sk);
	__81.preload=true;
	__81._M81=0;
	__81._691=_791._891;
	__81.xOrigin=yyGetInt32(_291);
	__81.yOrigin=yyGetInt32(_391);
	__81._Sk=false;
	__81._F5=_e91;
	__81._d91=0;
	__81._991=false;
	__81._a91=false;
	__81._G5=[];
	__81._D3=[];
	__81.Masks=[];
	for(var i=0;i<_e91;i++)
	{
		var _C3=new _Ak();
		__81._D3[i]=_C3;
		_C3.x=0;
		_C3.y=0;
		_C3.w=0;
		_C3.h=0;
		_C3.XOffset=0;
		_C3.YOffset=0;
		_C3.CropWidth=0;
		_C3.CropHeight=0;
		_C3.ow=_C3.w;
		_C3.oh=_C3.h;
		_C3.tp=_T3;
		_C3.texture=_G3[_C3.tp];
	}
	return _u3;
}

function sprite_merge(_ji,_ih)
{
	_ji=yyGetInt32(_ji);
	var _Bi=_E4._F4(_ji);
	var _Ci=_E4._F4(yyGetInt32(_ih));
	var w=_Bi.width;
	var h=_Bi.height;
	var _j91=_59;
	for(var i=0;i<_Ci._F5;i++)
	{
		var _X81=document.createElement(_bv);
		var _Y81=_X81.getContext('2d');
		_Z81(_Y81);
		_X81.width=w;
		_X81.height=h;
		_59=_Y81;
		_Y81._091(_Ci._D3[i].texture,0,0,w,h,0,0,_X81.width,_X81.height);
		_X81.complete=true;
		var _C3=new _Ak();
		_Bi._D3[_Bi._D3.length]=_C3;
		_C3.x=0;
		_C3.y=0;
		_C3.w=w;
		_C3.h=h;
		_C3.XOffset=0;
		_C3.YOffset=0;
		_C3.CropWidth=w;
		_C3.CropHeight=h;
		_C3.ow=_C3.w;
		_C3.oh=_C3.h;
		_C3.tp=_Tk(_X81);
		_C3.texture=_G3[_C3.tp];
		_C3.texture.complete=true;
		_Bi._F5++;
	}
	_59=_j91;
	return _ji;
}

function sprite_assign(_zT,_o5)
{
	_zT=yyGetInt32(_zT);
	var _Bi=_E4._F4(_zT);
	var _Ci=_E4._F4(yyGetInt32(_o5));
	_Bi.width=_Ci.width;
	_Bi.height=_Ci.height;
	_Bi._7G=new _Lv();
	_Bi._7G._hh(_Ci);
	_Bi.transparent=_Ci.transparent;
	_Bi.smooth=_Ci.smooth;
	_Bi.preload=_Ci.preload;
	_Bi._M81=_Ci._M81;
	_Bi._691=_Ci._691;
	_Bi.xOrigin=_Ci.xOrigin;
	_Bi.yOrigin=_Ci.yOrigin;
	_Bi._Sk=true;
	_Bi._F5=_Ci._F5;
	_Bi._d91=_Ci._d91;
	_Bi._991=_Ci._991;
	_Bi.playbackspeedtype=_Ci.playbackspeedtype;
	_Bi.playbackspeed=_Ci.playbackspeed;
	_Bi._a91=_Ci._a91;
	_Bi._G5=_Ci._G5.slice(0);
	_Bi._D3=[];
	if(_Ci.Masks)
	{
		_Bi.Masks=_Ci.Masks.slice();
	}
	var w=_Bi.width;
	var h=_Bi.height;
	var _j91=_59;
	for(var i=0;i<_Ci._F5;i++)
	{
		var _U81=_Ci._D3[i];
		var _C3=new _Ak();
		_Bi._D3[i]=_C3;
		_C3.x=_U81.x;
		_C3.y=_U81.y;
		_C3.w=_U81.w;
		_C3.h=_U81.h;
		_C3.XOffset=_U81.XOffset;
		_C3.YOffset=_U81.YOffset;
		_C3.CropWidth=_U81.CropWidth;
		_C3.CropHeight=_U81.CropHeight;
		_C3.ow=_U81.ow;
		_C3.oh=_U81.oh;
		_C3.tp=_U81.tp;
		_C3.texture=_U81.texture;
	}
	_59=_j91;
	return _zT;
}

function sprite_collision_mask(_u3,_k91,_l91,_m91,_n91,_o91,_p91,_eb,_q91)
{
	var _1w=_E4._F4(yyGetInt32(_u3));
	if(_1w===null)
	{
		return false;
	}
	_1w._691=_791._r91;
	_k91=yyGetInt32(_k91);
	_l91=yyGetInt32(_l91);
	_m91=yyGetInt32(_m91);
	_o91=yyGetInt32(_o91);
	_n91=yyGetInt32(_n91);
	_p91=yyGetInt32(_p91);
	_eb=yyGetInt32(_eb);
	_q91=yyGetInt32(_q91);
	var _7G=new _Lv();
	_7G.left=_m91;
	_7G.right=_o91;
	_7G.top=_n91;
	_7G.bottom=_p91;
	if(_1w._ZC)
	{
		if(_l91!=1&&_l91!=2)
		{
			_I3("sprite_collision_mask: bboxmode must be bboxmode_fullimage or bboxmode_manual for Spine sprites");
			return;
		}
		if(_eb!=1&&_eb!=4)
		{
			_I3("sprite_collision_mask: kind must be bboxkind_rectangular or bboxkind_spine for Spine sprites");
			return;
		}
		_1w._s91(_l91);
		_1w._t91(_7G);
		_1w._b5();
		if(_eb==1)
		{
			_1w._691=_791._891;
		}
		else if(_eb==4)
		{
			_1w._691=_791._u91;
		}
		_1w._S81();
	}
	else 
	{
		if(_eb==4)
		{
			_I3("sprite_collision_mask: kind cannot be bboxkind_spine for bitmap sprites");
		}
		_1w._G5=[];
		_1w._a91=_k91;
		_1w._7G=new _Lv();
		if(_1w._F5==0)
		{
			return;
		}
		_1w._s91(_l91);
		_1w._t91(_7G);
		if(_eb!=_H81)
		{
			var _D3=_1w._D3;
			_1w._G5=[];
			if(_1w._a91)
			{
				for(var i=0;i<_1w._F5;i++)
				{
					_1w._G5[i]=_v91(null,_1w._D3[i],_l91,_1w._7G,_eb,_q91);
				}
			}
			else 
			{
				_1w._G5[0]=_v91(_1w._G5[0],_1w._D3[0],_l91,_1w._7G,_eb,_q91);
				for(var i=1;i<_1w._F5;i++)
				{
					_1w._G5[0]=_v91(_1w._G5[0],_1w._D3[i],_l91,_1w._7G,_eb,_q91);
				}
			}
			_1w._991=true;
		}
	}
}

function _w91(_Y3,_Z3,_x91,_y91,length)
{
	var _z91=_Y3>>3;
	var _A91=_Y3&0x7;
	var _B91=_x91*_Z3+_z91;
	if(_B91<length)_y91[_B91]|=1<<(7-_A91);
}

function _v91(_C91,_D91,_l91,_E91,_eb,_q91)
{
	var w=_D91.ow;
	var h=_D91.oh;
	var _F91=_E91.right-_E91.left+1;
	var _x91=(_F91+7)>>3;
	var _G91=_E91.bottom-_E91.top+1;
	var _H91=_G91*_x91;
	var _gx=new Uint8Array(_H91);
	for(var _05=0;_05<_H91;_05++)_gx[_05]=false;
	if(_eb==_G81)
	{
		var _I91=_J91(_D91);
		var index=0;
		var _K91=_I91.length;
		for(var _ij=0;_ij<=_G91-1;_ij++)
		{
			for(var _05=0;_05<_x91;_05++)
			{
				var _L91=0;
				var _M91=4*(((_ij+_E91.top)*w)+_E91.left+(_05)*8)+3;
				if((_M91+0<_K91)&&(_I91[_M91+0*4])>_q91)_L91|=(1<<7);
				if((_M91+1<_K91)&&(_I91[_M91+1*4])>_q91)_L91|=(1<<6);
				if((_M91+2<_K91)&&(_I91[_M91+2*4])>_q91)_L91|=(1<<5);
				if((_M91+3<_K91)&&(_I91[_M91+3*4])>_q91)_L91|=(1<<4);
				if((_M91+4<_K91)&&(_I91[_M91+4*4])>_q91)_L91|=(1<<3);
				if((_M91+5<_K91)&&(_I91[_M91+5*4])>_q91)_L91|=(1<<2);
				if((_M91+6<_K91)&&(_I91[_M91+6*4])>_q91)_L91|=(1<<1);
				if((_M91+7<_K91)&&(_I91[_M91+7*4])>_q91)_L91|=(1<<0);
				_gx[_05+(_ij*_x91)]=_L91;
			}
		}
	}
	else 
	{
		switch(_eb)
		{
			case _I81:
			{
				var _26=(_E91.left+_E91.right)/2;
				var _ha=_26-_E91.left+0.5;
				var _36=(_E91.top+_E91.bottom)/2;
				var _ia=_36-_E91.top+0.5;
				for(var y=_E91.top;y<=_E91.bottom;y++)
				{
					for(var x=_E91.left;x<=_E91.right;x++)
					{
						if((_ha>0)&&(_ia>0))
						{
							if(sqr((x-_26)/_ha)+sqr((y-_36)/_ia)<1)_w91(x-_E91.left,y-_E91.top,_x91,_gx,_H91);
						}
					}
				}
				break;
			}
			case _J81:
			{
				var _26=(_E91.left+_E91.right)/2;
				var _ha=_26-_E91.left+0.5;
				var _36=(_E91.top+_E91.bottom)/2;
				var _ia=_36-_E91.top+0.5;
				for(var y=_E91.top;y<=_E91.bottom;y++)
				{
					for(var x=_E91.left;x<=_E91.right;x++)
					{
						if((_ha>0)&&(_ia>0))
						{
							if(Math.abs((x-_26)/_ha)+Math.abs((y-_36)/_ia)<1)_w91(x-_E91.left,y-_E91.top,_x91,_gx,_H91);
						}
					}
				}
				break;
			}
		}
	}
	if(_C91!=null)
	{
		for(var i=0;i<_gx.length;i++)
		{
			if(_C91[i])_gx[i]=true;
		}
	}
	return _gx;
}

function sprite_set_cache_size(_u3,_Vx)
{
	_u3=yyGetInt32(_u3);
	var _1w=_E4._F4(_u3);
	if(!_1w)
	{
		_I3("Trying to adjust the cache on a non-existant sprite ("+string(_u3)+")");
		return false;
	}
	_Vx=yyGetInt32(_Vx);
	var _D3=_1w._D3;
	for(var i=0;i<_1w._F5;i++)
	{
		if(_D3[i]._v7>_Vx)
		{
			_D3[i]._t7=[];
			_D3[i]._u7=0;
		}
		_D3[i]._v7=_Vx;
	}
}

function sprite_set_cache_size_ext(_u3,_K2,_Vx)
{
	_u3=yyGetInt32(_u3);
	var _1w=_E4._F4(_u3);
	if(!_1w)
	{
		_I3("Trying to adjust the cache on a non-existant sprite ("+string(_u3)+")");
		return false;
	}
	_K2=yyGetInt32(_K2);
	if(_K2<0||_K2>_1w._F5)
	{
		_I3("Trying to adjust the cache on a non-existant sprite sub image ("+string(_u3)+", "+string(_K2)+")");
		return;
	}
	_Vx=yyGetInt32(_Vx);
	var _C3=_1w._D3[_K2];
	if(_C3._v7>_Vx)
	{
		_C3._t7=[];
		_C3._u7=0;
	}
	_C3._v7=_Vx;
}

function sprite_get_tpe(_K2,_N91)
{
	_K2=_4N(_K2,_f01,_E4.Sprites.length,_E4.Sprites);
	if(typeof _N91!="number")
	{
		_I3("sprite_get_tpe() subimg argument should be a Real!");
	}
	_N91=yyGetInt32(_N91);
	var _1w=_E4._F4(_K2);
	if(!_1w)
	{
		_I3("Trying to adjust the cache on a non-existant sprite ("+string(_K2)+")");
		return false;
	}
	if(_N91<0||_N91>_1w._F5)
	{
		_I3("Trying to adjust the cache (tpe) on a non-existant sprite sub image ("+string(_K2)+", "+string(_N91)+")");
		return;
	}
	var _D3=_1w._D3;
	if(_D3[_N91])
	{
		var _C3=_D3[_N91];
		var _O91=new _P91();
		_O91.tpe_x=_C3.x;
		_O91.tpe_y=_C3.y;
		_O91.tpe_w=_C3.w;
		_O91.tpe_h=_C3.h;
		_O91.tpe_XOffset=_C3.XOffset;
		_O91.tpe_YOffset=_C3.YOffset;
		_O91.tpe_CropWidth=_C3.CropWidth;
		_O91.tpe_CropHeight=_C3.CropHeight;
		_O91.tpe_ow=_C3.ow;
		_O91.tpe_oh=_C3.oh;
		_O91.tpe_tp=_C3.x;
		_O91._Q91=_C3._Sk;
		_O91.tpe_texture=_C3.texture;
		return _O91;
	}
	return null;
}

function sprite_get_texture(_R91,_S91)
{
	_R91=_4N(_R91,_f01,_E4.Sprites.length,_E4.Sprites);
	if(typeof _S91!="number")
	{
		_I3("sprite_get_texture() subimg argument should be a Real!");
	}
	if(sprite_exists(_R91))
	{
		var _CF=_E4._F4(_R91);
		var _C3=_CF._T91(yyGetInt32(_S91));
		if(_C3)
		{
			return(
			{
				_fb:_C3.texture,_gb:_C3,toString:()=>"Texture:"+_C3.texture.URL			}
			);
		}
	}
	return null;
}

function sprite_get_uvs(_R91,_S91)
{
	_R91=_4N(_R91,_f01,_E4.Sprites.length,_E4.Sprites);
	if(typeof _S91!="number")
	{
		_I3("sprite_get_uvs() subimg argument should be a Real!");
	}
	if(sprite_exists(_R91))
	{
		var _CF=_E4._F4(_R91);
		var _C3=_CF._T91(yyGetInt32(_S91));
		var texture=_C3.texture;
		var _yl=1.0/texture.width;
		var _zl=1.0/texture.height;
		var _Al=[];
		_Al.push(_C3.x*_yl,_C3.y*_zl,(_C3.x+_C3.CropWidth)*_yl,(_C3.y+_C3.CropHeight)*_zl);
		_Al.push(_C3.XOffset,_C3.YOffset,_C3.CropWidth/_C3.ow,_C3.CropHeight/_C3.oh);
		return _Al;
	}
	return null;
}

function sprite_prefetch(_R91)
{
	var _1w=_E4._F4(yyGetInt32(_R91));
	if(_1w===null)
	{
		return -1;
	}
	for(var i=0;i<_1w._F5;i++)
	{
		var _D3=_1w._D3;
		if(_D3[i])
		{
			var _C3=_D3[i];
			if(_C3.texture)
			{
				if(_C3.texture._R7)
				{
					_S7(_C3.texture._R7);
					return 0;
				}
			}
		}
	}
	return -1;
}

function sprite_prefetch_multi(_U91)
{
	if(Array.isArray(_U91))
	{
		for(var _05=0;_05<_U91.length;
_05++)
		{
			var _1w=_E4._F4(_U91[_05]);
			if(_1w===null)continue;
			for(var i=0;i<_1w._F5;i++)
			{
				var _D3=_1w._D3;
				if(_D3[i])
				{
					var _C3=_D3[i];
					if(_C3.texture)
					{
						if(_C3.texture._R7)
						{
							_S7(_C3.texture._R7);
						}
					}
				}
			}
		}
		return 0;
	}
	else 
	{
		return -1;
	}
}

function sprite_flush(_R91)
{
	var _1w=_E4._F4(yyGetInt32(_R91));
	if(_1w===null)
	{
		return -1;
	}
	for(var i=0;i<_1w._F5;i++)
	{
		var _D3=_1w._D3;
		if(_D3[i])
		{
			var _C3=_D3[i];
			if(_C3.texture)
			{
				if(_C3.texture._R7)
				{
					_Gl(_C3.texture._R7);
					return 0;
				}
			}
		}
	}
	return -1;
}

function sprite_flush_multi(_U91)
{
	if(Array.isArray(_U91))
	{
		for(var _05=0;
_05<_U91.length;_05++)
		{
			var _1w=_E4._F4(_U91[_05]);
			if(_1w===null)continue;
			for(var i=0;i<_1w._F5;i++)
			{
				var _D3=_1w._D3;
				if(_D3[i])
				{
					var _C3=_D3[i];
					if(_C3.texture)
					{
						if(_C3.texture._R7)
						{
							_Gl(_C3.texture._R7);
						}
					}
				}
			}
		}
		return 0;
	}
	else 
	{
		return -1;
	}
}

function sprite_set_speed(_R91,_IG,_Ob)
{
	var _1w=_E4._F4(yyGetInt32(_R91));
	if(_1w!=null)
	{
		_1w.playbackspeed=yyGetReal(_IG);
		_1w.playbackspeedtype=yyGetInt32(_Ob);
		if(_1w.sequence!=null)
		{
			_1w.sequence._V91=_1w.playbackspeed;
			_1w.sequence._W91=_1w.playbackspeedtype;
		}
	}
}

function sprite_get_speed_type(_R91)
{
	var _1w=_E4._F4(yyGetInt32(_R91));
	if(_1w!=null)
	{
		if(_1w.sequence!=null)
		{
			return _1w.sequence._W91;
		}
		else 
		{
			return _1w.playbackspeedtype;
		}
	}
	else return -1;
}

function sprite_get_speed(_R91)
{
	var _1w=_E4._F4(yyGetInt32(_R91));
	if(_1w!=null)
	{
		if(_1w.sequence!=null)
		{
			return _1w.sequence._V91;
		}
		else 
		{
			return _1w.playbackspeed;
		}
	}
	else return -1;
}

function sprite_get_nineslice(_R91)
{
	var _1w=_E4._F4(yyGetInt32(_R91));
	if(_1w!=null)
	{
		if(_1w._X91!=null)
		{
			return _1w._X91;
		}
		else 
		{
			_1w._X91=new _Y91(null);
			return _1w._X91;
		}
	}
	else return null;
}

function sprite_set_nineslice(_R91,_Z91)
{
	if((typeof(_Z91)!=="object")||(_Z91==null)||!(_Z91 instanceof _Y91))
	{
		_I3("sprite_set_nineslice() - specified nineslice is not valid");
		return;
	}
	var _1w=_E4._F4(yyGetInt32(_R91));
	if(_1w!=null)
	{
		_1w._X91=_Z91;
		_1w._X91._t7.__91=true;
	}
	else return null;
}

function sprite_nineslice_create()
{
	return new _Y91(null);
}

function sprite_get_info(_R91)
{
	var _r3=undefined;
	var _1w=_E4._F4(yyGetInt32(_R91));
	if(_1w!=null)
	{
		var type=(_1w._YC!=undefined)?1:(_1w._ZC!=undefined)?2:0;
		_r3=new _Yx();
		variable_struct_set(_r3,"width",_1w.width);
		variable_struct_set(_r3,"height",_1w.height);
		variable_struct_set(_r3,"xoffset",_1w.xOrigin);
		variable_struct_set(_r3,"yoffset",_1w.yOrigin);
		variable_struct_set(_r3,"transparent",_1w.transparent);
		variable_struct_set(_r3,"smooth",_1w.smooth);
		variable_struct_set(_r3,"preload",_1w.preload);
		variable_struct_set(_r3,"type",type);
		variable_struct_set(_r3,"bbox_left",_1w._7G.left);
		variable_struct_set(_r3,"bbox_right",_1w._7G.right);
		variable_struct_set(_r3,"bbox_top",_1w._7G.top);
		variable_struct_set(_r3,"bbox_bottom",_1w._7G.bottom);
		variable_struct_set(_r3,"name",_1w.pName);
		variable_struct_set(_r3,"num_subimages",_1w._F5);
		variable_struct_set(_r3,"frame_speed",(_1w.playbackspeed!=undefined)?_1w.playbackspeed:-1);
		variable_struct_set(_r3,"frame_type",(_1w.playbackspeedtype!=undefined)?_1w.playbackspeedtype:-1);
		variable_struct_set(_r3,"use_mask",_1w._691===_791._r91);
		variable_struct_set(_r3,"num_masks",_1w._G5.length);
		switch(type)
		{
			case 0:
			{
				var _0a1=[];
				for(var _u5=0;_u5<_1w._D3.length;++_u5)
				{
					var _C3=_1w._D3[_u5];
					var _L8=new _Yx();
					variable_struct_set(_L8,"x",_C3.x);
					variable_struct_set(_L8,"y",_C3.y);
					variable_struct_set(_L8,"w",_C3.w);
					variable_struct_set(_L8,"h",_C3.h);
					variable_struct_set(_L8,"x_offset",_C3.XOffset);
					variable_struct_set(_L8,"y_offset",_C3.YOffset);
					variable_struct_set(_L8,"crop_width",_C3.CropWidth);
					variable_struct_set(_L8,"crop_height",_C3.CropHeight);
					variable_struct_set(_L8,"original_width",_C3.ow);
					variable_struct_set(_L8,"original_height",_C3.oh);
					variable_struct_set(_L8,"texture",_C3.tp);
					_0a1.push(_L8);
				}
				variable_struct_set(_r3,"frames",_0a1);
			}
			break;
			case 1:break;
			case 2:if(_1w._ZC!=undefined)
			{
				var _1a1=_1w._ZC;
				variable_struct_set(_r3,"num_atlas",_1a1._f7._a4.length);
				var _2a1=[];
				for(var _u5=0;_u5<_r3.gmlnum_atlas;++_u5)
				{
					_2a1.push(_1a1._f7._a4[_u5].texture._L3);
				}
				variable_struct_set(_r3,"atlas_textures",_2a1);
				variable_struct_set(_r3,"premultiplied",_1a1._h7);
				var _3a1=_1a1._42;
				var _4a1=[];
				for(var _u5=0;_u5<_3a1.animations.length;++_u5)
				{
					_4a1.push(_3a1.animations[_u5].name);
				}
				variable_struct_set(_r3,"animation_names",_4a1);
				var _5a1=[];
				for(var _u5=0;
_u5<_3a1.skins.length;++_u5)
				{
					_5a1.push(_3a1.skins[_u5].name);
				}
				variable_struct_set(_r3,"skin_names",_5a1);
				var _6a1=[];
				for(var _u5=0;_u5<_3a1.bones.length;++_u5)
				{
					var bone=_3a1.bones[_u5];
					var _7a1=new _Yx();
					variable_struct_set(_7a1,"parent",(bone.parent!=undefined)?bone.parent.name:undefined);
					variable_struct_set(_7a1,"name",bone.name);
					variable_struct_set(_7a1,"index",bone.index);
					variable_struct_set(_7a1,"length",bone.length);
					variable_struct_set(_7a1,"x",bone.x);
					variable_struct_set(_7a1,"y",bone.y);
					variable_struct_set(_7a1,"rotation",bone.rotation);
					variable_struct_set(_7a1,"scale_x",bone.scaleX);
					variable_struct_set(_7a1,"scale_y",bone.scaleY);
					variable_struct_set(_7a1,"shear_x",bone.shearX);
					variable_struct_set(_7a1,"shear_y",bone.shearY);
					variable_struct_set(_7a1,"transform_mode",bone._8a1);
					_6a1.push(_7a1);
				}
				variable_struct_set(_r3,"bones",_6a1);
				var _9a1=[];
				for(var _u5=0;_u5<_3a1.slots.length;++_u5)
				{
					var slot=_3a1.slots[_u5];
					var _aa1=new _Yx();
					variable_struct_set(_aa1,"name",slot.name);
					variable_struct_set(_aa1,"index",slot.index);
					variable_struct_set(_aa1,"bone",(slot._W6!=undefined)?slot._W6.name:"(none)");
					variable_struct_set(_aa1,"attachment",slot._Ga);
					variable_struct_set(_aa1,"red",slot.color._f3);
					variable_struct_set(_aa1,"green",slot.color._g3);
					variable_struct_set(_aa1,"blue",slot.color._h3);
					variable_struct_set(_aa1,"alpha",slot.color._i3);
					variable_struct_set(_aa1,"blend_mode",slot._D9);
					if(_aa1._A9!=undefined)
					{
						variable_struct_set(_aa1,"dark_red",slot._A9._f3);
						variable_struct_set(_aa1,"dark_green",slot._A9._g3);
						variable_struct_set(_aa1,"dark_blue",slot._A9._h3);
						variable_struct_set(_aa1,"dark_alpha",slot._A9._i3);
					}
					var _ba1=_1w._ZC._Ha(slot.name);
					variable_struct_set(_aa1,"attachments",_ba1);
					_9a1.push(_aa1);
				}
				variable_struct_set(_r3,"slots",_9a1);
			}
			break;
		}
		variable_struct_set(_r3,"nineslice",(_1w._X91!=undefined)?_1w._X91:undefined);
		if(_1w.sequence!=undefined)
		{
			var _ca1=[];
			var _da1=_1w.sequence._ea1;
			if(_da1!=undefined)
			{
				for(var _u5=0;_u5<_da1._UM;++_u5)
				{
					var _3F=_da1._YM[_u5];
					var time=_3F._ZM;
					for(var _ij in _3F._0k)
					{
						var _fa1=_3F._0k[_ij];
						if(_fa1._ga1!=undefined)
						{
							for(var e=0;e<_fa1._ga1.length;++e)
							{
								var _cj=new _Yx();
								variable_struct_set(_cj,"frame",time);
								variable_struct_set(_cj,"message",_fa1._ga1[e]);
								_ca1.push(_cj);
							}
						}
					}
				}
			}
			variable_struct_set(_r3,"messages",_ca1);
			var _ha1=[];
			var _SM=_1w.sequence._CL[0];
			if(_SM!=undefined)
			{
				var _da1=_SM._FL;
				for(var _u5=0;_u5<_da1._UM;++_u5)
				{
					var _3F=_da1._YM[_u5];
					var time=_3F._ZM;
					var _cj=new _Yx();
					variable_struct_set(_cj,"frame",time);
					variable_struct_set(_cj,"duration",_3F._HL);
					for(var _ij in _3F._0k)
					{
						var _fa1=_3F._0k[_ij];
						variable_struct_set(_cj,"image_index",_fa1._EI);
						break;
					}
					_ha1.push(_cj);
				}
			}
			variable_struct_set(_r3,"frame_info",_ha1);
		}
	}
	return _r3;
}

function ansi_char(_C2)
{
	return String.fromCharCode(yyGetInt32(_C2)&0xff);
}

function chr(_C2)
{
	_C2=yyGetInt32(_C2);
	if(_C2>=0x10000)
	{
		var _ia1=_C2;
		_ia1-=0x10000;
		var _ja1=(((_ia1>>10)&0x3FF)+0xD800);
		var _ka1=(_ia1&0x3FF)+0xDC00;
		var result=String.fromCharCode(_ja1,_ka1);
		return result;
	}
	else 
	{
		return String.fromCharCode(_C2);
	}
	return 0;
}

function ord(_6v)
{
	if(!_6v||_6v=="")return 0;
	_6v=yyGetString(_6v);
	var _ia1=_6v.charCodeAt(0);
	var _la1,_ma1;
	if(0xD800<=_ia1&&_ia1<=0xDBFF)
	{
		_la1=_ia1;
		_ma1=_6v.charCodeAt(1);
		return((_la1-0xD800)*0x400)+(_ma1-0xDC00)+0x10000;
	}
	return _ia1;
}

function real(_qb)
{
	if(_qb==undefined)
	{
		_I3("real() argument is undefined");
	}
	else if(_qb==null)
	{
		_I3("real() argument is unset");
	}
	else if(typeof(_qb)=="boolean")
	{
		if(_qb)return 1;
		else return 0;
	}
	else if(typeof(_qb)=="number")
	{
		return _qb;
	}
	else if(typeof(_qb)=="string")
	{
		var _na1;
		if(_qb.startsWith('0x'))
		{
			_na1=parseInt(_qb);
		}
		else 
		{
			_na1=parseFloat(_qb);
		}
		if(isNaN(_na1))
		{
			_I3("unable to convert string "+_qb+" to real");
		}
		else 
		{
			return _na1;
		}
	}
	else if(_qb instanceof _gm)
	{
		return _qb.value;
	}
	else if(_qb instanceof Long)
	{
		return _qb._kP();
	}
	else if(_qb instanceof Array)
	{
		_I3("real() argument is array");
	}
	else if(_qb instanceof ArrayBuffer)
	{
		_I3("real() argument is ptr")	}
	return parseFloat(_qb);
}

function bool(_qb)
{
	if(_qb==undefined)
	{
		return false;
	}
	else if(_qb==null)
	{
		_I3("bool() argument is unset");
	}
	else if(typeof(_qb)=="boolean")
	{
		return _qb;
	}
	else if(typeof(_qb)=="number")
	{
		return _qb>0.5;
	}
	else if(typeof(_qb)=="string")
	{
		if(_qb==="true")
		{
			return true;
		}
		else if(_qb==="false")
		{
			return false;
		}
		var _na1=parseFloat(_qb);
		if(isNaN(_na1))
		{
			_I3("unable to convert string "+_qb+" to bool");
		}
		else 
		{
			return _na1>0.5;
		}
	}
	else if(_qb instanceof Long)
	{
		return _qb._kP()>0.5;
	}
	else if(_qb instanceof Array)
	{
		_I3("bool() argument is array");
	}
	else 
	{
		return _qb!=g_pBuiltIn.pointer_null;
	}
}
var _oa1=new RegExp('{([0-9]+)}','g');

function __u(_6v,_Zu)
{
	return _6v.replaceAll(_oa1,
function(match,_v_)
	{
		var _K2=parseInt(_v_);
		if(_K2<0||_K2>=_Zu.length)return match;
		return yyGetString(_Zu[_K2]);
	}
	)}

function string(_ui)
{
	if(arguments.length==1)
	{
		return yyGetString(_ui);
	}
	if(typeof(_ui)!="string")
	{
		_I3("string() trying to use string template but argument0 is not a string");
	}
	var _Zu=[];
	for(var _u5=1;_u5<arguments.length;++_u5)
	{
		_Zu.push(arguments[_u5]);
	}
	return __u(_ui,_Zu);
}

function string_ext(_6v,_Zu)
{
	if(typeof(_6v)!="string")
	{
		_I3("string_ext() argument0 is not a string");
	}
	if(!(_Zu instanceof Array))
	{
		_I3("string_ext() argument1 is not an array");
	}
	return __u(_6v,_Zu);
}

function string_format(_C2,_pa1,_qa1)
{
	if(_C2==undefined)
	{
		return "undefined";
	}
	_C2=yyGetReal(_C2);
	_qa1=yyGetInt32(_qa1);
	var _ra1=_C2.toFixed(_qa1).toString().split(".");
	var _Pj;
	for(var i=0;i<_ra1.length;i++)
	{
		switch(i)
		{
			case 0:while(_ra1[i].length<yyGetInt32(_pa1)) 
			{
				_ra1[i]=" "+_ra1[i];
			}
			_Pj=_ra1[i];
			break;
			case 1:while(_ra1[i].length<_qa1) 
			{
				_ra1[i]=_ra1[i]+"0";
			}
			_Pj=_Pj+"."+_ra1[i];
			break;
		}
	}
	return _Pj;
}

function string_length(_6v)
{
	if(!_6v)
	{
		return 0;
	}
	_6v=yyGetString(_6v);
	var _sa1=0;
	for(var i=0;i<_6v.length;++i)
	{
		++_sa1;
		var _ta1=_6v.charCodeAt(i);
		if(0xD800<=_ta1&&_ta1<=0xDBFF)
		{
			++i;
		}
	}
	return _sa1;
}

function string_byte_length(_6v)
{
	if(!_6v)
	{
		return 0;
	}
	_6v=yyGetString(_6v);
	var i=0,_Sg=_6v.length;
	var out=0;
	while(i<_Sg) 
	{
		var c=_6v.charCodeAt(i++);
		if(c>=0xD800&&c<=0xD8FF)
		{
			i+=1;
			out+=4;
		}
		else if(c<=0x7F)
		{
			out+=1;
		}
		else if(c<=0x7FF)
		{
			out+=2;
		}
		else if(c<=0xFFFF)
		{
			out+=3;
		}
		else out+=4;
	}
	return out;
}

function _ua1(_Pj,_va1)
{
	var _wa1=0;
	var _Nw=_va1-1;
	while(_Nw>0) 
	{
		var _xa1=_Pj.charCodeAt(_Nw);
		if(0xDC00<=_xa1&&_xa1<=0xDFFF)
		{
			--_wa1;
			--_Nw;
		}
		--_Nw;
	}
	return _va1+_wa1+1;
}

function _ya1(_6v,_za1)
{
	_za1--;
	var _Aa1=_za1;
	var _Ba1=0;
	while(_Ba1<_za1) 
	{
		var _Ca1=_6v.charCodeAt(_Ba1);
		if(0xD800<=_Ca1&&_Ca1<=0xDFFF)
		{
			_Aa1++;
		}
		_Ba1++;
	}
	return _Aa1;
}

function string_pos(_Da1,_6v)
{
	var _Ea1=yyGetString(_Da1);
	var _Fa1=yyGetString(_6v);
	var _Ga1=_Fa1.indexOf(_Ea1);
	return _ua1(_Fa1,_Ga1);
}

function string_pos_ext(_Da1,_6v,_Ha1)
{
	var _Ea1=yyGetString(_Da1);
	var _Fa1=yyGetString(_6v);
	var _Ia1=_ya1(_Fa1,yyGetInt32(_Ha1));
	var _Ga1=_Fa1.indexOf(_Ea1,_Ia1);
	return _ua1(_Fa1,_Ga1);
}

function string_last_pos(_Da1,_6v)
{
	var _Ea1=yyGetString(_Da1);
	var _Fa1=yyGetString(_6v);
	var _Ga1=_Fa1.lastIndexOf(_Ea1);
	return _ua1(_Fa1,_Ga1);
}

function string_last_pos_ext(_Da1,_6v,_Ha1)
{
	if(_Ha1<=0)
	{
		return 0;
	}
	var _Ea1=yyGetString(_Da1);
	var _Fa1=yyGetString(_6v);
	var _Ia1=_ya1(_Fa1,yyGetInt32(_Ha1));
	var _Ga1=_Fa1.lastIndexOf(_Ea1,_Ia1);
	return _ua1(_Fa1,_Ga1);
}

function string_copy(_6v,_K2,_Lc)
{
	_6v=yyGetString(_6v);
	_K2=yyGetInt32(_K2);
	_Lc=yyGetInt32(_Lc);
	if(_K2<1)
	{
		_K2=1;
	}
	_K2--;
	var _Aa1=_K2;
	var _Ba1=0;
	while(_Ba1<_K2) 
	{
		var _Ca1=_6v.charCodeAt(_Ba1);
		if(0xD800<=_Ca1&&_Ca1<=0xDFFF)
		{
			_Aa1++;
		}
		_Ba1++;
	}
	var _Ja1=_Lc;
	_Ba1=0;
	while(_Ba1<_Lc) 
	{
		var _Ca1=_6v.charCodeAt(_Aa1+_Ba1);
		if(0xD800<=_Ca1&&_Ca1<=0xDFFF)
		{
			_Ja1++;
		}
		_Ba1++;
	}
	return _6v.substring(_Aa1,_Aa1+_Ja1);
}

function string_char_at(_6v,_K2)
{
	var _Fa1=yyGetString(_6v);
	var _Ka1=yyGetInt32(_K2);
	--_Ka1;
	if((_Fa1.length==0)||(string_length(_Fa1)<=_Ka1))
	{
		return "";
	}
	var _vR=0;
	var _La1=_Ka1;
	if(_La1<0)
	{
		_La1=0;
	}
	var _Sg=_Fa1.length;
	while((_La1>0)&&(_vR<_Sg)) 
	{
		var _ia1=_Fa1.charCodeAt(_vR);
		if(0xD800<=_ia1&&_ia1<=0xDFFF)
		{
			++_vR;
		}
		++_vR;
		--_La1;
	}
	_La1=_vR;
	var _Ma1=_Fa1.charCodeAt(_La1);
	if(0xD800<=_Ma1&&_Ma1<=0xDFFF)
	{
		var _ma1=_Fa1.charCodeAt(_La1+1);
		return String.fromCharCode(_Ma1,_ma1);
	}
	return String.fromCharCode(_Ma1);
}

function string_ord_at(_6v,_K2)
{
	var _Fa1=yyGetString(_6v);
	var _Ka1=yyGetInt32(_K2);
	--_Ka1;
	if((_Fa1.length==0)||(string_length(_Fa1)<=_Ka1))
	{
		return -1;
	}
	var _vR=0;
	var _La1=_Ka1;
	if(_La1<0)
	{
		_La1=0;
	}
	var _Sg=_Fa1.length;
	while((_La1>0)&&(_vR<_Sg)) 
	{
		var _ia1=_Fa1.charCodeAt(_vR);
		if(0xD800<=_ia1&&_ia1<=0xDFFF)
		{
			++_vR;
		}
		++_vR;
		--_La1;
	}
	_La1=_vR;
	var _Ma1=_Fa1.charCodeAt(_La1);
	if(0xD800<=_Ma1&&_Ma1<=0xDFFF)
	{
		var _ma1=_Fa1.charCodeAt(_La1+1);
		return((_Ma1-0xD800)*0x400)+(_ma1-0xDC00)+0x10000;
	}
	return _Ma1;
}

function _Na1(_6v)
{
	var _Oa1=[];
	for(var i=0;i<_6v.length;i++)
	{
		var _Pa1=_6v.charCodeAt(i);
		if(_Pa1<0x80)
		{
			_Oa1.push(_Pa1);
		}
		else if(_Pa1<0x800)
		{
			_Oa1.push(0xc0|(_Pa1>>6),0x80|(_Pa1&0x3f));
		}
		else if(_Pa1<0xd800||_Pa1>=0xe000)
		{
			_Oa1.push(0xe0|(_Pa1>>12),0x80|((_Pa1>>6)&0x3f),0x80|(_Pa1&0x3f));
		}
		else 
		{
			i++;
			_Pa1=((_Pa1&0x3ff)<<10)|(_6v.charCodeAt(i)&0x3ff);
			_Oa1.push(0xf0|(_Pa1>>18),0x80|((_Pa1>>12)&0x3f),0x80|((_Pa1>>6)&0x3f),0x80|(_Pa1&0x3f));
		}
	}
	return _Oa1;
}

function _Qa1(data)
{
	var _Pj='';
	var i=0;
	for(i=0;i<data.length;
i++)
	{
		var value=data[i];
		if(value<0x80)
		{
			_Pj+=String.fromCharCode(value);
		}
		else if(value>0xBF&&value<0xE0)
		{
			_Pj+=String.fromCharCode((value&0x1F)<<6|data[i+1]&0x3F);
			i+=1;
		}
		else if(value>0xDF&&value<0xF0)
		{
			_Pj+=String.fromCharCode((value&0x0F)<<12|(data[i+1]&0x3F)<<6|data[i+2]&0x3F);
			i+=2;
		}
		else 
		{
			var _Pa1=((value&0x07)<<18|(data[i+1]&0x3F)<<12|(data[i+2]&0x3F)<<6|data[i+3]&0x3F)-0x010000;
			_Pj+=String.fromCharCode(_Pa1>>10|0xD800,_Pa1&0x03FF|0xDC00);
			i+=3;
		}
	}
	return _Pj;
}

function string_byte_at(_6v,_K2)
{
	var _Fa1=yyGetString(_6v);
	var _Ka1=yyGetInt32(_K2);
	var _Qu=_Na1(_Fa1);
	var index=_Ka1-1;
	if(index<0)
	{
		index=0;
	}
	if(index>=_Qu.length)
	{
		index=_Qu.length-1;
	}
	return _Qu[index];
}

function string_set_byte_at(_6v,_K2,_ww)
{
	var _Fa1=yyGetString(_6v);
	var _Ra1=yyGetInt32(_ww);
	var _Ju=_Na1(_Fa1);
	var index=yyGetInt32(_K2)-1;
	if((index>=0)&&(index<_Ju.length))
	{
		_Ju[index]=_Ra1&0xff;
		return _Qa1(_Ju);
	}
	else 
	{
		_I3("string_set_byte_at : Index beyond end of string.");
	}
	return _Fa1;
}

function string_delete(_6v,_K2,_Lc)
{
	var _Fa1=yyGetString(_6v);
	var _Ka1=yyGetInt32(_K2);
	var _Sa1=yyGetInt32(_Lc);
	if(_Sa1<=0||_Ka1<=0)return _Fa1;
	var _vR=0;
	var _La1=_Ka1-1;
	var _Sg=_Fa1.length;
	while((_La1>0)&&(_vR<_Sg)) 
	{
		var _ia1=_Fa1.charCodeAt(_vR);
		if(0xD800<=_ia1&&_ia1<=0xDFFF)
		{
			++_vR;
		}
		++_vR;
		--_La1;
	}
	_La1=_vR;
	_vR=_Sa1;
	_Ta1=_La1;
	while(_vR>0) 
	{
		var _ia1=_Fa1.charCodeAt(_La1);
		if(0xD800<=_ia1&&_ia1<=0xDFFF)
		{
			++_Ta1;
		}
		++_Ta1;
		--_vR;
	}
	return(_Fa1.substring(0,_La1)+_Fa1.substring(_Ta1,_Fa1.length));
}

function string_insert(_Da1,_6v,_K2)
{
	var _Ea1=yyGetString(_Da1);
	var _Fa1=yyGetString(_6v);
	var _Ka1=yyGetInt32(_K2);
	var _vR=0;
	var _La1=_Ka1-1;
	var _Sg=_Fa1.length;
	while((_La1>0)&&(_vR<_Sg)) 
	{
		var _ia1=_Fa1.charCodeAt(_vR);
		if(0xD800<=_ia1&&_ia1<=0xDFFF)
		{
			++_vR;
		}
		++_vR;
		--_La1;
	}
	_La1=_vR;
	return(_Fa1.substring(0,_La1)+_Ea1+_Fa1.substring(_La1,_6v.length));
}

function string_replace(_6v,_Da1,_Ua1)
{
	var _Fa1=yyGetString(_6v);
	var _Ea1=yyGetString(_Da1);
	var _Va1=yyGetString(_Ua1);
	var index=_Fa1.indexOf(_Ea1);
	if(index===-1||_Ea1.length===0)
	{
		return _Fa1;
	}
	return _Fa1.replace(_Ea1,_Va1);
}

function string_replace_all(_6v,_Da1,_Ua1)
{
	var _Fa1=yyGetString(_6v);
	if(_Fa1.length===0)return "";
	var _Ea1=yyGetString(_Da1);
	if(_Ea1.length===0)return _Fa1;
	var _Va1=yyGetString(_Ua1);
	var _Wa1=_Ea1.length;
	var _Xa1="";
	var i=_Fa1.indexOf(_Ea1);
	var _ij=0;
	while(i>=0) 
	{
		_Xa1+=_Fa1.substring(_ij,i)+_Va1;
		_ij=i+_Wa1;
		i=_Fa1.indexOf(_Ea1,_ij);
	}
	return _ij>0?_Xa1+_Fa1.substring(_ij):_Fa1;
}

function string_count(_Da1,_6v)
{
	_Da1=yyGetString(_Da1);
	_6v=yyGetString(_6v);
	var _u7=0;
	if(_Da1.length>0)
	{
		var index=0;
		while(index!=-1) 
		{
			index=_6v.indexOf(_Da1,index);
			if(index>-1)
			{
				_u7+=1;
				index++;
			}
		}
	}
	return _u7;
}

function string_hash_to_newline(_6v)
{
	let _Ya1="",_yr=0,i=0,c,_Za1;
	for(;i<_6v.length;i++)
	{
		c=_6v[i];
		if(c=="#")
		{
			if(_Za1!="\\")
			{
				_Ya1+=_6v.substring(_yr,i)+"\r\n";
			}
			else 
			{
				_Ya1+=_6v.substring(_yr,i-1)+"#";
			}
			_yr=i+1;
		}
		_Za1=c;
	}
	return _Ya1+_6v.substring(_yr,i);
}

function string_lower(_6v)
{
	return yyGetString(_6v).toLowerCase();
}

function string_upper(_6v)
{
	return yyGetString(_6v).toUpperCase();
}

function string_repeat(_6v,_Lc)
{
	var _Fa1=yyGetString(_6v);
	_Lc=yyGetInt32(_Lc);
	var _hg="";
	for(var i=0;i<_Lc;i++)
	{
		_hg=_hg+_Fa1;
	}
	return _hg;
}

function string_letters(_6v)
{
	var _hg="";
	var _Fa1=yyGetString(_6v);
	for(var i=0;i<_Fa1.length;i++)
	{
		var c=_Fa1[i];
		if((c>='A'&&c<='Z')||(c>='a'&&c<='z'))
		{
			_hg=_hg+c;
		}
	}
	return _hg;
}

function string_digits(_6v)
{
	var _Fa1=yyGetString(_6v);
	var _hg="";
	for(var i=0;i<_Fa1.length;i++)
	{
		var c=_Fa1[i];
		if(c>='0'&&c<='9')
		{
			_hg=_hg+c;
		}
	}
	return _hg;
}

function string_lettersdigits(_6v)
{
	var _Fa1=yyGetString(_6v);
	var _hg="";
	for(var i=0;i<_Fa1.length;i++)
	{
		var c=_Fa1[i];
		if((c>='A'&&c<='Z')||(c>='a'&&c<='z')||(c>='0'&&c<='9'))
		{
			_hg=_hg+c;
		}
	}
	return _hg;
}
const __a1=new RegExp("[\\/\\-\\\\^$*+?.()|[\\]{}]","g");

function _0b1(string)
{
	return string.replace(__a1,'\\$&');
}

function string_trim_start(_6v,_1b1)
{
	_6v=yyGetString(_6v);
	if(arguments.length==1)return _6v.trimStart();
	if(!(_1b1 instanceof Array))
	{
		_I3("string_trim_start() argument1 is not an array");
	}
	_1b1=_1b1.map((_0d)=>
	{
		if(typeof(_0d)!="string")
		{
			_I3("string_trim_start() argument1 should be an array of string");
		}
		return _0b1(yyGetString(_0d));
	}
	).filter(_2b1=>_2b1).join("|");
	let _3b1=new RegExp("^(?:"+_1b1+")*");
	return _6v.replace(_3b1,"");
}

function string_trim_end(_6v,_1b1)
{
	_6v=yyGetString(_6v);
	if(arguments.length==1)return _6v.trimEnd();
	if(!(_1b1 instanceof Array))
	{
		_I3("string_trim_end() argument1 is not an array");
	}
	_1b1=_1b1.map((_0d)=>
	{
		if(typeof(_0d)!="string")
		{
			_I3("string_trim_end() argument1 should be an array of string");
		}
		return _0b1(yyGetString(_0d));
	}
	).filter(_2b1=>_2b1).join("|");
	let _3b1=new RegExp("(?:"+_1b1+")*$",'g');
	return _6v.replace(_3b1,"");
}

function string_trim(_6v,_1b1)
{
	_6v=yyGetString(_6v);
	if(arguments.length==1)return _6v.trim();
	if(!(_1b1 instanceof Array))
	{
		_I3("string_trim() argument1 is not an array");
	}
	_1b1=_1b1.map((_0d)=>
	{
		if(typeof(_0d)!="string")
		{
			_I3("string_trim() argument1 should be an array of string");
		}
		return _0b1(yyGetString(_0d));
	}
	).filter(_2b1=>_2b1).join("|");
	let _4b1=new RegExp("^(?:"+_1b1+")*");
	let _5b1=new RegExp("(?:"+_1b1+")*$");
	return _6v.replace(_4b1,"").replace(_5b1,"");
}

function string_starts_with(_6v,_C2)
{
	_6v=yyGetString(_6v);
	_C2=yyGetString(_C2);
	return _6v.startsWith(_C2);
}

function string_ends_with(_6v,_C2)
{
	_6v=yyGetString(_6v);
	_C2=yyGetString(_C2);
	return _6v.endsWith(_C2);
}

function _6b1(input,_7b1,_8b1)
{
	const output=[];
	let _9b1=0;
	while(_8b1--) 
	{
		const lastIndex=_7b1.lastIndex;
		const search=_7b1.exec(input);
		if(search===null)
		{
			break;
		}
		_9b1=_7b1.lastIndex;
		output.push(input.slice(lastIndex,search.index));
	}
	output.push(input.slice(_9b1));
	return output;
}

function string_split(_6v,_ab1,_bb1,_cb1)
{
	_6v=yyGetString(_6v);
	_ab1=yyGetString(_ab1);
	if(_ab1=="")
	{
		return [_db1];
	}
	_bb1=_bb1!=undefined?yyGetReal(_bb1):false;
	_cb1=arguments.length>3?yyGetReal(_cb1):_6v.length;
	_ab1=_0b1(_ab1);
	var _3b1=new RegExp(_ab1,"g");
	var _db1=_6b1(_6v,_3b1,_cb1);
	if(_bb1)
	{
		_db1=_db1.filter(_2b1=>_2b1);
	}
	return _db1;
}

function string_split_ext(_6v,_eb1,_bb1,_cb1)
{
	_6v=yyGetString(_6v);
	if(!(_eb1 instanceof Array))
	{
		_I3("string_split_ext() argument1 is not an array");
	}
	_bb1=_bb1!=undefined?yyGetReal(_bb1):false;
	_cb1=arguments.length>3?yyGetReal(_cb1):_6v.length;
	_eb1=_eb1.map((_0d)=>_0b1(yyGetString(_0d))).filter(_2b1=>_2b1).join("|");
	var _3b1=new RegExp(_eb1,"g");
	var _db1=_6b1(_6v,_3b1,_cb1);
	if(_bb1)
	{
		_db1=_db1.filter(_2b1=>_2b1);
	}
	return _db1.map((_0d)=>_0d.replaceAll("\\|","|"));
}

function _fb1(_ab1,_Zu)
{
	return _Zu.join(_ab1);
}

function string_join(_ab1)
{
	_ab1=yyGetString(_ab1);
	var _Zu=[];
	for(var _u5=1;_u5<arguments.length;++_u5)
	{
		_Zu.push(yyGetString(arguments[_u5]));
	}
	return _fb1(_ab1,_Zu);
}

function string_join_ext(_ab1,_Zu,_Fc,_q71)
{
	_ab1=yyGetString(_ab1);
	if(!(_Zu instanceof Array))
	{
		_I3("string_join_ext() argument1 is not an array");
	}
	_Fc=_Fc!=undefined?yyGetReal(_Fc):0;
	_q71=arguments.length>3?yyGetReal(_q71):_Zu.length;
	var _gb1=_hb1(_Zu.length,_Fc,_q71);
	_Fc=_gb1[0];
	var _ib1=_gb1[1];
	var _jb1=_gb1[2];
	var _kb1=[];
	while(_ib1>0) 
	{
		_kb1.push(yyGetString(_Zu[_Fc]));
		_Fc+=_jb1;
		_ib1--;
	}
	return _fb1(_ab1,_kb1);
}

function string_concat()
{
	var _Zu=[];
	for(var _u5=0;_u5<arguments.length;++_u5)
	{
		_Zu.push(yyGetString(arguments[_u5]));
	}
	return _fb1("",_Zu);
}

function string_concat_ext(_Zu,_Fc,_q71)
{
	if(!(_Zu instanceof Array))
	{
		_I3("string_concat_ext() argument1 is not an array");
	}
	_Fc=_Fc!=undefined?yyGetReal(_Fc):0;
	_q71=arguments.length>2?yyGetReal(_q71):_Zu.length;
	var _gb1=_hb1(_Zu.length,_Fc,_q71);
	_Fc=_gb1[0];
	var _ib1=_gb1[1];
	var _jb1=_gb1[2];
	var _kb1=[];
	while(_ib1>0) 
	{
		_kb1.push(yyGetString(_Zu[_Fc]));
		_Fc+=_jb1;
		_ib1--;
	}
	return _fb1("",_kb1);
}

function _lb1(_mb1)
{
	return(_mb1>=0xD800&&_mb1<=0xD8FF)?2:1;
}

function string_foreach(_6v,_si,_Li,_q71)
{
	_6v=yyGetString(_6v);
	_si=_ti(_si,1);
	_ui="boundObject" in _si?_si._vi:
	{
	}
	;
	_Li=_Li!=undefined?yyGetReal(_Li):1;
	_q71=arguments.length>3?yyGetReal(_q71):_6v.length;
	var _Fc=(_Li<0?_Li:(_Li>0?_Li-1:0));
	var _gb1=_hb1(string_length(_6v),_Fc,_q71);
	_Fc=_gb1[0];
	var _ib1=_gb1[1];
	var _jb1=_gb1[2];
	_Li=_Fc+1;
	var _nb1=0;
	if(_jb1>0)
	{
		for(var i=0;i<_Fc;i++)
		{
			var _ob1=_6v.charCodeAt(_nb1);
			_nb1+=_lb1(_ob1);
		}
		for(var i=0;i<_ib1;i++)
		{
			var _ob1=_6v.charCodeAt(_nb1);
			var _Ab=_lb1(_ob1);
			var _pb1=_Ab==1?_6v[_nb1]:String.fromCharCode(_ob1,_6v.charCodeAt(_nb1+1));
			_si(_ui,_ui,_pb1,_Li);
			_Li++;
			_nb1+=_Ab;
		}
	}
	else 
	{
		var _qb1=[];
		var _rb1=0;
		for(var i=0;i<_Fc;i++)
		{
			var _ob1=_6v.charCodeAt(_nb1);
			var _Ab=_lb1(_ob1);
			_nb1+=_Ab;
			_qb1[(_rb1++%_ib1)]=_Ab;
		}
		for(var i=0;i<_ib1;i++)
		{
			var _ob1=_6v.charCodeAt(_nb1);
			var _Ab=_lb1(_ob1);
			var _pb1=_Ab==1?_6v[_nb1]:String.fromCharCode(_ob1,_6v.charCodeAt(_nb1+1));
			_si(_ui,_ui,_pb1,_Li);
			_Li--;
			_nb1-=_qb1[(--_rb1%_ib1)];
		}
	}
}
var _sb1=[];
var _tb1=true;

function surface_resize(_Qe,_eh,_fh)
{
	_Qe=yyGetInt32(_Qe);
	_eh=yyGetInt32(_eh);
	_fh=yyGetInt32(_fh);
	if(_Qe==_ub1)
	{
		_vb1=true;
		_wb1=_eh;
		_xb1=_fh;
		return 1;
	}
	if(!surface_exists(_Qe))
	{
		_I3("Surface does not exist");
		return 0;
	}
	if(_yb1(_Qe))
	{
		_sg("Error: Surface in use via surface_set_target(). It can not be resized until it has been removed from the surface stack.");
		return;
	}
	var _Fk=_vk._F4(_Qe);
	var _yf=_uk;
	if(_i7)
	{
		_yf=_Fk.texture._R7._yf;
	}
	surface_create(_eh,_fh,_yf,_Qe);
	return 0;
}

function surface_depth_disable(_zb1)
{
	if(yyGetBool(_zb1))
	{
		_tb1=false;
	}
	else 
	{
		_tb1=true;
	}
}

function surface_get_depth_disable()
{
	return _tb1?false:true;
}

function surface_has_depth(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	if(!surface_exists(_Qe))
	{
		_I3("surface_has_depth() - surface does not exist!");
		return false;
	}
	if(_i7)
	{
		var _Fk=_vk._F4(_Qe);
		if(!_Ab1)
		{
			return(_Fk._Bb1._Cb1!=null);
		}
		return(_Fk._Db1!=null&&_Fk._Db1._R7 instanceof _Eb1);
	}
	return false;
}
var surface_create=_Fb1;

function _Fb1(_eh,_fh,_A71,_Gb1)
{
	_eh=yyGetInt32(_eh);
	_fh=yyGetInt32(_fh);
	if(_eh<=0||_fh<=0)
	{
		_I3("create_surface : Trying to create a surface with size equal to or less than zero.");
	}
	var _Fk=document.createElement(_bv);
	_Fk._xb=_Fk.width=_eh;
	_Fk._yb=_Fk.height=_fh;
	_Fk.complete=true;
	_Fk._Hb1=false;
	_Fk.name="";
	_Fk._59=_Fk.getContext('2d');
	_Z81(_Fk._59);
	var _C3=new _Ak();
	_Fk._Ib1=_C3;
	_C3.x=0;
	_C3.y=0;
	_C3.w=_eh;
	_C3.h=_fh;
	_C3.XOffset=0;
	_C3.YOffset=0;
	_C3.CropWidth=_C3.w;
	_C3.CropHeight=_C3.h;
	_C3.ow=_C3.w;
	_C3.oh=_C3.h;
	if(_Gb1!=undefined)
	{
		_vk.Set(_Gb1,_Fk);
		_C3.tp=_Gb1;
	}
	else 
	{
		_C3.tp=_vk._ce(_Fk);
	}
	_C3.texture=_Fk;
	_C3._t7=[];
	_C3._u7=0;
	_C3._v7=4;
	_C3._Jb1=0;
	_C3._ul=null;
	_C3._X81=_Fk;
	return _C3.tp;
}

function surface_create_ext(_O2,_eh,_fh,_A71)
{
	_O2=yyGetString(_O2);
	_eh=yyGetInt32(_eh);
	_fh=yyGetInt32(_fh);
	var _Fk=document.getElementById(_O2);
	if(!_Fk)
	{
		_Ou("Can not find pre-created canvas element: "+_O2);
		return surface_create(_eh,_fh,_A71);
	}
	_Fk.name=_O2;
	_Fk._xb=_Fk.width=_eh;
	_Fk._yb=_Fk.height=_fh;
	_Fk.complete=true;
	_Fk._Hb1=true;
	_Fk._59=_Fk.getContext('2d');
	_Z81(_Fk._59);
	_Fk.onmousemove=_Ul;
	_Fk.onmousedown=_Kb1;
	_Fk.onmouseup=_Lb1;
	var _C3=new _Ak();
	_Fk._Ib1=_C3;
	_C3.x=0;
	_C3.y=0;
	_C3.w=_eh;
	_C3.h=_fh;
	_C3.XOffset=0;
	_C3.YOffset=0;
	_C3.CropWidth=_C3.w;
	_C3.CropHeight=_C3.h;
	_C3.ow=_C3.w;
	_C3.oh=_C3.h;
	_C3.tp=_vk._ce(_Fk);
	_C3.texture=_Fk;
	_C3._t7=[];
	_C3._u7=0;
	_C3._v7=4;
	_C3._Jb1=0;
	_C3._ul=null;
	_C3._X81=_Fk;
	return _C3.tp;
}
var surface_free=_Mb1;

function _Mb1(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	if(_Qe<0)
	{
		return;
	}
	if(!surface_exists(_Qe))
	{
		return 0;
	}
	if(_yb1(_Qe))
	{
		_sg("Error: Surface in use via surface_set_target(). It can not be freed until it has been removed from the surface stack.");
		return;
	}
	_vk._lh(_Qe);
}

function surface_exists(_Qe)
{
	if(_vk._F4(yyGetInt32(_Qe))!=null)return 1;
	else return 0;
}

function surface_get_width(_Qe)
{
	if(_Qe==_ub1)
	{
		return _Nb1;
	}
	var _Fk=_vk._F4(yyGetInt32(_Qe));
	if(_Fk!=null)
	{
		return _Fk._xb;
	}
	return 0;
}

function surface_get_height(_Qe)
{
	if(_Qe==_ub1)
	{
		return _Ob1;
	}
	var _Fk=_vk._F4(yyGetInt32(_Qe));
	if(_Fk!=null)
	{
		return _Fk._yb;
	}
	return 0;
}

function surface_get_texture(_Qe)
{
	var _Fk=_vk._F4(yyGetInt32(_Qe));
	if(_Fk!=null)
	{
		return(
		{
			_fb:_Fk.texture,_gb:_Fk._Ib1		}
		);
	}
	return -1;
}

function surface_get_texture_depth(_Qe)
{
	var _Fk=_vk._F4(yyGetInt32(_Qe));
	if(_Fk!=null&&_Ab1)
	{
		return(
		{
			_fb:_Fk._Db1,_gb:_Fk._Ib1		}
		);
	}
	return -1;
}

function _yb1(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	if(_Pb1==_Qe||_Qb1==_Qe)
	{
		return true;
	}
	for(var i=_Rb1.length-1;i>=0;--i)
	{
		if(_Rb1[i]==_Qe||_Sb1[i]==_Qe)
		{
			return true;
		}
	}
	return false;
}
var _Tb1=_Ub1;

function _Ub1(_Qe,_Vb1)
{
	_Qe=yyGetInt32(_Qe);
	_Vb1=(_Vb1!==undefined&&yyGetInt32(_Vb1)>=0)?yyGetInt32(_Vb1):_Qe;
	var _Fk=_vk._F4(_Qe);
	var _Wb1=_vk._F4(_Vb1);
	if(_Fk!=null&&_Wb1!=null)
	{
		if(!_i7)_sB();
		_sb1.push(
		{
			_Xb1:_Yb1,_Zb1:__b1,_0c1:_Yp,_1c1:_59,_2c1:_CD,_3c1:_DD,_4c1:_AD,_5c1:_BD,_6c1:_vB,_7c1:_wB,_8c1:_xB,_9c1:_yB,		}
		);
		_Rb1.push(_Pb1);
		_Sb1.push(_Qb1);
		_Pb1=_Qe;
		_Qb1=_Vb1;
		if(_i7)
		{
			_Yb1=_Fk._Xb1;
			__b1=_Ab1?_Wb1._Db1._R7._ac1:_Wb1._Bb1._Cb1;
			_i7._bc1(_Yb1,__b1);
			_Yp=-1;
		}
		else 
		{
			g_CurrentGraphics=_Fk._59;
			_59=_Fk._59;
			_cc1(_59);
		}
	}
}
var surface_set_target=_dc1;

function _dc1(_Qe,_Vb1)
{
	_Qe=yyGetInt32(_Qe);
	_Vb1=(_Vb1!==undefined&&yyGetInt32(_Vb1)>=0)?yyGetInt32(_Vb1):_Qe;
	var _Fk=_vk._F4(_Qe);
	var _Wb1=_vk._F4(_Vb1);
	if(_Fk==null||_Wb1==null)
	{
		return false;
	}
	if(!_i7)_sB();
	var _ec1=_fc1._gc1();
	if(_ec1!=null)
	{
		_sb1.push(
		{
			_Xb1:_Yb1,_Zb1:__b1,_0c1:_Yp,_6c1:_vB,_7c1:_wB,_8c1:_xB,_9c1:_yB,_2c1:_CD,_3c1:_DD,_4c1:_AD,_5c1:_BD,_1c1:_59,_hc1:true,_ic1:_ec1._jc1,_kc1:_ec1._lc1,_mc1:_ec1._nc1,_oc1:_ec1._pc1,_qc1:_ec1._rc1,_sc1:new _Gp(_ec1._tc1),_uc1:new _Gp(_ec1._vc1),		}
		);
	}
	else 
	{
		_sb1.push(
		{
			_Xb1:_Yb1,_Zb1:__b1,_0c1:_Yp,_6c1:_vB,_7c1:_wB,_8c1:_xB,_9c1:_yB,_2c1:_CD,_3c1:_DD,_4c1:_AD,_5c1:_BD,_1c1:_59,_hc1:false,		}
		);
	}
	_Rb1.push(_Pb1);
	_Sb1.push(_Qb1);
	_Pb1=_Qe;
	_Qb1=_Vb1;
	if(_i7)
	{
		_Yb1=_Fk._Xb1;
		__b1=_Ab1?_Wb1._Db1._R7._ac1:_Wb1._Bb1._Cb1;
		_i7._bc1(_Yb1,__b1);
		_Yp=-1;
	}
	else 
	{
		g_CurrentGraphics=_Fk._59;
		_59=_Fk._59;
		_cc1(_59);
	}
	_wc1(0,0,_Fk._xb,_Fk._yb);
	_xc1(0,0,_Fk._xb,_Fk._yb,0);
	if(_i7)_i7._yc1();
	_ND();
	if(!_i7)
	{
		_cc1(_59);
	}
	return true;
}

function surface_get_target()
{
	return _Pb1;
}

function surface_get_target_depth()
{
	return _Qb1;
}
var surface_reset_target=_zc1;

function _zc1()
{
	var _Ac1=_sb1.pop();
	if(_Ac1)
	{
		_vB=_Ac1._6c1;
		_wB=_Ac1._7c1;
		_xB=_Ac1._8c1;
		_yB=_Ac1._9c1;
		_CD=_Ac1._2c1;
		_DD=_Ac1._3c1;
		_AD=_Ac1._4c1;
		_BD=_Ac1._5c1;
		var _Bc1=_Ac1._hc1;
		var _ic1,_kc1,_mc1,_oc1,_qc1,_sc1,_uc1;
		if(_Bc1==true)
		{
			_ic1=_Ac1._ic1;
			_kc1=_Ac1._kc1;
			_mc1=_Ac1._mc1;
			_oc1=_Ac1._oc1;
			_qc1=_Ac1._qc1;
			_sc1=_Ac1._sc1;
			_uc1=_Ac1._uc1;
		}
		if(!_i7)
		{
			_59=_Ac1._1c1;
			_zB();
		}
		else 
		{
			_Yp=_Ac1._0c1;
			_Yb1=_Ac1._Xb1;
			__b1=_Ac1._Zb1;
		}
		if(_jB&&_sb1.length==0)
		{
			_wc1(0,0,_Cc1,_Dc1);
			_Ec1._Xp(_Cc1,-_Dc1*_Yp,1.0,32000.0);
			_kB();
		}
		else 
		{
			_wc1(_vB,_wB,_xB,_yB);
			var _ec1=_fc1._gc1();
			if((_Bc1==true)&&(_ec1!=null))
			{
				_Fc1(_ic1,_kc1,_mc1,_oc1,_qc1,_ec1);
				_ec1._Gc1(new _Gp(_sc1));
				_ec1._Hc1(new _Gp(_uc1));
				_ec1._Ic1();
			}
			else 
			{
				_xc1(_CD,_DD,_AD,_BD,0);
			}
		}
	}
	else 
	{
		_I3("surface_reset_target : Surface stacking error detected");
	}
	if(_i7)_i7._bc1(_Yb1,__b1);
	_Pb1=_Rb1.pop();
	if(_Pb1==null)_Pb1=-1;
	_Qb1=_Sb1.pop();
	if(_Qb1==null)_Qb1=-1;
	if(!_i7)_cc1(_59);
	_ND();
}

function _8C(_oj,_r4,_s4)
{
	var data=null;
	var _wk=_oj.getContext('2d');
	try
	{
		data=_wk._Jc1(_r4,_s4,1,1);
	}
	catch(_5i)
	{
		return 0xff000000;
	}
	var _Kc1=data.data;
	var index=0;
	var _Lc1=_Kc1[index]&0xff;
	var _Mc1=_Kc1[index+1]&0xff;
	var _Nc1=_Kc1[index+2]&0xff;
	var _Oc1=_Kc1[index+3]&0xff;
	return(_Lc1|(_Mc1<<8)|(_Nc1<<16)|(_Oc1<<24));
}

function surface_getpixel()
{
}

function surface_getpixel_ext()
{
}

function _Pc1(_Qe,_r4,_s4)
{
	var _Fk=_vk._F4(yyGetInt32(_Qe));
	if(_Fk!=null)
	{
		return _8C(_Fk,yyGetInt32(_r4),yyGetInt32(_s4));
	}
	return 0x00000000;
}
compile_if_used(surface_getpixel=(_Qe,_r4,_s4)=>_Pc1(_Qe,_r4,_s4)&0xffffff);
compile_if_used(surface_getpixel_ext=_Pc1);

function _Qc1(_oj,_hw)
{
	var img=canvas.toDataURL();
}

function surface_save(_Qe,_hw)
{
	_Nu("surface_save()");
}

function surface_save_part(_Qe,_hw,_r4,_s4,_eh,_fh)
{
	_Nu("surface_save_part()");
}

function draw_surface()
{
}

function _Rc1(_Qe,_r4,_s4)
{
	var _Fk=_vk._F4(yyGetInt32(_Qe));
	if(!_Fk)return;
	_r4=yyGetReal(_r4);
	_s4=yyGetReal(_s4);
	var alpha=_59.globalAlpha;

		{
		_59.globalAlpha=_lb;
		_59._091(_Fk,_r4,_s4);
	}
	_59.globalAlpha=alpha;
}
compile_if_used(draw_surface=_Rc1);

function draw_surface_stretched(_Qe,_r4,_s4,_eh,_fh)
{
	var _Fk=_vk._F4(yyGetInt32(_Qe));
	if(!_Fk)return;
	_Zk(_Fk._Ib1,yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_eh),yyGetReal(_fh),0xffffff,1.0);
}

function draw_surface_tiled(_Qe,_r4,_s4)
{
	var _Fk=_vk._F4(yyGetInt32(_Qe));
	if(_Fk!=null)
	{
		_0l(_Fk._Ib1,yyGetReal(_r4),yyGetReal(_s4),1,1,true,true,0xffffff,1);
	}
}

function draw_surface_part(_Qe,_2l,_3l,_q7,_r7,_r4,_s4)
{
	var _Fk=_vk._F4(yyGetInt32(_Qe));
	if(!_Fk)return;
	_4l(_Fk._Ib1,yyGetReal(_2l),yyGetReal(_3l),yyGetReal(_q7),yyGetReal(_r7),yyGetReal(_r4),yyGetReal(_s4),1,1,0xffffff,1.0);
}

function draw_surface_ext(_Qe,_r4,_s4,_7l,_8l,_z3,_9l,_y8)
{
	var _Fk=_vk._F4(yyGetInt32(_Qe));
	if(!_Fk)return;
	var c=_ob(yyGetInt32(_9l));
	_al(_Fk._Ib1,0,0,yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_7l),yyGetReal(_8l),(yyGetReal(_z3)*0.0174532925),c,c,c,c,yyGetReal(_y8));
}

function draw_surface_stretched_ext(_Qe,_r4,_s4,_eh,_fh,_9l,_y8)
{
	var _Fk=_vk._F4(yyGetInt32(_Qe));
	if(!_Fk)return;
	var c=_ob(yyGetInt32(_9l));
	_Zk(_Fk._Ib1,yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_eh),yyGetReal(_fh),c,yyGetReal(_y8));
}
var draw_surface_tiled_ext=_Sc1;

function _Sc1(_Qe,_r4,_s4,_7l,_8l,_9l,_y8)
{
	_0b("draw_surface_tiled_ext()");
}

function draw_surface_part_ext(_Qe,_2l,_3l,_q7,_r7,_r4,_s4,_7l,_8l,_9l,_y8)
{
	_Qe=yyGetInt32(_Qe);
	var _Fk=_vk._F4(_Qe);
	if(_Fk!=null)
	{
		var _C3=new _Ak();
		_C3.x=0;
		_C3.y=0;
		_C3.w=_Fk.width;
		_C3.h=_Fk.height;
		_C3.XOffset=0;
		_C3.YOffset=0;
		_C3.CropWidth=_C3.w;
		_C3.CropHeight=_C3.h;
		_C3.ow=_C3.w;
		_C3.oh=_C3.h;
		_C3.tp=_Qe;
		_C3._t7=[];
		_C3._u7=0;
		_C3._v7=4;
		_C3._Jb1=0;
		_C3._ul=null;
		if(!_i7)
		{
			_C3._X81=_Fk;
			_C3.texture=_Fk;
		}
		else 
		{
			_C3._X81=_Fk.texture;
			_C3.texture=_Fk.texture;
		}
		var c=_ob(yyGetInt32(_9l));
		_4l(_C3,yyGetReal(_2l),yyGetReal(_3l),yyGetReal(_q7),yyGetReal(_r7),yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_7l),yyGetReal(_8l),c,yyGetReal(_y8));
	}
}

function draw_surface_general(_Qe,_2l,_3l,_q7,_r7,_r4,_s4,_7l,_8l,_z3,_fl,_gl,_hl,_il,_y8)
{
	_Qe=yyGetInt32(_Qe);
	var _Fk=_vk._F4(_Qe);
	if(_Fk!=null)
	{
		var _C3=new _Ak();
		_C3.x=yyGetReal(_2l);
		_C3.y=yyGetReal(_3l);
		_C3.w=yyGetReal(_q7);
		_C3.h=yyGetReal(_r7);
		_C3.XOffset=0;
		_C3.YOffset=0;
		_C3.CropWidth=_C3.w;
		_C3.CropHeight=_C3.h;
		_C3.ow=_C3.w;
		_C3.oh=_C3.h;
		_C3.tp=_Qe;
		_C3._t7=[];
		_C3._u7=0;
		_C3._v7=4;
		_C3._Jb1=0;
		_C3._ul=null;
		_r4=yyGetReal(_r4);
		_s4=yyGetReal(_s4);
		_7l=yyGetReal(_7l);
		_8l=yyGetReal(_8l);
		_z3=yyGetReal(_z3);
		_y8=yyGetReal(_y8);
		_fl=_ob(yyGetInt32(_fl));
		_gl=_ob(yyGetInt32(_gl));
		_hl=_ob(yyGetInt32(_hl));
		_il=_ob(yyGetInt32(_il));
		if(!_i7)
		{
			_C3._X81=_Fk;
			_C3.texture=_Fk;
			_al(_C3,0,0,_r4,_s4,_7l,_8l,(_z3*0.0174532925),_fl,_gl,_hl,_il,_y8);
		}
		else 
		{
			_C3._X81=_Fk.texture;
			_C3.texture=_Fk.texture;
			_al(_C3,0,0,_r4,_s4,_7l,_8l,(_z3*0.0174532925),_fl,_gl,_hl,_il,_y8);
		}
	}
}

function surface_copy()
{
}
surface_copy=(_Tc1,_r4,_s4,_mh)=>
{
	var _Bi=_vk._F4(yyGetInt32(_Tc1));
	var _Ci=_vk._F4(yyGetInt32(_mh));
	if(_Bi!=null&&_Ci!=null)
	{
		var _wk=_Bi.getContext('2d');
		_wk.save();
		_wk.globalCompositeOperation='copy';
		_wk.drawImage(_Ci,yyGetInt32(_r4),yyGetInt32(_s4));
		_wk.restore();
	}
}
;

function surface_copy_part()
{
}
surface_copy_part=(_Tc1,_r4,_s4,_mh,_x3,_y3,_Uc1,_Vc1)=>
{
	var _Bi=_vk._F4(yyGetInt32(_Tc1));
	var _Ci=_vk._F4(yyGetInt32(_mh));
	if(_Bi!=null&&_Ci!=null)
	{
		_r4=yyGetReal(_r4);
		_s4=yyGetReal(_s4);
		_x3=yyGetReal(_x3);
		_y3=yyGetReal(_y3);
		_Uc1=yyGetReal(_Uc1);
		_Vc1=yyGetReal(_Vc1);
		var _tB=[];
		var _wk=_Bi.getContext('2d');
		_wk.save();
		_tB[0]=1;
		_tB[1]=0;
		_tB[2]=0;
		_tB[3]=1;
		_tB[4]=0;
		_tB[5]=0;
		_wk.setTransform(_tB[0],_tB[1],_tB[2],_tB[3],_tB[4],_tB[5]);
		_wk.beginPath();
		_wk.rect(_r4,_s4,_Uc1,_Vc1);
		_wk.clip();
		_wk.globalCompositeOperation='copy';
		_wk.drawImage(_Ci,_x3,_y3,_Uc1,_Vc1,_r4,_s4,_Uc1,_Vc1);
		_wk.restore();
	}
}
;

function _Wc1(_A71)
{
	switch(_A71)
	{
		case _uk:return true;
		case _Xc1:return true;
		case _Yc1:return true;
		case _Zc1:return true;
		case __c1:return true;
		case _0d1:return true;
		case _1d1:return true;
		case _2d1:return true;
		default :return false;
	}
}

function _3d1(_A71)
{
	if(_i7)
	{
		return _i7._4d1(_A71);
	}
	else 
	{
		if(_A71==_uk)
		{
			return true;
		}
		else 
		{
			return false;
		}
	}
}

function surface_format_is_supported(_A71)
{
	if(_Wc1(_A71)&&_3d1(_A71))
	{
		return true;
	}
	return false;
}

function surface_get_format(_Qe)
{
	var _Fk=_vk._F4(_Qe);
	if(_Fk!=null)
	{
		if(_i7)
		{
			if(_Fk._Bb1._ac1)
			{
				return _Fk._Bb1._ac1._Rb;
			}
		}
		else 
		{
			return _uk;
		}
	}
	return _5d1;
}
/*@constructor */
function _6d1()
{
	this._7d1=[];
	this._8d1=
	{
	}
	;
	this._9d1=
	{
	}
	;
}
;

function _ad1(_vA,_bd1)
{
	var _eA=(((_vA&0xff)<<24)|(_bd1&0xffffff));
	return _eA;
}
;
_6d1.prototype._cd1=
function(_dd1,_ed1)
{
	this._7d1=_dd1.slice();
	for(var i=0;i<_dd1.length;++i)this._8d1[_dd1[i]]=i;
	for(var i=0;i<_ed1.length;++i)
	{
		var _cj=_ed1[i];
		this._9d1[_cj.key]=_cj.ids.slice();
	}
}
;
_6d1.prototype._fd1=
function(_bd1,_vA)
{
	var _eA=_ad1(_vA,_bd1);
	var _gd1=this._9d1[_eA];
	if(_gd1==undefined)return null;
	return _gd1;
}
;
_6d1.prototype._hd1=
function(_bd1,_vA)
{
	var _id1=this._fd1(_bd1,_vA);
	var tags=[];
	if(_id1!=null)
	{
		for(var i=0;i<_id1.length;++i)
		{
			var _3g=this._7d1[_id1[i]];
			if(_3g!==undefined)tags.push(_3g);
		}
	}
	return tags;
}
;
_6d1.prototype._jd1=
function(_kd1,_ld1)
{
	var _id1=[];
	var _md1=Array.isArray(_kd1)?_kd1:[_kd1];
	for(var i=0;i<_md1.length;++i)
	{
		var _nd1=_md1[i];
		var _od1=this._8d1[_nd1];
		if(_od1===undefined&&_ld1)
		{
			_od1=this._7d1.length;
			this._8d1[_nd1]=_od1;
			this._7d1.push(_nd1);
		}
		if(_od1!==undefined)_id1.push(_od1);
	}
	return _id1;
}
;
_6d1.prototype._pd1=
function(_bd1,_vA,_qd1,_rd1)
{
	var _sd1=this._fd1(_bd1,_vA);
	if(_sd1==null)return false;
	var _td1=this._jd1(_qd1,false);
	if(_td1.length==0)return false;
	for(var _K5=0;_K5<_td1.length;
++_K5)
	{
		var _ud1=false;
		var _3g=_td1[_K5];
		for(var i=0;i<_sd1.length;++i)
		{
			if(_sd1[i]===_3g)_ud1=true;
		}
		if(!_rd1&&_ud1)return true;
		if(_rd1&&!_ud1)return false;
	}
	var result=(_rd1)?true:false;
	return result;
}
;
_6d1.prototype._vd1=
function(_bd1,_vA,_qd1)
{
	var _wd1=false;
	var _eA=_ad1(_vA,_bd1);
	var _gd1=this._9d1[_eA];
	if(_gd1==undefined)
	{
		_gd1=[];
		this._9d1[_eA]=_gd1;
	}
	var _xd1=this._jd1(_qd1,true);
	for(var i=0;i<_xd1.length;++i)
	{
		var _yd1=_xd1[i];
		var index=_gd1.indexOf(_yd1);
		if(index==-1)
		{
			_gd1.push(_yd1);
			_wd1=true;
		}
	}
	return _wd1;
}
;
_6d1.prototype._zd1=
function(_bd1,_vA,_qd1)
{
	var _Ad1=false;
	var _id1=this._fd1(_bd1,_vA);
	if(_id1!=null)
	{
		var _Bd1=this._jd1(_qd1,false);
		for(var i=0;i<_Bd1.length;++i)
		{
			var _Cd1=_Bd1[i];
			var index=_id1.indexOf(_Cd1);
			if(index!=-1)
			{
				_id1[index]=_id1[_id1.length-1];
				_id1.length-=1;
				_Ad1=true;
			}
		}
	}
	return _Ad1;
}
;
_6d1.prototype._Dd1=
function(_bd1,_vA)
{
	var _eA=_ad1(_vA,_bd1);
	var _gd1=this._9d1[_eA];
	if(_gd1!=null)
	{
		_gd1.length=0;
		return true;
	}
	return false;
}
;
_6d1.prototype._Ed1=
function(_qd1)
{
	var _Fd1=[];
	var _xd1=this._jd1(_qd1,false);
	if(_xd1.length==0)return _Fd1;
	for(var key in this._9d1)
	{
		if(!this._9d1.hasOwnProperty(key))continue;
		var _Gd1=this._9d1[key];
		for(var _K5=0;_K5<_xd1.length;++_K5)
		{
			var index=_Gd1.indexOf(_xd1[_K5]);
			if(index!=-1)
			{
				var _Hd1=key&0xffffff;
				var _Id1=(key>>24)&0xff;
				var _Jd1=_uA(_Hd1,_Id1);
				if(_Jd1.length>0)
				{
					_Fd1.push(_Jd1);
					break;
				}
			}
		}
	}
	return _Fd1;
}
;
_6d1.prototype._Kd1=
function(_qd1,_vA)
{
	var _Ld1=[];
	var _xd1=this._jd1(_qd1,false);
	if(_xd1.length==0)return _Ld1;
	for(var key in this._9d1)
	{
		if(_vA>=0)
		{
			var type=(key>>24)&0xff;
			if(type!==_vA)continue;
		}
		var _Gd1=this._9d1[key];
		for(var _K5=0;_K5<_xd1.length;++_K5)
		{
			var index=_Gd1.indexOf(_xd1[_K5]);
			if(index!=-1)
			{
				var _Hd1=key&0xffffff;
				_Ld1.push(_Hd1);
				break;
			}
		}
	}
	return _Ld1;
}
;

function _Md1(_Nd1,_vA,_Od1)
{
	var _eA=
	{
		type:-1,id:-1	}
	;
	if(typeof _Nd1==="string")
	{
		_eA=_dA(_Nd1);
	}
	else 
	{
		if(_vA===undefined)_I3(_Od1+"() - asset type argument is required");
		else _eA=
		{
			type:_vA,id:_Nd1		}
		;
	}
	return _eA;
}

function tag_get_asset_ids(_kd1,_vA)
{
	var _Ld1=_Pd1._Kd1(_kd1,_vA);
	return _Ld1;
}

function tag_get_assets(_kd1)
{
	var _Fd1=_Pd1._Ed1(_kd1);
	return _Fd1;
}

function asset_get_tags(_Nd1,_vA)
{
	var result=[];
	var _eA=_Md1(_Nd1,_vA,"asset_get_tags");
	if(_eA.id<0)return result;
	result=_Pd1._hd1(_eA.id,_eA.type);
	return result;
}

function asset_add_tags(_Nd1,_kd1,_vA)
{
	var _eA=_Md1(_Nd1,_vA,"asset_add_tags");
	if(_eA.id<0)return 0;
	var result=_Pd1._vd1(_eA.id,_eA.type,_kd1);
	return(result)?1:0;
}

function asset_remove_tags(_Nd1,_kd1,_vA)
{
	var _eA=_Md1(_Nd1,_vA,"asset_remove_tags");
	if(_eA.id<0)return 0;
	var result=_Pd1._zd1(_eA.id,_eA.type,_kd1);
	return(result)?1:0;
}

function asset_has_tags(_Nd1,_kd1,_vA)
{
	var _eA=_Md1(_Nd1,_vA,"asset_has_tags");
	if(_eA.id<0)return 0;
	var result=_Pd1._pd1(_eA.id,_eA.type,_kd1,true);
	return(result)?1:0;
}

function asset_has_any_tag(_Nd1,_kd1,_vA)
{
	var _eA=_Md1(_Nd1,_vA,"asset_has_any_tag");
	if(_eA.id<0)return 0;
	var result=_Pd1._pd1(_eA.id,_eA.type,_kd1,false);
	return(result)?1:0;
}

function asset_clear_tags(_Nd1,_vA)
{
	var _eA=_Md1(_Nd1,_vA,"asset_clear_tags");
	if(_eA.id<0)return 0;
	var result=_Pd1._Dd1(_eA.id,_eA.type);
	return(result)?1:0;
}

function _Qd1(image_index,_Rd1)
{
	var _Sd1=Math.floor(image_index)%_Rd1;
	if(_Sd1<0)_Sd1=_Sd1+_Rd1;
	return _Sd1;
}

function draw_self(_g6)
{
	var index;
	index=_g6.sprite_index;
	_e5=_g6;

		{
		var _CF=_E4._F4(index);
		if(_CF!=null)
		{
			var image_index=_Qd1(_g6.image_index+_g6._TC,_g6._Td1());
			_g6._TC=0;
			_CF._58(image_index,_g6.x,_g6.y,_g6.image_xscale,_g6.image_yscale,_g6.image_angle,_g6.image_blend,_g6.image_alpha);
		}
	}
	_e5=null;
}

function draw_sprite_ext(_6m,_r2,_Ud1,_r4,_s4,_7l,_8l,_z3,_ec,_y8)
{
	_Ud1=yyGetReal(_Ud1);
	_y8=yyGetReal(_y8);
	if(_Ud1<0)if(_6m instanceof _MG)_Ud1=_6m.image_index;
	var _1w=_E4._F4(_r2);
	if(_1w!=null)
	{
		_y8=min(1.0,_y8);
		var _Vd1=_E4._Wd1(_r2);
		var image_index=_Qd1(_Ud1,_Vd1);
		_1w._58(image_index,yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_7l),yyGetReal(_8l),yyGetReal(_z3),_ob(yyGetInt32(_ec)),_y8);
	}
}

function draw_sprite(_6m,_r2,_Ud1,_r4,_s4)
{
	_Ud1=yyGetReal(_Ud1);
	if(_Ud1<0)if(_6m instanceof _MG)_Ud1=_6m.image_index;
	var _1w=_E4._F4(_r2);
	if(_1w!=null)
	{
		var _Vd1=_E4._Wd1(_r2);
		var image_index=_Qd1(_Ud1,_Vd1);
		_1w._Xd1(image_index,yyGetReal(_r4),yyGetReal(_s4),_lb);
	}
}

function draw_sprite_pos(_6m,_r2,_Ud1,_X5,_Y5,_p5,_q5,_8n,_9n,_Yd1,_Zd1,_y8)
{
	_Ud1=yyGetReal(_Ud1);
	_y8=yyGetReal(_y8);
	if(_Ud1<0)if(_6m instanceof _MG)_Ud1=_6m.image_index;
	var _1w=_E4._F4(_r2);
	if(_1w!=null)
	{
		var _Vd1=_E4._Wd1(_r2);
		var image_index=_Qd1(_Ud1,_Vd1);
		_y8=min(1.0,_y8);
		_1w.__d1(image_index,yyGetReal(_X5),yyGetReal(_Y5),yyGetReal(_p5),yyGetReal(_q5),yyGetReal(_8n),yyGetReal(_9n),yyGetReal(_Yd1),yyGetReal(_Zd1),_y8);
	}
}

function draw_sprite_stretched(_6m,_r2,_Ud1,_r4,_s4,_eh,_fh)
{
	_Ud1=yyGetReal(_Ud1);
	if(_Ud1<0)if(_6m instanceof _MG)_Ud1=_6m.image_index;
	var _1w=_E4._F4(_r2);
	if(_1w!=null)
	{
		if(_1w._F5<=0)return;
		var _Vd1=_E4._Wd1(_r2);
		var image_index=_Qd1(_Ud1,_Vd1);
		if((_1w._X91!=null)&&(_1w._X91.enabled==true))
		{
			_1w._X91._58(yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_eh),yyGetReal(_fh),0,0xffffff,_lb,image_index,_1w,true);
		}
		else 
		{
			_Zk(_1w._D3[image_index],yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_eh),yyGetReal(_fh),0xffffff,_lb);
		}
	}
}

function draw_sprite_stretched_ext(_6m,_r2,_Ud1,_r4,_s4,_eh,_fh,_nb,_y8)
{
	_Ud1=yyGetReal(_Ud1);
	if(_Ud1<0)if(_6m instanceof _MG)_Ud1=_6m.image_index;
	var _1w=_E4._F4(_r2);
	if(_1w!=null)
	{
		if(_1w._F5<=0)return;
		var _Vd1=_E4._Wd1(_r2);
		var image_index=_Qd1(_Ud1,_Vd1);
		if((_1w._X91!=null)&&(_1w._X91.enabled==true))
		{
			_1w._X91._58(yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_eh),yyGetReal(_fh),0,_ob(yyGetInt32(_nb)),yyGetReal(_y8),image_index,_1w,true);
		}
		else 
		{
			_Zk(_1w._D3[image_index],yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_eh),yyGetReal(_fh),_ob(yyGetInt32(_nb)),yyGetReal(_y8));
		}
	}
}

function draw_sprite_part(_6m,_r2,_Ud1,_2l,_3l,_q7,_r7,_r4,_s4)
{
	_Ud1=yyGetReal(_Ud1);
	if(_Ud1<0)if(_6m instanceof _MG)_Ud1=_6m.image_index;
	var _1w=_E4._F4(_r2);
	if(_1w!=null)
	{
		if(_1w._F5<=0)return;
		var _Vd1=_E4._Wd1(_r2);
		var image_index=_Qd1(_Ud1,_Vd1);
		_4l(_1w._D3[image_index],yyGetReal(_2l),yyGetReal(_3l),yyGetReal(_q7),yyGetReal(_r7),yyGetReal(_r4),yyGetReal(_s4),1,1,0xffffff,_lb);
	}
}

function draw_sprite_part_ext(_6m,_r2,_Ud1,_2l,_3l,_q7,_r7,_r4,_s4,_7l,_8l,_9l,_y8)
{
	_Ud1=yyGetReal(_Ud1);
	if(_Ud1<0)if(_6m instanceof _MG)_Ud1=_6m.image_index;
	var _1w=_E4._F4(_r2);
	if(_1w!=null)
	{
		if(_1w._F5<=0)return;
		var _Vd1=_E4._Wd1(_r2);
		var image_index=_Qd1(_Ud1,_Vd1);
		_9l=_ob(yyGetInt32(_9l));
		_4l(_1w._D3[image_index],yyGetReal(_2l),yyGetReal(_3l),yyGetReal(_q7),yyGetReal(_r7),yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_7l),yyGetReal(_8l),_9l,yyGetReal(_y8));
	}
}

function draw_sprite_tiled(_6m,_r2,_Ud1,_r4,_s4)
{
	_Ud1=yyGetReal(_Ud1);
	if(_Ud1<0)if(_6m instanceof _MG)_Ud1=_6m.image_index;
	var _1w=_E4._F4(_r2);
	if(_1w!=null)
	{
		if(_1w._F5<=0)return;
		var _Vd1=_E4._Wd1(_r2);
		var image_index=_Qd1(_Ud1,_Vd1);
		_0l(_1w._D3[image_index],yyGetReal(_r4),yyGetReal(_s4),1,1,true,true,0xffffff,_lb);
	}
}

function draw_sprite_tiled_ext(_6m,_r2,_Ud1,_r4,_s4,_7l,_8l,_9l,_y8)
{
	_Ud1=yyGetReal(_Ud1);
	if(_Ud1<0)if(_6m instanceof _MG)_Ud1=_6m.image_index;
	var _1w=_E4._F4(_r2);
	if(_1w!=null)
	{
		if(_1w._F5<=0)return;
		var _Vd1=_E4._Wd1(_r2);
		var image_index=_Qd1(_Ud1,_Vd1);
		_9l=_ob(yyGetInt32(_9l));
		_0l(_1w._D3[image_index],yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_7l),yyGetReal(_8l),true,true,_9l,_y8);
	}
}

function draw_sprite_general(_6m,_r2,_Ud1,_2l,_3l,_q7,_r7,_r4,_s4,_7l,_8l,_z3,_fl,_gl,_hl,_il,_y8)
{
	_Ud1=yyGetReal(_Ud1);
	if(_Ud1<0)if(_6m instanceof _MG)_Ud1=_6m.image_index;
	var _1w=_E4._F4(_r2);
	if(_1w!=null)
	{
		if(_OD)
		{
			_PD();
		}
		if(_1w._F5<=0)return;
		var _Vd1=_E4._Wd1(_r2);
		var image_index=_Qd1(_Ud1,_Vd1);
		_fl=_ob(yyGetInt32(_fl));
		_gl=_ob(yyGetInt32(_gl));
		_hl=_ob(yyGetInt32(_hl));
		_il=_ob(yyGetInt32(_il));
		_jl(_1w._D3[image_index],yyGetReal(_2l),yyGetReal(_3l),yyGetReal(_q7),yyGetReal(_r7),yyGetReal(_r4),yyGetReal(_s4),yyGetReal(_7l),yyGetReal(_8l),yyGetReal(_z3)*Math.PI/180.0,_fl,_gl,_hl,_il,yyGetReal(_y8));
	}
}

function _0e1(_Qe)
{
	console.error("Error: Index %d does not correspond to an existing time source\n",_Qe);
}

function _1e1()
{
	console.error("Error: Cannot reset a built-in time source\n");
}

function _2e1()
{
	console.error("Error: Cannot change the state of a stateless built-in time source\n");
}

function _3e1()
{
	console.error("Error: Failed to create the time source\n");
}

function _4e1(_Qe)
{
	console.error("Error: Cannot destroy the time source (index %d) until its children have been destroyed\n",_Qe);
}

function _5e1()
{
	console.error("Error: Cannot destroy a built-in time source\n");
}

function _6e1()
{
	console.error("Error: Cannot stop a built-in time source\n");
}

function _7e1(_8e1)
{
	const type=_8e1._9e1();
	return(type==_ae1||type==_be1);
}

function _ce1(_8e1)
{
	return(_8e1._9e1()==_ae1);
}

function _de1(_8e1)
{
	const type=_8e1._9e1();
	return(type==_ee1||type==_ae1);
}

function _fe1(id)
{
	const _ge1=_he1.get(id);
	if(_ge1===undefined)return null;
	return _ge1;
}

function _ie1(id,_ge1)
{
	_he1.set(id,_ge1);
}

function _je1(id)
{
	const _ge1=_fe1(id);
	if(_ge1===null)
	{
		return;
	}
	const _ke1=_ge1._le1();
	_ke1.forEach(_me1=>_je1(_me1._ne1()));
	if(id===_oe1||id===_pe1)
	{
		return;
	}
	_he1.delete(id);
}

function time_source_create(_qe1,_re1,_se1,_te1,_ue1=[],_ve1=1,_we1=_xe1)
{
	const parent=yyGetInt32(_qe1);
	const _ye1=yyGetReal(_re1);
	const _ze1=yyGetInt32(_se1);
	const _Ae1=_te1;
	const _Di=_ue1;
	const _Be1=yyGetInt64(_ve1);
	const _Ce1=yyGetInt32(_we1);
	return _De1(parent,_ye1,_ze1,_Ae1,_Di,_Be1,_Ce1);
}

function _De1(_qe1,_re1,_se1,_te1,_ue1,_ve1,_we1)
{
	const parent=_fe1(_qe1);
	if(parent!=null)
	{
		const _ge1=parent._Ee1(_re1,_se1,_te1,_ue1,_ve1,_we1);
		if(_ge1!=null)
		{
			const id=_ge1._ne1();
			_ie1(id,_ge1);
			return id;
		}
		_3e1();
	}
	else 
	{
		_0e1(_qe1);
	}
	return -1;
}

function time_source_destroy(_Qe,_Fe1=false)
{
	const id=yyGetInt32(_Qe);
	const _Ge1=yyGetBool(_Fe1);
	if(_Ge1)
	{
		_He1(id);
	}
	else 
	{
		_Ie1(id);
	}
}

function _Ie1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_7e1(_ge1))
		{
			if(_ge1._Je1()==0)
			{
				_je1(_Qe);
				if(_ge1._Ke1())
				{
					return _ge1._Le1(false);
				}
				return _ge1._Me1()._Ne1(_ge1);
			}
			return _4e1(_Qe);
		}
		return _5e1();
	}
	_0e1(_Qe);
}

function _He1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		_je1(_Qe);
		if(_ge1._Oe1())
		{
			return _ge1._Le1(true);
		}
		else 
		{
			return _ge1._Me1()._Ne1(_ge1);
		}
	}
	_0e1(_Qe);
}

function time_source_start(_Qe)
{
	const id=yyGetInt32(_Qe);
	_Pe1(id);
}

function _Pe1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_de1(_ge1))
		{
			return _ge1._Qe1();
		}
		return _2e1();
	}
	_0e1(_Qe);
}

function time_source_stop(_Qe)
{
	const id=yyGetInt32(_Qe);
	_Re1(id);
}

function _Re1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_7e1(_ge1))
		{
			return _ge1._k81();
		}
		return _6e1();
	}
	_0e1(_Qe);
}

function time_source_pause(_Qe)
{
	const id=yyGetInt32(_Qe);
	_Se1(id);
}

function _Se1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_de1(_ge1))
		{
			return _ge1._XA();
		}
		return _2e1();
	}
	_0e1(_Qe);
}

function time_source_resume(_Qe)
{
	const id=yyGetInt32(_Qe);
	_Te1(id);
}

function _Te1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_de1(_ge1))
		{
			return _ge1._yX();
		}
		return _2e1();
	}
	_0e1(_Qe);
}

function time_source_reset(_Qe)
{
	const id=yyGetInt32(_Qe);
	_Ue1(id);
}

function _Ue1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_7e1(_ge1))
		{
			return _ge1._WA();
		}
		return _1e1();
	}
	_0e1(_Qe);
}

function time_source_reconfigure(_Qe,_re1,_se1,_te1,_ue1=[],_ve1=1,_we1=_xe1)
{
	const id=yyGetInt32(_Qe);
	const _ye1=yyGetReal(_re1);
	const _ze1=yyGetInt32(_se1);
	const _Ae1=_te1;
	const _Di=_ue1;
	const _Be1=yyGetInt64(_ve1);
	const _Ce1=yyGetInt32(_we1);
	return _Ve1(id,_ye1,_ze1,_Ae1,_Di,_Be1,_Ce1);
}

function _Ve1(_Qe,_re1,_se1,_te1,_ue1,_ve1,_we1)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_7e1(_ge1))
		{
			return _ge1._We1(_re1,_se1,_te1,_ue1,_ve1,_we1);
		}
		return _1e1();
	}
	_0e1(_Qe);
}

function time_source_get_period(_Qe)
{
	const id=yyGetInt32(_Qe);
	return _Xe1(id);
}

function _Xe1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_7e1(_ge1))
		{
			return _ge1._Ye1();
		}
	}
	else 
	{
		_0e1(_Qe);
	}
	return undefined;
}

function time_source_get_reps_completed(_Qe)
{
	const id=yyGetInt32(_Qe);
	return _Ze1(id);
}

function _Ze1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_7e1(_ge1))
		{
			return _ge1.__e1();
		}
	}
	else 
	{
		_0e1(_Qe);
	}
	return undefined;
}

function time_source_get_reps_remaining(_Qe)
{
	const id=yyGetInt32(_Qe);
	return _0f1(id);
}

function _0f1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_7e1(_ge1))
		{
			return _ge1._1f1();
		}
	}
	else 
	{
		_0e1(_Qe);
	}
	return undefined;
}

function time_source_get_units(_Qe)
{
	const id=yyGetInt32(_Qe);
	return _2f1(id);
}

function _2f1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_7e1(_ge1))
		{
			return _ge1._3f1();
		}
	}
	else 
	{
		_0e1(_Qe);
	}
	return undefined;
}

function time_source_get_time_remaining(_Qe)
{
	const id=yyGetInt32(_Qe);
	return _4f1(id);
}

function _4f1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_7e1(_ge1))
		{
			return _ge1._5f1();
		}
	}
	else 
	{
		_0e1(_Qe);
	}
	return undefined;
}

function time_source_get_state(_Qe)
{
	const id=yyGetInt32(_Qe);
	return _6f1(id);
}

function _6f1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_de1(_ge1))
		{
			return _ge1._7f1();
		}
	}
	else 
	{
		_0e1(_Qe);
	}
	return undefined;
}

function time_source_get_parent(_Qe)
{
	const id=yyGetInt32(_Qe);
	return _8f1(id);
}

function _8f1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		if(_7e1(_ge1))
		{
			return _ge1._9f1()._ne1();
		}
	}
	else 
	{
		_0e1(_Qe);
	}
	return undefined;
}

function time_source_get_children(_Qe)
{
	const id=yyGetInt32(_Qe);
	return _af1(id);
}

function _af1(_Qe)
{
	const _ge1=_fe1(_Qe);
	if(_ge1!=null)
	{
		return _ge1._le1().map(_bf1=>_bf1._ne1());
	}
	_0e1(_Qe);
	return undefined;
}

function time_source_exists(_Qe)
{
	const id=yyGetInt32(_Qe);
	return _cf1(id);
}

function _cf1(_Qe)
{
	return(_fe1(_Qe)!=null);
}

function time_seconds_to_bpm(_df1)
{
	const _Pt=yyGetReal(_df1);
	return _ef1(_Pt);
}

function _ef1(_df1)
{
	if(_df1>0.0)
	{
		return 60.0/_df1;
	}
	return Infinity;
}

function time_bpm_to_seconds(_ff1)
{
	const _gf1=yyGetReal(_ff1);
	return _hf1(_gf1);
}

function _hf1(_ff1)
{
	if(_ff1>0.0)
	{
		return 60.0/_ff1;
	}
	return Infinity;
}

function call_later(_re1,_se1,_te1,_ms=false)
{
	const _ye1=yyGetReal(_re1);
	const _ze1=yyGetInt32(_se1);
	const repeat=yyGetBool(_ms);
	return _if1(_ye1,_ze1,_te1,repeat);
}

function _if1(_re1,_se1,_te1,_ms)
{
	const _ge1=_jf1._kf1(_re1,_se1,_te1,_ms);
	if(_ge1!=null)
	{
		return _ge1._ne1();
	}
	_3e1();
	return -1;
}

function call_cancel(_621)
{
	const _cP=yyGetInt32(_621);
	return _lf1(_cP);
}

function _lf1(_621)
{
	const _ge1=_jf1._mf1(_621);
	if(_ge1!=null)
	{
		if(_7e1(_ge1))
		{
			if(_ge1._Ke1())
			{
				return _ge1._Le1(false);
			}
			return _ge1._Me1()._Ne1(_ge1);
		}
		return _5e1();
	}
	_0e1(_621);
}

function timeline_exists(_u3)
{
	if(_Gy._F4(yyGetInt32(_u3))!=undefined)
	{
		return true;
	}
	return false;
}

function timeline_get_name(_u3)
{
	var _tG=_Gy._F4(yyGetInt32(_u3));
	if(_tG!=undefined)
	{
		return _tG.pName;
	}
	return "";
}

function _nf1(_u3)
{
	return timeline_get_name(_u3);
}

function timeline_add()
{
	return _Gy._of1();
}

function timeline_delete(_u3)
{
	_Gy._Hj(yyGetInt32(_u3));
}

function timeline_clear(_u3)
{
	_Gy._se(yyGetInt32(_u3));
}

function _pf1(_u3,_jb1,_qf1)
{
	_0b("timeline_moment_add()");
}

function timeline_moment_add_script(_u3,_jb1,_tu)
{
	switch(typeof _tu)
	{
		case "number":case "function":var _9P=typeof _tu=="number"?_nu.Scripts[yyGetInt32(_tu)-100000]:_tu;
		_Gy._rf1(yyGetInt32(_u3),yyGetInt32(_jb1),_9P);
		break;
		default :break;
	}
}

function timeline_size(_u3)
{
	var _tG=_Gy._F4(yyGetInt32(_u3));
	var _r3=0;
	if(_tG!=undefined)
	{
		_r3=_tG.Events._u7;
	}
	return _r3;
}

function timeline_max_moment(_u3)
{
	var _tG=_Gy._F4(yyGetInt32(_u3));
	var _r3=0;
	if(_tG!=undefined)
	{
		_r3=_tG._sf1();
	}
	return _r3;
}

function timeline_moment_clear(_u3,_jb1)
{
	_Gy._tf1(yyGetInt32(_u3),yyGetInt32(_jb1));
}

function _uf1(_p01)
{
	_0b("window_set_visible()");
}

function window_handle()
{
	return _bv;
}

function window_device()
{
	if((null!==g_CurrentGraphics._vf1)&&(undefined!==g_CurrentGraphics._vf1))return g_CurrentGraphics._vf1;
	else return g_CurrentGraphics;
}

function _wf1()
{
	return true;
}

function window_set_fullscreen(_xf1)
{
}

function window_get_fullscreen()
{
	return _yf1;
}

function window_set_showborder(_k01)
{
}

function window_get_showborder()
{
	return true;
}

function _zf1(_k01)
{
	_0b("window_set_showicons()");
}

function _Af1()
{
	_0b("window_get_showicons()");
	return false;
}

function _Bf1(_Cf1)
{
	_0b("window_set_stayontop()");
}

function _Df1()
{
	_0b("window_get_stayontop()");
	return false;
}

function _Ef1(_Ff1)
{
	_0b("window_set_sizeable()");
}

function _Gf1()
{
	_0b("window_get_sizeable()");
	return false;
}

function window_set_caption(_Hf1)
{
	document.title=yyGetString(_Hf1);
}

function window_set_min_width(_q7)
{
}

function window_set_max_width(_q7)
{
}

function window_set_min_height(_r7)
{
}

function window_set_max_height(_r7)
{
}

function window_get_caption()
{
	return document.title;
}

function _If1(_521,_Jf1)
{
	if(_521)
	{
		if(_Jf1===undefined)
		{
			canvas.style.cursor="";
		}
		else 
		{
			canvas.style.cursor=_Jf1;
		}
	}
	else 
	{
		canvas.style.cursor="none";
	}
}

function window_set_cursor(_Kf1)
{
	_Kf1=yyGetInt32(_Kf1);
	var _Lf1="";
	switch(_Kf1)
	{
		case cr_default:_Lf1="auto";
		_Kf1=cr_arrow;
		break;
		case cr_none:_Lf1="__disable__";
		break;
		case cr_arrow:_Lf1="auto";
		break;
		case cr_cross:_Lf1="crosshair";
		break;
		case cr_beam:_Lf1="";
		break;
		case cr_size_nesw:_Lf1="ne-resize";
		break;
		case cr_size_ns:_Lf1="n-resize";
		break;
		case cr_size_nwse:_Lf1="nw-resize";
		break;
		case cr_size_we:_Lf1="w-resize";
		break;
		case cr_uparrow:_Lf1="";
		break;
		case cr_hourglass:_Lf1="wait";
		break;
		case cr_drag:_Lf1="move";
		break;
		case _Mf1:_Lf1="";
		break;
		case _Nf1:_Lf1="";
		break;
		case _Of1:_Lf1="";
		break;
		case _Pf1:_Lf1="";
		break;
		case _Qf1:_Lf1="";
		break;
		case _Rf1:_Lf1="";
		break;
		case cr_appstart:_Lf1="";
		break;
		case _Sf1:_Lf1="help";
		break;
		case cr_handpoint:_Lf1="pointer";
		break;
		case cr_size_all:_Lf1="e-resize";
		break;
	}
	;
	if(_Lf1=="__disable__")
	{
		_Tf1=_Kf1;
		_If1(false,"none");
		return;
	}
	else if(_Kf1<0&&_Lf1=="")
	{
		_I3("Cursor type is not supported.");
		_If1(true,_Lf1);
		return;
	}
	else 
	{
		_Tf1=_Kf1;
		_If1(true,_Lf1);
		return;
	}
}

function window_get_cursor()
{
	return _Tf1;
}

function window_set_color(_nb)
{
	_Uf1=_ob(yyGetInt32(_nb));
}
var window_set_colour=window_set_color;

function window_get_color()
{
	return _ob(_Uf1);
}
var window_get_colour=window_get_color;

function _Vf1(_Wl,_Wf1)
{
	_0b("window_set_region_scale()");
}

function _Xf1()
{
	_0b("window_get_region_scale()");
}

function window_set_position(_r4,_s4,_Yf1)
{
	if(_Yf1===undefined)_Yf1=false;
	var _Ql=document.getElementById(_bv);
	for(var _Fj=_Ql;_Fj;_Fj=_Fj.parentNode)
	{
		var position;
		if(_Fj["currentStyle"])
		{
			position=_Fj["currentStyle"]["position"];
		}
		else if(window.getComputedStyle)
		{
			try
			{
				var style=window.getComputedStyle(_Fj,null);
				if(style)
				{
					position=style.getPropertyValue("position");
				}
			}
			catch(e)
			{
			}
		}
		if(position&&(position=="fixed"))
		{
			debug("Warning: Canvas position fixed. Ignoring position alterations");
			return;
		}
	}
	_Ql.style.position="absolute";
	if(!yyGetBool(_Yf1))
	{
		_Ql.style.left=yyGetInt32(_r4)+"px";
		_Ql.style.top=yyGetInt32(_s4)+"px";
		_Ql.style.bottom="";
		_Ql.style.right="";
		_Ql.style.transform="";
	}
	else 
	{
		_Ql.style.top="50%";
		_Ql.style.left="50%";
		_Ql.style.bottom="-50%";
		_Ql.style.right="-50%";
		_Ql.style.transform="translate(-50%, -50%)";
	}
}

function window_set_size(_eh,_fh)
{
	_eh=yyGetInt32(_eh);
	_fh=yyGetInt32(_fh);
	canvas.width=_eh;
	canvas.height=_fh;
	_5C=_eh;
	_7C=_fh;
	_Zf1=canvas.width;
	__f1=canvas.height;
	_He(canvas,_Ie);
	_0g1=_Ie.top;
	_1g1=_Ie.left;
	_2g1=_Ie.right;
	_3g1=_Ie.bottom;
	_4g1=_Zf1;
	_5g1=__f1;
	_Cc1=_eh;
	_Dc1=_fh;
	_6g1=1;
	_7g1=1;
}

function window_set_rectangle(_r4,_s4,_eh,_fh)
{
	window_set_size(yyGetInt32(_eh),yyGetInt32(_fh));
	window_set_position(yyGetInt32(_r4),yyGetInt32(_s4),false);
}

function window_center()
{
	var _8g1=_pB();
	var _nR=_qB();
	var w=window_get_width();
	var h=window_get_height();
	var x=(_8g1-w)/2;
	var y=(_nR-h)/2;
	window_set_position(x,y,true);
}

function _9g1()
{
	_0b("window_default()");
}

function window_get_x()
{
	return _1g1;
}

function window_get_y()
{
	return _0g1;
}

function window_get_width()
{
	return _2g1-_1g1;
}

function window_get_height()
{
	return _3g1-_0g1;
}

function window_get_visible_rects()
{
}

function window_mouse_get_x()
{
	return _1f;
}

function window_mouse_get_y()
{
	return _2f;
}

function window_mouse_set(x,y)
{
	_0b("window_mouse_set()");
}

function window_mouse_set_locked(_Np)
{
	if(_Np)
	{
		var _ag1=canvas.requestPointerLock||canvas.mozRequestPointerLock||canvas.webkitRequestPointerLock||canvas.msRequestPointerLock;
		if(!_ag1)return;
		var _ta=_ag1.call(canvas);
		if(_ta&&_ta.then)_ta.catch(
function()
		{
		}
		);
	}
	else 
	{
		var _bg1=document.exitPointerLock||document.mozExitPointerLock||document.webkitExitPointerLock||document.msExitPointerLock;
		if(!_bg1)return;
		var _ta=_bg1.call(document);
		if(_ta&&_ta.then)_ta.catch(
function()
		{
		}
		);
	}
}

function window_mouse_get_locked()
{
	return _cg1;
}

function window_mouse_get_delta_x()
{
	return _dg1;
}

function window_mouse_get_delta_y()
{
	return _eg1;
}

function window_view_mouse_get_x(_Qe)
{
	if(!_u2._De)
	{
		return g_pBuiltIn.mouse_x;
	}
	var _Ge=_u2._Fe[yyGetInt32(_Qe)];
	return _Ge._Ne(_0f._xH,_0f._yH);
}

function window_view_mouse_get_y(_Qe)
{
	if(!_u2._De)
	{
		return g_pBuiltIn.mouse_y;
	}
	var _Ge=_u2._Fe[yyGetInt32(_Qe)];
	return _Ge._Oe(_0f._xH,_0f._yH);
}

function window_views_mouse_get_x()
{
	if(!_u2._De)
	{
		return g_pBuiltIn.mouse_x;
	}
	for(var i=_u2._Fe.length-1;i>=0;--i)
	{
		var _Ge=_u2._Fe[i];
		if(!_Ge.visible)
		{
			continue;
		}
		var _26=_Ge._Ne(_0f._xH,_0f._yH);
		var _36=_Ge._Oe(_0f._xH,_0f._yH);
		if(((_26>=_Ge._2c1)&&(_26<_Ge._2c1+_Ge._4c1))&&((_36>=_Ge._3c1)&&(_26<_Ge._3c1+_Ge._5c1)))
		{
			return _26;
		}
	}
	return window_view_mouse_get_x(0);
}

function window_views_mouse_get_y()
{
	if(!_u2._De)
	{
		return g_pBuiltIn.mouse_y;
	}
	for(var i=_u2._Fe.length-1;i>=0;--i)
	{
		var _Ge=_u2._Fe[i];
		if(!_Ge.visible)
		{
			continue;
		}
		var _26=_Ge._Ne(_0f._xH,_0f._yH);
		var _36=_Ge._Oe(_0f._xH,_0f._yH);
		if(((_26>=_Ge._2c1)&&(_26<_Ge._2c1+_Ge._4c1))&&((_36>=_Ge._3c1)&&(_26<_Ge._3c1+_Ge._5c1)))
		{
			return _36;
		}
	}
	return window_view_mouse_get_y(0);
}
var _fg1;
var os_win32;
var _gg1;
var os_macosx;
var _hg1;
var os_ios;
var os_android;
var of_challenge_win;
var of_challenge_lose;
var of_challenge_tie;
var leaderboard_type_number;
var leaderboard_type_time_mins_secs;
var _ig1=0;
var _jg1=1,_kg1=2,_lg1=3,_mg1=4,_ng1=5,_og1=6;
var _pg1=aa_1241_kz();

function aa_1241_kz()
{
	return 0x87155211;
}

function _qg1()
{
}

function code_is_compiled()
{
	return true;
}

function _rg1(_521)
{
}

function achievement_available()
{
	return false;
}

function achievement_login()
{
}

function achievement_logout()
{
}

function achievement_login_status()
{
}

function achievement_reset()
{
}

function achievement_show_achievements()
{
}

function achievement_show_leaderboards()
{
}

function achievement_load_friends()
{
}

function achievement_load_leaderboard()
{
}

function achievement_get_pic()
{
}

function achievement_load_progress()
{
}

function achievement_send_challenge()
{
}

function os_get_info()
{
	return -1;
}

function achievement_event()
{
}

function achievement_show()
{
}

function achievement_get_info()
{
}

function os_get_config()
{
	return _sg1;
}

function url_open_full(_cE,_Ol,_kT)
{
	if(_Ol!="_self"&&_Ol!="_blank"&&_Ol!="_parent"&&_Ol!="_top")
	{
		_I3("Error: invalid TARGET specified. Only '_self', '_blank', 'parent' or '_top' supported. (url_open)");
		return;
	}
	var _Hf=window.open(yyGetString(_cE),yyGetString(_Ol),yyGetString(_kT));
}

function url_open_ext(_cE,_Ol)
{
	url_open_full(_cE,_Ol,"scrollbars=yes,menubar=yes,resizable=yes,toolbar=yes,location=yes,status=yes");
}

function url_open(_cE)
{
	url_open_ext(_cE,"_self");
}

function achievement_post_score(_tg1,_ug1)
{
}

function achievement_post(_tg1,_vg1)
{
}

function shop_leave_rating(_Hu,_wg1,_xg1,_Nl)
{
}
var get_timer=typeof performance!=="undefined"&&performance.now?
function()
{
	return performance.now()*1000;
}
:
function()
{
	return new Date().getTime()*1000-_fg1;
}
;

function virtual_key_add(_r4,_s4,_eh,_fh,_yg1)
{
	_r4=yyGetInt32(_r4);
	_s4=yyGetInt32(_s4);
	_eh=yyGetInt32(_eh);
	_fh=yyGetInt32(_fh);
	_yg1=yyGetInt32(_yg1);
	var _zg1=_Ag1();
	_zg1.x=_r4;
	_zg1.y=_s4;
	_zg1.w=_eh;
	_zg1.h=_fh;
	_zg1.key=_yg1;
	_zg1._z5=_r4+_eh;
	_zg1._A5=_s4+_fh;
	_zg1.button=_zg1._Y3=_zg1._Z3=0;
	_zg1._Bg1=_Cg1;
	return(_zg1.index+1);
}

function virtual_key_delete(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	if(_Qe<0)return;
	var index=_Qe-1;
	if((index<0)||(index>=_Dg1.length))
	{
		debug("Invalid index when deleting virtual key");
	}
	_Eg1(_Qe-1);
}

function _Fg1()
{
	_Gg1=[];
	for(var _H5=0;_H5<_Dg1.length;++_H5)
	{
		var _3F=_Dg1[_H5];
		if((_3F._Bg1&_Hg1)!=0)_Gg1[_Gg1.length]=_3F;
	}
}

function virtual_key_show(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	if(_Qe<0)return;
	_Qe--;
	if(!_Dg1[_Qe])return;
	_Dg1[_Qe]._Bg1|=_Hg1;
	_Fg1();
}

function virtual_key_hide(_Qe)
{
	_Qe=yyGetInt32(_Qe);
	if(_Qe<0)return;
	_Qe--;
	if(!_Dg1[_Qe])return;
	_Dg1[_Qe]._Bg1&=~_Hg1;
	_Fg1();
}

function device_get_tilt_x()
{
	return 0;
}

function device_get_tilt_y()
{
	return 0;
}

function device_get_tilt_z()
{
	return 0;
}

function _Ig1()
{
	_Nu("device_ios_get_imagename()");
}

function _Jg1()
{
	_Nu("device_ios_get_image()");
}

function _Kg1()
{
	_Nu("openfeint_start()");
}

function _Lg1(_HO,_iG)
{
	_Nu("achievement_map_achievement()");
}

function _Mg1(_HO,_iG,_QO)
{
	_Nu("achievement_map_leaderboard()");
}

function _Ng1(_HO,_iG,_QO)
{
	_Nu("openfeint_send_challenge()");
}

function _Og1(_HO)
{
	_Nu("openfeint_send_invite()");
}

function _Pg1(_HO,_iG,_QO)
{
	_Nu("openfeint_send_social()");
}

function _Qg1(_HO)
{
	_Nu("openfeint_set_url()");
}

function _Rg1()
{
	_Nu("openfeint_accept_challenge()");
	return "";
}

function _Sg1()
{
	_Nu("achievement_is_online()");
	return false;
}

function _Tg1(_HO,_iG)
{
	_Nu("openfeint_send_result()");
}

function device_is_keypad_open()
{
	return false;
}

function _Ug1()
{
	_fg1=new Date().getTime()*1000;
	var _K5=0;
	for(var i=0;i<12;i++)
	{
		_bt[i]=_K5;
		_K5+=_at[i];
	}
	os_win32=0;
	_gg1=1;
	os_macosx=2;
	_hg1=3;
	os_ios=4;
	os_android=5;
	of_challenge_win=0;
	of_challenge_lose=1;
	of_challenge_tie=2;
	leaderboard_type_number=0;
	leaderboard_type_time_mins_secs=1;
}

function url_get_domain()
{
	return location.hostname;
}

function _Vg1()
{
	if(window.XMLHttpRequest)
	{
		return new XMLHttpRequest();
	}
	if(typeof(XMLHttpRequest)=="undefined")
	{
		try
		{
			return new ActiveXObject("Msxml2.XMLHTTP.6.0");
		}
		catch(e)
		{
		}
		try
		{
			return new ActiveXObject("Msxml2.XMLHTTP.3.0");
		}
		catch(e)
		{
		}
		try
		{
			return new ActiveXObject("Msxml2.XMLHTTP");
		}
		catch(e)
		{
		}
		throw new Error("This browser does not support XMLHttpRequest.");
	}
	return null;
}

function device_mouse_check_button(_Wg1,_3m)
{
	_Wg1=yyGetInt32(_Wg1);
	_3m=yyGetInt32(_3m);
	if(_Wg1==0)
	{
		return mouse_check_button(_3m);
	}
	else 
	{
		if(_Ve[_Wg1]&&(_3m<=1))
		{
			return _Ve[_Wg1]._cd;
		}
	}
	return 0;
}

function device_mouse_check_button_pressed(_Wg1,_3m)
{
	_Wg1=yyGetInt32(_Wg1);
	_3m=yyGetInt32(_3m);
	if(_Wg1==0)
	{
		return mouse_check_button_pressed(_3m);
	}
	else 
	{
		if(_Ve[_Wg1]&&(_3m<=1))
		{
			return _Ve[_Wg1]._7d;
		}
	}
	return 0;
}

function device_mouse_check_button_released(_Wg1,_3m)
{
	_Wg1=yyGetInt32(_Wg1);
	_3m=yyGetInt32(_3m);
	if(_Wg1==0)
	{
		return mouse_check_button_released(_3m);
	}
	else 
	{
		if(_Ve[_Wg1]&&(_3m<=1))
		{
			return _Ve[_Wg1]._bd;
		}
	}
	return 0;
}

function device_mouse_x(_Wg1)
{
	_Wg1=yyGetInt32(_Wg1);
	if(_Wg1==0)
	{
		return g_pBuiltIn.mouse_x;
	}
	else if(_Ve[_Wg1])
	{
		return _Ve[_Wg1].x;
	}
	return 0;
}

function device_mouse_raw_x(_Wg1)
{
	_Wg1=yyGetInt32(_Wg1);
	if(_Xg1[_Wg1])
	{
		return _Xg1[_Wg1].x;
	}
	return 0;
}

function device_mouse_y(_Wg1)
{
	_Wg1=yyGetInt32(_Wg1);
	if(_Wg1==0)
	{
		return g_pBuiltIn.mouse_y;
	}
	else if(_Ve[_Wg1])
	{
		return _Ve[_Wg1].y;
	}
	return 0;
}

function device_mouse_raw_y(_Wg1)
{
	_Wg1=yyGetInt32(_Wg1);
	if(_Xg1[_Wg1])
	{
		return _Xg1[_Wg1].y;
	}
	return 0;
}

function device_mouse_x_to_gui(_Wg1)
{
	_Wg1=yyGetInt32(_Wg1);
	var x=0;
	if(_Wg1==0)
	{
		x=_1f;
	}
	else if(_Xg1[_Wg1])
	{
		x=_Xg1[_Wg1].x;
	}
	_He(canvas,_Ie);
	x-=_Ie.left;
	var _dB=_eB;
	if(_dB<0.0)_dB=window_get_width();
	return ~~(x*(_dB/window_get_width()));
}

function device_mouse_y_to_gui(_Wg1)
{
	_Wg1=yyGetInt32(_Wg1);
	var y=0;
	if(_Wg1==0)
	{
		y=_2f;
	}
	else if(_Xg1[_Wg1])
	{
		y=_Xg1[_Wg1].y;
	}
	_He(canvas,_Ie);
	y-=_Ie.top;
	var _aB=_bB;
	if(_aB<0.0)_aB=window_get_height();
	return ~~(y*(_aB/window_get_height()));
}

function os_is_paused()
{
	return _Yg1;
}

function window_has_focus()
{
	return _Zg1;
}

function ds_exists(_u3,_Ob)
{
	_u3=yyGetInt32(_u3);
	switch(yyGetInt32(_Ob))
	{
		case _jg1:return(_d6._F4(_u3)?1.0:0.0);
		case _kg1:return(_yi._F4(_u3)?1.0:0.0);
		case _lg1:return(_Oj._F4(_u3)?1.0:0.0);
		case _mg1:return(_Nj._F4(_u3)?1.0:0.0);
		case _ng1:return(_kh._F4(_u3)?1.0:0.0);
		case _og1:return(_Aj._F4(_u3)?1.0:0.0);
	}
	return 0;
}
;

function script_exists(_u3)
{
	_u3=yyGetInt32(_u3);
	if(_u3>=100000)_u3-=100000;
	if(_nu.Scripts[yyGetInt32(_u3)]!=undefined)
	{
		return 1;
	}
	return 0;
}

function script_get_name(_u3)
{
	if(typeof _u3=="function")
	{
		var _r3=_u3.name;
		if(_r3.startsWith("bound "))
		{
			_r3=_r3.substr(6);
		}
		if(_nu.ScriptNames.indexOf(_r3)>=0)
		{
			return _r3;
		}
		return "<unknown>";
	}
	else 
	{
		_u3=yyGetInt32(_u3);
		if(_u3>=100000)
		{
			_u3-=100000;
			if((_nu.Scripts[_u3]!=undefined)&&(_nu.ScriptNames[_u3]!=undefined))
			{
				var name=_nu.ScriptNames[_u3];
				if(name.startsWith("gml_Script_"))name=name.substr(11);
				return name;
			}
		}
		else 
		{
			__g1();
			if((_u3>=0)&&(_u3<_0h1.length))
			{
				return _0h1[_u3].name;
			}
		}
	}
	return "<undefined>";
}

function _1h1(_u3)
{
	_u3=yyGetInt32(_u3);
	if(_u3>=100000)
	{
		_u3-=100000;
		if(_nu.Scripts[_u3]!=undefined)
		{
			return _nu.Scripts[_u3];
		}
	}
	else 
	{
		__g1();
		if((_u3>=0)&&(_u3<_0h1.length))
		{
			return _0h1[_u3];
		}
	}
	return null;
}

function script_execute(_2h1,_Cy,_K2)
{
	_9P=undefined;
	if(typeof _K2==="function")
	{
		var _3h1=Array.prototype.slice.call(arguments);
		_3h1[2]=_3h1[1];
		_3h1[1]=_3h1[0];
		return _K2.apply(this,_3h1.slice(1));
	}
	else 
	{
		_K2==yyGetInt32(_K2);
		if(_K2<100000)
		{
			__g1();
			if((_K2>=0)&&(_K2<_0h1.length))
			{
				_9P=_0h1[_K2];
				if(_9P!==undefined)
				{
					var _3h1=Array.prototype.slice.call(arguments);
					return _9P.apply(this,_3h1.slice(3));
				}
			}
		}
		else 
		{
			_K2-=100000;
			_9P=JSON_game.Scripts[_K2];
			if(_9P!==undefined)
			{
				var _3h1=Array.prototype.slice.call(arguments);
				_3h1[2]=_3h1[1];
				_3h1[1]=_3h1[0];
				return _9P.apply(this,_3h1.slice(1));
			}
		}
	}
	return 0;
}
var method_call=script_execute_ext;

function script_execute_ext(_2h1,_Cy,_K2,_dj,_Fc,_q71)
{
	_dj=_dj||[];
	_Fc=_Fc||0;
	_Fc=yyGetInt32(_Fc);
	_q71=_q71||_dj.length-_Fc;
	_q71=yyGetInt32(_q71);
	if(!(_dj instanceof Array))
	{
		_I3("script_execute_ext : argument 2 is not an array")	}
	else 
	{
		var dir=1;
		if(_Fc<0)_Fc=_dj.length+_Fc;
		if(_Fc>=_dj.length)_Fc=_dj.length;
		if(_q71<0)
		{
			dir=-1;
			if((_Fc+_q71)<0)
			{
				_q71=_Fc+1;
			}
			else 
			{
				_q71=-_q71;
			}
		}
		else 
		{
			if((_Fc+_q71)>_dj.length)
			{
				_q71=_dj.length-_Fc;
			}
		}
		var _3h1=[];
		for(var _u5=_Fc,i=0;(i<_q71);++i,_u5+=dir)_3h1.push(_dj[_u5]);
		_9P=undefined;
		if(typeof _K2==="function")
		{
			_3h1.splice(0,0,_2h1,_Cy);
			return _K2.apply(this,_3h1);
		}
		else 
		{
			_K2==yyGetInt32(_K2);
			if(_K2<100000)
			{
				__g1();
				if((_K2>=0)&&(_K2<_0h1.length))
				{
					_9P=_0h1[_K2];
					if(_9P!==undefined)
					{
						return _9P.apply(this,_3h1);
					}
				}
			}
			else 
			{
				_K2-=100000;
				_9P=JSON_game.Scripts[_K2];
				if(_9P!==undefined)
				{
					_3h1.splice(0,0,_2h1,_Cy);
					return _9P.apply(this,_3h1);
				}
			}
		}
	}
	return 0;
}

function gml_release_mode(_Np)
{
	if(yyGetBool(_Np))
	{
		instance_change=_UG;
		yyInst=_4h1;
		compile_if_used(ds_grid_get=_Th);
		compile_if_used(ds_grid_set=_rh);
		compile_if_used(ds_grid_set_pre=_th);
		compile_if_used(ds_grid_set_post=_vh);
	}
	else 
	{
		instance_change=__G;
		yyInst=_5h1;
		compile_if_used(ds_grid_get=_Sh);
		compile_if_used(ds_grid_set=_qh);
		compile_if_used(ds_grid_set_pre=_sh);
		compile_if_used(ds_grid_set_post=_uh);
	}
}

function application_surface_draw_enable(_Np)
{
	_6h1=yyGetBool(_Np);
}

function application_surface_enable(_Np)
{
	if(_7h1)
	{
		_8h1=_Nb1;
		_9h1=_Ob1;
	}
	_7h1=yyGetBool(_Np);
}

function application_surface_is_enabled()
{
	return _7h1;
}

function _ah1()
{
	var _2l=0;
	var _3l=0;
	var _O81=0;
	var _P81=0;
	canvas=document.getElementById(_bv);
	var _bh1=_Zf1;
	var _x71=__f1;
	if(_ch1&&_dh1)
	{
		var w=_Nb1;
		var h=_Ob1;
		var _Oq,_56,_46;
		_Oq=w/h;
		_56=_bh1/_Oq;
		if(_56<_x71)
		{
			_Oq=h/w;
			_56=_bh1*_Oq;
			_3l=(_x71-_56)/2;
			_46=_bh1;
			_56+=_3l;
		}
		else 
		{
			_Oq=w/h;
			_46=_x71*_Oq;
			_2l=(_bh1-_46)/2;
			_56=_x71;
			_46+=_2l;
		}
		_O81=_46;
		_P81=_56;
	}
	else 
	{
		_O81=_bh1;
		_P81=_x71;
	}
	_eh1.x=_2l;
	_eh1.y=_3l;
	_eh1.w=_O81-_2l;
	_eh1.h=_P81-_3l;
}

function application_get_position()
{
	_ah1();
	var _Al=[];
	_Al.push(_eh1.x,_eh1.y,_eh1.x+_eh1.w,_eh1.y+_eh1.h);
	return _Al;
}

function extension_stubfunc_real()
{
	return 0;
}

function extension_stubfunc_string()
{
	return "";
}
(
function()
{
	'use strict';
	Function.prototype._fh1=
function(parent)
	{
		this.prototype.parent=parent;
		for(var x in parent.prototype)
		{
			if(!this.prototype[x])this.prototype[x]=parent.prototype[x];
		}
	}
	;
	Function.prototype._gh1=
function(parent)
	{
		return this._fh1(parent);
	}
	;
	Array.prototype._hh1=
function(first,_Sg,_ih1)
	{
		if(typeof(first)==='undefined')first=0;
		if(typeof(_Sg)==='undefined')_Sg=this.length-first;
		if(typeof(_ih1)==='undefined')_ih1=
function(_i3,_h3)
		{
			return _i3<_h3;
		}
		;
		var left=first,stack=[],_Ri=0;
		for(;;)
		{
			for(;left+1<_Sg;_Sg++)
			{
				var _jh1=this[left+Math.floor(Math.random()*(_Sg-left))];
				stack[_Ri++]=_Sg;
				for(var right=left-1;;)
				{
					while(_ih1(this[++right],_jh1)) 
					{
					}
					while(_ih1(_jh1,this[--_Sg])) 
					{
					}
					if(right>=_Sg)break;
					var _QB=this[right];
					this[right]=this[_Sg];
					this[_Sg]=_QB;
				}
			}
			if(_Ri===0)break;
			left=_Sg;
			_Sg=stack[--_Ri];
		}
		return this;
	}
	;
	Array.prototype._kh1=
function(_lh1,length)
	{
		if(typeof(length)==='undefined')length=this.length;
		var _H5=0;
		for(var c=0;c<length;++c)
		{
			if(_lh1(this[c]))continue;
			if(c===_H5)
			{
				++_H5;
				continue;
			}
			this[_H5++]=this[c];
		}
		return _H5;
	}
	;
	Array.prototype._mh1=
function(first,last,_0d,_ih1)
	{
		if(typeof(_ih1)==='undefined')_ih1=
function(_i3,_h3)
		{
			return _i3<_h3;
		}
		;
		var _u7=last-first;
		while(_u7>0) 
		{
			var step=Math.floor(_u7/2);
			var _nh1=first+step;
			if(_ih1(this[_nh1],_0d))
			{
				first=++_nh1;
				_u7-=step+1;
			}
			else _u7=step;
		}
		return first;
	}
	;
	Array.prototype._oh1=
function(first,last,_0d,_ih1)
	{
		if(typeof(_ih1)==='undefined')_ih1=
function(_i3,_h3)
		{
			return _i3<_h3;
		}
		;
		var _u7=last-first;
		while(_u7>0) 
		{
			var step=Math.floor(_u7/2);
			var _nh1=first+step;
			if(!_ih1(_0d,this[_nh1]))
			{
				first=++_nh1;
				_u7-=step+1;
			}
			else _u7=step;
		}
		return first;
	}
	;
	Array.prototype.rotate=
function(first,_ph1,last)
	{
		var _gj=_ph1;
		while(first!=_gj) 
		{
			var _qh1=this[first];
			this[first]=this[_gj];
			this[_gj]=_qh1;
			++first;
			++_gj;
			if(_gj===last)_gj=_ph1;
			else if(first===_ph1)_ph1=_gj;
		}
	}
	;
	var _rh1=(
function()
	{
		var _sh1=
function()
		{
			return +new Date();
		}
		;
		if(typeof(performance)==='undefined')window['performance']=
		{
			now:_sh1		}
		;
		if(!window['performance'].now)window['performance'].now=_sh1;

		function _th1(name,parent)
		{
			this.name=name;
			this.parent=parent;
			this._ke1=
			{
			}
			;
			this._uh1=0;
			this._vh1=0;
			this._wh1=0;
			this._xh1=false;
			this._yh1=0;
		}
		_th1.prototype=
		{
			start:
function()
			{
				this._uh1=performance.now();
				this._xh1=true;
			}
			,stop:
function(_y61)
			{
				if(!this._xh1)return;
				this._xh1=false;
				this._vh1+=performance.now()-this._uh1;
				if(_y61)this.start();
				for(var x in this._ke1)this._ke1[x].stop();
			}
			,_y61:
function(_zh1)
			{
				if(!_zh1)
				{
					this._xh1=true;
					this._wh1+=this._vh1;
					this.start();
				}
				this._vh1=0;
				for(var x in this._ke1)this._ke1[x]._y61(true);
			}
		}
		;
		var _Ah1=[];
		var _x4=new _th1("root");

		function _Bh1(name,parent)
		{
			if(!_Ah1)throw new Error("late profile creation not allowed");
			var _hg=new _th1(name,parent||'root');
			_Ah1.push(_hg);
			return _hg;
		}

		function _Ch1(_Dh1)
		{
			_Dh1._yh1--;
			delete _Dh1._ke1[_Dh1.name];
		}

		function _Eh1(_Fj,_Dh1)
		{
			if(_Fj.name===_Dh1.parent)return _Fj;
			for(var x in _Fj._ke1)
			{
				var _u5;
				if(_u5=_Eh1(_Fj._ke1[x],_Dh1))return _u5;
			}
			return null;
		}

		function init()
		{
			while(_Ah1.length) 
			{
				var _fx=_Ah1.pop();
				if(!(_fx.parentNode=_Eh1(_x4,_fx)))_Ah1._Fh1(_fx);
				else 
				{
					_fx.parentNode._ke1[_fx.name]=_fx;
					_fx.parentNode._yh1++;
				}
			}
			_Ah1=null;
		}

		function _Gh1()
		{
			_x4._y61(true);
		}
		var _r3=
		{
			_Bh1:_Bh1,_Ch1:_Ch1,init:init,_y61:_Gh1,_Hh1:_x4		}
		;
		return _r3;
	}
	());

	function _Ih1(_Jh1)
	{
		if(!_Jh1)
		{
			console.log("Assertion failed! Pls debug.");
			debugger;
		}
	}
	var _Kh1=Number.MAX_VALUE;
	var _Lh1=2.2204460492503131e-016;
	var _Mh1=Math.PI;
	var _Nh1=2;
	var _Oh1=8;
	var _Ph1=0.1;
	var _Qh1=2.0;
	var _Rh1=0.005;
	var _Sh1=(2.0/180.0*_Mh1);
	var _Th1=(2.0*_Rh1);
	var _Uh1=8;
	var _Vh1=32;
	var _Wh1=1.0;
	var _Xh1=0.2;
	var _Yh1=(8.0/180.0*_Mh1);
	var _Zh1=2.0;
	var __h1=(_Zh1*_Zh1);
	var _0i1=(0.5*_Mh1);
	var _1i1=(_0i1*_0i1);
	var _2i1=0.2;
	var _3i1=0.75;
	var _4i1=0.5;
	var _5i1=0.01;
	var _6i1=(2.0/180.0*_Mh1);
	var _7i1=(-1);
	var _8i1=0.75;
	var _9i1=1.0;
	var _ai1=5.0;
	var _bi1=2;
	var _ci1=(_bi1*_bi1);
	var _di1=256;

	function _ei1(_fi1,_gi1,_hi1)
	{
		this._ii1=_fi1;
		this._ji1=_gi1;
		this._ki1=_hi1;
	}
	_ei1.prototype=
	{
		toString:
function()
		{
			return this._ii1+'.'+this._ji1+'.'+this._ki1;
		}
	}
	;
	var _li1=new _ei1(2,3,1);

	function _mi1(x)
	{
		return isFinite(x)&&!isNaN(x);
	}
	var _ni1=Math.sqrt;
	var _oi1=Math.atan2;
	var _pi1=Math.sin;
	var _qi1=Math.cos;
	var _ri1=Math.floor;
	var _si1=Math.ceil;
	var _ti1=_ni1;
	var _ui1=_oi1;

	function _vi1(x)
	{
		return 1.0/_ni1(x);
	}

	function _wi1(x,y)
	{
		if(typeof(x)!=='undefined')
		{
			this.x=x;
			this.y=y;
		}
		else this.x=this.y=0;
	}
	_wi1.prototype=
	{
		_72:
function()
		{
			return new _wi1(this.x,this.y);
		}
		,_xi1:
function()
		{
			this.x=0.0;
			this.y=0.0;
			return this;
		}
		,Set:
function(_yi1,_zi1)
		{
			this.x=_yi1;
			this.y=_zi1;
			return this;
		}
		,_PG:
function(_H5)
		{
			this.x=_H5.x;
			this.y=_H5.y;
			return this;
		}
		,_Ai1:
function()
		{
			var _Z3=new _wi1();
			_Z3.Set(-this.x,-this.y);
			return _Z3;
		}
		,_Bi1:
function(i)
		{
			switch(i)
			{
				case 0:return this.x;
				case 1:return this.y;
			}
		}
		,_Ci1:
function(i,_Z3)
		{
			switch(i)
			{
				case 0:return this.x=_Z3;
				case 1:return this.y=_Z3;
			}
		}
		,_ce:
function(_Z3)
		{
			this.x+=_Z3.x;
			this.y+=_Z3.y;
			return this;
		}
		,_Di1:
function(_Z3)
		{
			this.x-=_Z3.x;
			this.y-=_Z3.y;
			return this;
		}
		,Multiply:
function(_i3)
		{
			this.x*=_i3;
			this.y*=_i3;
			return this;
		}
		,Length:
function()
		{
			return _ti1(this.x*this.x+this.y*this.y);
		}
		,_Ei1:
function()
		{
			return this.x*this.x+this.y*this.y;
		}
		,_Fi1:
function()
		{
			var length=this.Length();
			if(length<_Lh1)
			{
				return 0.0;
			}
			var _Gi1=1.0/length;
			this.x*=_Gi1;
			this.y*=_Gi1;
			return length;
		}
		,_Hi1:
function()
		{
			return _mi1(this.x)&&_mi1(this.y);
		}
		,_Ii1:
function()
		{
			return new _wi1(-this.y,this.x);
		}
		,_Ji1:
function(out)
		{
			var __i=out||[];
			__i[0]=this.x;
			__i[1]=this.y;
			return __i;
		}
		,_Ki1:
function(data)
		{
			this.x=data[0];
			this.y=data[1];
		}
	}
	;
	_wi1._ce=
function(_i3,_h3)
	{
		return new _wi1(_i3.x+_h3.x,_i3.y+_h3.y);
	}
	;
	_wi1._Di1=
function(_i3,_h3)
	{
		return new _wi1(_i3.x-_h3.x,_i3.y-_h3.y);
	}
	;
	_wi1._Li1=
function(_i3,_h3)
	{
		return _i3.x==_h3.x&&_i3.y==_h3.y;
	}
	;
	_wi1.Multiply=
function(_hg,_i3)
	{
		return new _wi1(_hg*_i3.x,_hg*_i3.y);
	}
	;
	_wi1._Ai1=
function(_i3)
	{
		return new _wi1(-_i3.x,-_i3.y);
	}
	;

	function _Mi1(x,y,z)
	{
		if(typeof(x)!=='undefined')
		{
			this.x=x;
			this.y=y;
			this.z=z;
		}
	}
	_Mi1.prototype=
	{
		_72:
function()
		{
			return new _Mi1(this.x,this.y,this.z);
		}
		,_xi1:
function()
		{
			this.x=0.0;
			this.y=0.0;
			this.z=0.0;
		}
		,Set:
function(_yi1,_zi1,_Ni1)
		{
			this.x=_yi1;
			this.y=_zi1;
			this.z=_Ni1;
		}
		,_Ai1:
function()
		{
			var _Z3=new _Mi1();
			_Z3.Set(-this.x,-this.y,-this.z);
			return _Z3;
		}
		,_ce:
function(_Z3)
		{
			this.x+=_Z3.x;
			this.y+=_Z3.y;
			this.z+=_Z3.z;
		}
		,_Di1:
function(_Z3)
		{
			this.x-=_Z3.x;
			this.y-=_Z3.y;
			this.z-=_Z3.z;
		}
		,Multiply:
function(_hg)
		{
			this.x*=_hg;
			this.y*=_hg;
			this.z*=_hg;
		}
		,x:0,y:0,z:0	}
	;
	_Mi1.Multiply=
function(_hg,_i3)
	{
		return new _Mi1(_hg*_i3.x,_hg*_i3.y,_hg*_i3.z);
	}
	;
	_Mi1._ce=
function(_i3,_h3)
	{
		return new _Mi1(_i3.x+_h3.x,_i3.y+_h3.y,_i3.z+_h3.z);
	}
	;
	_Mi1._Di1=
function(_i3,_h3)
	{
		return new _Mi1(_i3.x-_h3.x,_i3.y-_h3.y,_i3.z-_h3.z);
	}
	;

	function _Oi1(_Pi1,_Qi1)
	{
		this._5i=_Pi1?_Pi1._72():new _wi1();
		this._jD=_Qi1?_Qi1._72():new _wi1();
	}
	_Oi1.prototype=
	{
		Set:
function(_Pi1,_Qi1)
		{
			this._5i._PG(_Pi1);
			this._jD._PG(_Qi1);
		}
		,_PG:
function(_lq)
		{
			this._5i._PG(_lq._5i);
			this._jD._PG(_lq._jD);
		}
		,_Ri1:
function()
		{
			this._5i.x=1.0;
			this._jD.x=0.0;
			this._5i.y=0.0;
			this._jD.y=1.0;
		}
		,_xi1:
function()
		{
			this._5i.x=0.0;
			this._jD.x=0.0;
			this._5i.y=0.0;
			this._jD.y=0.0;
		}
		,_Si1:
function()
		{
			var _i3=this._5i.x,_h3=this._jD.x,c=this._5i.y,_en=this._jD.y;
			var _Ti1=new _Oi1();
			var _Ui1=_i3*_en-_h3*c;
			if(_Ui1!=0.0)
			{
				_Ui1=1.0/_Ui1;
			}
			_Ti1._5i.x=_Ui1*_en;
			_Ti1._jD.x=-_Ui1*_h3;
			_Ti1._5i.y=-_Ui1*c;
			_Ti1._jD.y=_Ui1*_i3;
			return _Ti1;
		}
		,_Vi1:
function(_h3)
		{
			var _Wi1=this._5i.x,_Xi1=this._jD.x,_Yi1=this._5i.y,_Zi1=this._jD.y;
			var _Ui1=_Wi1*_Zi1-_Xi1*_Yi1;
			if(_Ui1!=0.0)
			{
				_Ui1=1.0/_Ui1;
			}
			var x=new _wi1();
			x.x=_Ui1*(_Zi1*_h3.x-_Xi1*_h3.y);
			x.y=_Ui1*(_Wi1*_h3.y-_Yi1*_h3.x);
			return x;
		}
	}
	;
	_Oi1._ce=
function(_Jh1,_Ti1)
	{
		return new _Oi1(_wi1._ce(_Jh1._5i,_Ti1._5i),_wi1._ce(_Jh1._jD,_Ti1._jD));
	}
	;

	function __i1(_Pi1,_Qi1,_0j1)
	{
		this._5i=_Pi1?_Pi1._72():new _Mi1();
		this._jD=_Qi1?_Qi1._72():new _Mi1();
		this._1j1=_0j1?_0j1._72():new _Mi1();
	}
	__i1.prototype=
	{
		_xi1:
function()
		{
			this._5i._xi1();
			this._jD._xi1();
			this._1j1._xi1();
		}
		,_2j1:
function(_h3)
		{
			var _Ui1=_3j1(this._5i,_4j1(this._jD,this._1j1));
			if(_Ui1!=0.0)
			{
				_Ui1=1.0/_Ui1;
			}
			var x=new _Mi1();
			x.x=_Ui1*_3j1(_h3,_4j1(this._jD,this._1j1));
			x.y=_Ui1*_3j1(this._5i,_4j1(_h3,this._1j1));
			x.z=_Ui1*_3j1(this._5i,_4j1(this._jD,_h3));
			return x;
		}
		,_5j1:
function(_h3)
		{
			var _Wi1=this._5i.x,_Xi1=this._jD.x,_Yi1=this._5i.y,_Zi1=this._jD.y;
			var _Ui1=_Wi1*_Zi1-_Xi1*_Yi1;
			if(_Ui1!=0.0)
			{
				_Ui1=1.0/_Ui1;
			}
			var x=new _wi1();
			x.x=_Ui1*(_Zi1*_h3.x-_Xi1*_h3.y);
			x.y=_Ui1*(_Wi1*_h3.y-_Yi1*_h3.x);
			return x;
		}
		,_6j1:
function(_7j1)
		{
			var _i3=this._5i.x,_h3=this._jD.x,c=this._5i.y,_en=this._jD.y;
			var _Ui1=_i3*_en-_h3*c;
			if(_Ui1!=0.0)
			{
				_Ui1=1.0/_Ui1;
			}
			_7j1._5i.x=_Ui1*_en;
			_7j1._jD.x=-_Ui1*_h3;
			_7j1._5i.z=0.0;
			_7j1._5i.y=-_Ui1*c;
			_7j1._jD.y=_Ui1*_i3;
			_7j1._jD.z=0.0;
			_7j1._1j1.x=0.0;
			_7j1._1j1.y=0.0;
			_7j1._1j1.z=0.0;
		}
		,_8j1:
function(_7j1)
		{
			var _Ui1=_3j1(this._5i,_4j1(this._jD,this._1j1));
			if(_Ui1!=0.0)
			{
				_Ui1=1.0/_Ui1;
			}
			var _Wi1=this._5i.x,_Xi1=this._jD.x,_9j1=this._1j1.x;
			var _Zi1=this._jD.y,_aj1=this._1j1.y;
			var _bj1=this._1j1.z;
			_7j1._5i.x=_Ui1*(_Zi1*_bj1-_aj1*_aj1);
			_7j1._5i.y=_Ui1*(_9j1*_aj1-_Xi1*_bj1);
			_7j1._5i.z=_Ui1*(_Xi1*_aj1-_9j1*_Zi1);
			_7j1._jD.x=_7j1._5i.y;
			_7j1._jD.y=_Ui1*(_Wi1*_bj1-_9j1*_9j1);
			_7j1._jD.z=_Ui1*(_9j1*_Xi1-_Wi1*_aj1);
			_7j1._1j1.x=_7j1._5i.z;
			_7j1._1j1.y=_7j1._jD.z;
			_7j1._1j1.z=_Ui1*(_Wi1*_Zi1-_Xi1*_Xi1);
		}
	}
	;

	function _cj1(angle,c)
	{
		if(typeof(c)!=='undefined')
		{
			this._hg=angle;
			this.c=c;
		}
		else if(typeof(angle)!=='undefined')this.Set(angle);
	}
	_cj1.prototype=
	{
		_72:
function()
		{
			return new _cj1(this._hg,this.c);
		}
		,_PG:
function(_H5)
		{
			this._hg=_H5._hg;
			this.c=_H5.c;
		}
		,Set:
function(x)
		{
			this._hg=_pi1(x);
			this.c=_qi1(x);
		}
		,_Ri1:
function()
		{
			this._hg=0.0;
			this.c=1.0;
		}
		,_dj1:
function()
		{
			return _ui1(this._hg,this.c);
		}
		,_ej1:
function()
		{
			return new _wi1(this.c,this._hg);
		}
		,_fj1:
function()
		{
			return new _wi1(-this._hg,this.c);
		}
		,_hg:0,c:1	}
	;

	function _gj1(position,rotation)
	{
		this._fx=new _wi1();
		this.q=new _cj1();
		if(position)
		{
			this._fx._PG(position);
			this.q._PG(rotation);
		}
	}
	_gj1.prototype=
	{
		_72:
function()
		{
			var _hj1=new _gj1(this._fx,this.q);
			return _hj1;
		}
		,_PG:
function(_hj1)
		{
			this._fx._PG(_hj1._fx);
			this.q._PG(_hj1.q);
		}
		,_Ri1:
function()
		{
			this._fx._xi1();
			this.q._Ri1();
		}
		,Set:
function(position,angle)
		{
			this._fx._PG(position);
			this.q.Set(angle);
		}
	}
	;

	function _ij1()
	{
		this._jj1=new _wi1();
		this._kj1=new _wi1();
		this.c=new _wi1();
	}
	_ij1.prototype=
	{
		_PG:
function(_lj1)
		{
			this._jj1._PG(_lj1._jj1);
			this._kj1._PG(_lj1._kj1);
			this.c._PG(_lj1.c);
			this._i3=_lj1._i3;
			this._mj1=_lj1._mj1;
			this._nj1=_lj1._nj1;
		}
		,_72:
function()
		{
			var _lj1=new _ij1();
			_lj1._jj1._PG(this._jj1);
			_lj1._kj1._PG(this._kj1);
			_lj1.c._PG(this.c);
			_lj1._i3=this._i3;
			_lj1._mj1=this._mj1;
			_lj1._nj1=this._nj1;
			return _lj1;
		}
		,_oj1:
function(_hj1,_pj1)
		{
			_hj1._fx.x=((1.0-_pj1)*this._kj1.x)+(_pj1*this.c.x);
			_hj1._fx.y=((1.0-_pj1)*this._kj1.y)+(_pj1*this.c.y);
			var angle=(1.0-_pj1)*this._mj1+_pj1*this._i3;
			_hj1.q.Set(angle);
			_hj1._fx.x-=_hj1.q.c*this._jj1.x-_hj1.q._hg*this._jj1.y;
			_hj1._fx.y-=_hj1.q._hg*this._jj1.x+_hj1.q.c*this._jj1.y;
		}
		,_qj1:
function(alpha)
		{
			_Ih1(this._nj1<1.0);
			var _pj1=(alpha-this._nj1)/(1.0-this._nj1);
			this._kj1._ce(_wi1.Multiply(_pj1,_wi1._Di1(this.c,this._kj1)));
			this._mj1+=_pj1*(this._i3-this._mj1);
			this._nj1=alpha;
		}
		,_Fi1:
function()
		{
			var _rj1=2.0*_Mh1;
			var _en=_rj1*_ri1(this._mj1/_rj1);
			this._mj1-=_en;
			this._i3-=_en;
		}
		,_mj1:0,_i3:0,_nj1:0	}
	;

	function _sj1(_i3,_h3)
	{
		return _i3.x*_h3.x+_i3.y*_h3.y;
	}

	function _tj1(_i3,_h3)
	{
		return _i3.x*_h3.y-_i3.y*_h3.x;
	}

	function _uj1(_i3,_hg)
	{
		return new _wi1(_hg*_i3.y,-_hg*_i3.x);
	}

	function _vj1(_hg,_i3)
	{
		return new _wi1(-_hg*_i3.y,_hg*_i3.x);
	}

	function _wj1(_Jh1,_Z3)
	{
		return new _wi1(_Jh1._5i.x*_Z3.x+_Jh1._jD.x*_Z3.y,_Jh1._5i.y*_Z3.x+_Jh1._jD.y*_Z3.y);
	}

	function _xj1(_Jh1,_Z3)
	{
		return new _wi1(_sj1(_Z3,_Jh1._5i),_sj1(_Z3,_Jh1._jD));
	}

	function _yj1(_i3,_h3)
	{
		var c=_wi1._Di1(_i3,_h3);
		return c.Length();
	}

	function _zj1(_i3,_h3)
	{
		var c=_wi1._Di1(_i3,_h3);
		return _sj1(c,c);
	}

	function _3j1(_i3,_h3)
	{
		return _i3.x*_h3.x+_i3.y*_h3.y+_i3.z*_h3.z;
	}

	function _4j1(_i3,_h3)
	{
		return new _Mi1(_i3.y*_h3.z-_i3.z*_h3.y,_i3.z*_h3.x-_i3.x*_h3.z,_i3.x*_h3.y-_i3.y*_h3.x);
	}

	function _Aj1(_Jh1,_Ti1)
	{
		return new _Oi1(_wj1(_Jh1,_Ti1._5i),_wj1(_Jh1,_Ti1._jD));
	}

	function _Bj1(_Jh1,_Ti1)
	{
		var _Pi1=new _wi1(_sj1(_Jh1._5i,_Ti1._5i),_sj1(_Jh1._jD,_Ti1._5i));
		var _Qi1=new _wi1(_sj1(_Jh1._5i,_Ti1._jD),_sj1(_Jh1._jD,_Ti1._jD));
		return new _Oi1(_Pi1,_Qi1);
	}

	function _Cj1(_Jh1,_Z3)
	{
		return _Mi1._ce(_Mi1._ce(_Mi1.Multiply(_Z3.x,_Jh1._5i),_Mi1.Multiply(_Z3.y,_Jh1._jD)),_Mi1.Multiply(_Z3.z,_Jh1._1j1));
	}

	function _Dj1(_Jh1,_Z3)
	{
		return new _wi1(_Jh1._5i.x*_Z3.x+_Jh1._jD.x*_Z3.y,_Jh1._5i.y*_Z3.x+_Jh1._jD.y*_Z3.y);
	}

	function _Ej1(q,_f3)
	{
		var _Fj1=new _cj1();
		_Fj1._hg=q._hg*_f3.c+q.c*_f3._hg;
		_Fj1.c=q.c*_f3.c-q._hg*_f3._hg;
		return _Fj1;
	}

	function _Gj1(q,_f3)
	{
		var _Fj1=new _cj1();
		_Fj1._hg=q.c*_f3._hg-q._hg*_f3.c;
		_Fj1.c=q.c*_f3.c+q._hg*_f3._hg;
		return _Fj1;
	}

	function _Hj1(q,_Z3)
	{
		return new _wi1(q.c*_Z3.x-q._hg*_Z3.y,q._hg*_Z3.x+q.c*_Z3.y);
	}

	function _Ij1(q,_Z3)
	{
		return new _wi1(q.c*_Z3.x+q._hg*_Z3.y,-q._hg*_Z3.x+q.c*_Z3.y);
	}

	function _Jj1(_Kj1,_Z3)
	{
		return new _wi1((_Kj1.q.c*_Z3.x-_Kj1.q._hg*_Z3.y)+_Kj1._fx.x,(_Kj1.q._hg*_Z3.x+_Kj1.q.c*_Z3.y)+_Kj1._fx.y);
	}

	function _Lj1(_Kj1,_Z3)
	{
		var _0n=_Z3.x-_Kj1._fx.x;
		var _1n=_Z3.y-_Kj1._fx.y;
		var x=(_Kj1.q.c*_0n+_Kj1.q._hg*_1n);
		var y=(-_Kj1.q._hg*_0n+_Kj1.q.c*_1n);
		return new _wi1(x,y);
	}

	function _Mj1(_Jh1,_Ti1)
	{
		var _Nj1=new _gj1();
		_Nj1.q=_Ej1(_Jh1.q,_Ti1.q);
		_Nj1._fx=_wi1._ce(_Hj1(_Jh1.q,_Ti1._fx),_Jh1._fx);
		return _Nj1;
	}

	function _Oj1(_Jh1,_Ti1)
	{
		var _Nj1=new _gj1();
		_Nj1.q=_Gj1(_Jh1.q,_Ti1.q);
		var _Pj1=_Ti1._fx.x-_Jh1._fx.x;
		var _Qj1=_Ti1._fx.y-_Jh1._fx.y;
		_Nj1._fx.x=_Jh1.q.c*_Pj1+_Jh1.q._hg*_Qj1;
		_Nj1._fx.y=-_Jh1.q._hg*_Pj1+_Jh1.q.c*_Qj1;
		return _Nj1;
	}
	var _Rj1=Math.abs;

	function _Sj1(_i3)
	{
		return new _wi1(_Rj1(_i3.x),_Rj1(_i3.y));
	}

	function _Tj1(_Jh1)
	{
		return new _Oi1(_Sj1(_Jh1._5i),_Sj1(_Jh1._jD));
	}
	var _Uj1=Math.min;

	function _Vj1(_i3,_h3)
	{
		return new _wi1(_Uj1(_i3.x,_h3.x),_Uj1(_i3.y,_h3.y));
	}
	var _Wj1=Math.max;

	function _Xj1(_i3,_h3)
	{
		return new _wi1(_Wj1(_i3.x,_h3.x),_Wj1(_i3.y,_h3.y));
	}

	function _Yj1(_i3,_ma1,_Ma1)
	{
		return _Wj1(_ma1,_Uj1(_i3,_Ma1));
	}

	function _Zj1(_i3,_ma1,_Ma1)
	{
		return _Xj1(_ma1,_Vj1(_i3,_Ma1));
	}

	function __j1(x)
	{
		x|=(x>>1);
		x|=(x>>2);
		x|=(x>>4);
		x|=(x>>8);
		x|=(x>>16);
		return x+1;
	}

	function _0k1(x)
	{
		var result=x>0&&(x&(x-1))==0;
		return result;
	}
	var _1k1=32767;

	function _2k1(_3k1,_la1)
	{
		var _f3=Math.random();
		if(typeof(_3k1)!=='undefined')_f3=(_la1-_3k1)*_f3+_3k1;
		else _f3=2.0*_f3-1.0;
		return _f3;
	}

	function _4k1(_f3,_g3,_h3)
	{
		this._f3=_f3||0;
		this._g3=_g3||0;
		this._h3=_h3||0;
	}
	_4k1.prototype=
	{
		Set:
function(_f3,_g3,_h3)
		{
			this._f3=_f3;
			this._g3=_g3;
			this._h3=_h3;
		}
	}
	;

	function _5k1()
	{
	}
	_5k1.prototype=
	{
		_6k1:
function(_Bg1)
		{
			this._7k1=_Bg1;
		}
		,_8k1:
function()
		{
			return this._7k1;
		}
		,_9k1:
function(_Bg1)
		{
			this._7k1|=_Bg1;
		}
		,_ak1:
function(_Bg1)
		{
			this._7k1&=~_Bg1;
		}
		,_bk1:
function(_Bg1)
		{
			this._7k1^=_Bg1;
		}
		,_ck1:
function(vertices,vertexCount,color)
		{
		}
		,_dk1:
function(vertices,vertexCount,color)
		{
		}
		,_ek1:
function(_fk1,_MZ,color)
		{
		}
		,_gk1:
function(_fk1,_MZ,_tn,color)
		{
		}
		,_hk1:
function(_sn,_ik1,color)
		{
		}
		,_jk1:
function(_hj1)
		{
		}
		,_7_:
function(_kk1,_MZ,_lk1,_u7)
		{
		}
		,_7k1:0	}
	;
	_5k1._mk1=1;
	_5k1._nk1=2;
	_5k1._ok1=4;
	_5k1._pk1=8;
	_5k1._qk1=16;
	_5k1._rk1=32;
	_5k1._sk1=64;
	_5k1._tk1=128;
	_5k1._uk1=256;
	_5k1._vk1=512;
	_5k1._wk1=1024;
	if(typeof(performance)==='undefined')
	{
		window.performance=
		{
			now:
function()
			{
				return +new Date();
			}
		}
		;
	}

	function _xk1()
	{
		this._WA();
	}
	_xk1.prototype=
	{
		_WA:
function()
		{
			this._yk1=performance.now();
		}
		,_zk1:
function()
		{
			return performance.now()-this._yk1;
		}
	}
	;

	function _Ak1()
	{
		this._Bk1=0;
		this._fk1=new _wi1();
		this._Ck1=0;
	}
	/*
 * A shape.
 * @constructor
 * @returns {b2Shape}
 */
function _Dk1()
	{
		this._yF=0;
		this._Ek1=0;
	}
	_Dk1.prototype=
	{
		_72:
function()
		{
		}
		,_9e1:
function()
		{
			return this._yF;
		}
		,_Fk1:
function()
		{
		}
		,_Gk1:
function(_hj1,_fx)
		{
		}
		,_Hk1:
function(output,input,transform,_Ik1)
		{
		}
		,_Jk1:
function(_Kk1,_hj1,_Ik1)
		{
		}
		,_Lk1:
function(_Mk1,_j_)
		{
		}
		,_Nk1:
function(_hj1,_fx,_Ok1,_Pk1,_Ik1)
		{
		}
		,_Ji1:
function(out)
		{
			var __i=out||
			{
			}
			;
			__i['m_type']=this._yF;
			__i['m_radius']=this._Ek1;
			return __i;
		}
		,_Ki1:
function(data)
		{
			this._Ek1=data['m_radius'];
		}
	}
	;
	_Dk1._Qk1=0;
	_Dk1._Rk1=1;
	_Dk1._Sk1=2;
	_Dk1._Tk1=3;
	_Dk1._Uk1=4;

	function _Vk1()
	{
		this.parent.call(this);
		this._yF=_Dk1._Qk1;
		this._Ek1=0;
		this._Wk1=new _wi1();
		Object.seal(this);
	}
	_Vk1.prototype=
	{
		_72:
function()
		{
			var shape=new _Vk1();
			shape._Ek1=this._Ek1;
			shape._Wk1=this._Wk1._72();
			return shape;
		}
		,_Fk1:
function()
		{
			return 1;
		}
		,_Gk1:
function(transform,_fx)
		{
			var _fk1=_wi1._ce(transform._fx,_Hj1(transform.q,this._Wk1));
			var _en=_wi1._Di1(_fx,_fk1);
			return _sj1(_en,_en)<=this._Ek1*this._Ek1;
		}
		,_Hk1:
function(output,input,transform,_Ik1)
		{
			var position=_wi1._ce(transform._fx,_Hj1(transform.q,this._Wk1));
			var _hg=_wi1._Di1(input._sn,position);
			var _h3=_sj1(_hg,_hg)-this._Ek1*this._Ek1;
			var _f3=_wi1._Di1(input._ik1,input._sn);
			var c=_sj1(_hg,_f3);
			var _BB=_sj1(_f3,_f3);
			var _Xk1=c*c-_BB*_h3;
			if(_Xk1<0.0||_BB<_Lh1)
			{
				return false;
			}
			var _i3=-(c+_ti1(_Xk1));
			if(0.0<=_i3&&_i3<=input._O_*_BB)
			{
				_i3/=_BB;
				output._T_=_i3;
				output._Pk1=_wi1._ce(_hg,_wi1.Multiply(_i3,_f3));
				output._Pk1._Fi1();
				return true;
			}
			return false;
		}
		,_Jk1:
function(_Kk1,transform,_Ik1)
		{
			var _0n=transform._fx.x+(transform.q.c*this._Wk1.x-transform.q._hg*this._Wk1.y);
			var _1n=transform._fx.y+(transform.q._hg*this._Wk1.x+transform.q.c*this._Wk1.y);
			_Kk1._Yk1.x=_0n-this._Ek1;
			_Kk1._Yk1.y=_1n-this._Ek1;
			_Kk1._Zk1.x=_0n+this._Ek1;
			_Kk1._Zk1.y=_1n+this._Ek1;
		}
		,_Lk1:
function(_Mk1,_j_)
		{
			_Mk1._Bk1=_j_*_Mh1*this._Ek1*this._Ek1;
			_Mk1._fk1=this._Wk1;
			_Mk1._Ck1=_Mk1._Bk1*(0.5*this._Ek1*this._Ek1+_sj1(this._Wk1,this._Wk1));
		}
		,__k1:
function(_en)
		{
			return 0;
		}
		,_0l1:
function(_en)
		{
			return this._Wk1;
		}
		,_Mc:
function()
		{
			return 1;
		}
		,_1l1:
function(index)
		{
			_Ih1(index==0);
			return this._Wk1;
		}
		,_Nk1:
function(transform,_fx,_Ok1,_Pk1,_Ik1)
		{
			var _fk1=_wi1._ce(transform._fx,_Hj1(transform.q,this._Wk1));
			var _en=_wi1._Di1(_fx,_fk1);
			var _Wt=_en.Length();
			_Ok1[0]=_Wt-this._Ek1;
			_Pk1._PG(_wi1.Multiply(1/_Wt,_en));
		}
		,_Ji1:
function(out)
		{
			var __i=out||
			{
			}
			;
			this.parent.prototype._Ji1.call(this,__i);
			__i['m_p']=this._Wk1._Ji1();
			return __i;
		}
		,_Ki1:
function(data)
		{
			this.parent.prototype._Ki1.call(this,data);
			this._Wk1._Ki1(data['m_p']);
		}
	}
	;
	_Vk1._fh1(_Dk1);

	function _2l1()
	{
		this.parent.call(this);
		this._yF=_Dk1._Rk1;
		this._Ek1=_Th1;
		this._3l1=new _wi1();
		this._4l1=new _wi1();
		this._5l1=new _wi1();
		this._6l1=new _wi1();
		this._7l1=false;
		this._8l1=false;
		Object.seal(this);
	}
	_2l1.prototype=
	{
		Set:
function(_la,_04)
		{
			this._4l1._PG(_la);
			this._5l1._PG(_04);
			this._7l1=false;
			this._8l1=false;
		}
		,_72:
function()
		{
			var shape=new _2l1();
			shape._3l1=this._3l1._72();
			shape._4l1=this._4l1._72();
			shape._5l1=this._5l1._72();
			shape._6l1=this._6l1._72();
			shape._7l1=this._7l1;
			shape._8l1=this._8l1;
			return shape;
		}
		,_Fk1:
function()
		{
			return 1;
		}
		,_Gk1:
function(transform,_fx)
		{
			return false;
		}
		,_Hk1:
function(output,input,_hj1,_Ik1)
		{
			var _sn=_Ij1(_hj1.q,_wi1._Di1(input._sn,_hj1._fx));
			var _ik1=_Ij1(_hj1.q,_wi1._Di1(input._ik1,_hj1._fx));
			var _en=_wi1._Di1(_ik1,_sn);
			var _la=this._4l1;
			var _04=this._5l1;
			var e=_wi1._Di1(_04,_la);
			var _Pk1=new _wi1(e.y,-e.x);
			_Pk1._Fi1();
			var _9l1=_sj1(_Pk1,_wi1._Di1(_la,_sn));
			var _al1=_sj1(_Pk1,_en);
			if(_al1==0.0)
			{
				return false;
			}
			var _K5=_9l1/_al1;
			if(_K5<0.0||input._O_<_K5)
			{
				return false;
			}
			var q=_wi1._ce(_sn,_wi1.Multiply(_K5,_en));
			var _f3=_wi1._Di1(_04,_la);
			var _BB=_sj1(_f3,_f3);
			if(_BB==0.0)
			{
				return false;
			}
			var _hg=_sj1(_wi1._Di1(q,_la),_f3)/_BB;
			if(_hg<0.0||1.0<_hg)
			{
				return false;
			}
			output._T_=_K5;
			if(_9l1>0.0)
			{
				output._Pk1=_Hj1(_hj1.q,_Pk1)._Ai1();
			}
			else 
			{
				output._Pk1=_Hj1(_hj1.q,_Pk1);
			}
			return true;
		}
		,_Jk1:
function(_Kk1,_hj1,_Ik1)
		{
			var _wa=(_hj1.q.c*this._4l1.x-_hj1.q._hg*this._4l1.y)+_hj1._fx.x;
			var _xa=(_hj1.q._hg*this._4l1.x+_hj1.q.c*this._4l1.y)+_hj1._fx.y;
			var _ya=(_hj1.q.c*this._5l1.x-_hj1.q._hg*this._5l1.y)+_hj1._fx.x;
			var _za=(_hj1.q._hg*this._5l1.x+_hj1.q.c*this._5l1.y)+_hj1._fx.y;
			var _bl1=_Uj1(_wa,_ya);
			var _cl1=_Uj1(_xa,_za);
			var _dl1=_Wj1(_wa,_ya);
			var _el1=_Wj1(_xa,_za);
			_Kk1._Yk1.x=_bl1-this._Ek1;
			_Kk1._Yk1.y=_cl1-this._Ek1;
			_Kk1._Zk1.x=_dl1+this._Ek1;
			_Kk1._Zk1.y=_el1+this._Ek1;
		}
		,_Lk1:
function(_Mk1,_j_)
		{
			_Mk1._Bk1=0.0;
			_Mk1._fk1=_wi1.Multiply(0.5,_wi1._ce(this._4l1,this._5l1));
			_Mk1._Ck1=0.0;
		}
		,_Nk1:
function(_hj1,_fx,_Ok1,_Pk1,_Ik1)
		{
			var _la=_Jj1(_hj1,this._4l1);
			var _04=_Jj1(_hj1,this._5l1);
			var _en=_wi1._Di1(_fx,_la);
			var _hg=_wi1._Di1(_04,_la);
			var _fl1=_sj1(_en,_hg);
			if(_fl1>0)
			{
				var __q=_sj1(_hg,_hg);
				if(_fl1>__q)
				{
					_en._PG(_wi1._Di1(_fx,_04));
				}
				else 
				{
					_en._Di1(_wi1.Multiply(_fl1/__q,_hg));
				}
			}
			var _Wt=_en.Length();
			_Ok1[0]=_Wt;
			_Pk1._PG(_Wt>0?_wi1.Multiply(1/_Wt,_en):new _wi1(0,0));
		}
		,_Ji1:
function(out)
		{
			var __i=out||
			{
			}
			;
			this.parent.prototype._Ji1.call(this,__i);
			__i['m_vertex1']=this._4l1._Ji1();
			__i['m_vertex2']=this._5l1._Ji1();
			__i['m_hasVertex0']=this._7l1;
			if(this._7l1)__i['m_vertex0']=this._3l1._Ji1();
			__i['m_hasVertex3']=this._8l1;
			if(this._8l1)__i['m_vertex3']=this._6l1._Ji1();
			return __i;
		}
		,_Ki1:
function(data)
		{
			this.parent.prototype._Ki1.call(this,data);
			this._4l1._Ki1(data['m_vertex1']);
			this._5l1._Ki1(data['m_vertex2']);
			this._7l1=data['m_hasVertex0'];
			if(this._7l1)this._3l1._Ki1(data['m_vertex0']);
			this._8l1=data['m_hasVertex3'];
			if(this._8l1)this._6l1._Ki1(data['m_vertex3']);
		}
	}
	;
	_2l1._fh1(_Dk1);

	function _gl1()
	{
		this.parent.call(this);
		this._yF=_Dk1._Tk1;
		this._Ek1=_Th1;
		this._hl1=null;
		this._il1=0;
		this._jl1=new _wi1();
		this._kl1=new _wi1();
		this._ll1=false;
		this._ml1=false;
		Object.seal(this);
	}
	_gl1._nl1=new _2l1();
	_gl1.prototype=
	{
		_ol1:
function(vertices,_u7)
		{
			_Ih1(this._hl1==null&&this._il1==0);
			_Ih1(_u7>=3);
			for(var i=1;i<_u7;++i)
			{
				var _la=vertices[i-1];
				var _04=vertices[i];
				_Ih1(_zj1(_la,_04)>_Rh1*_Rh1);
			}
			this._il1=_u7+1;
			this._hl1=new Array(this._il1);
			for(var i=0;i<_u7;++i)this._hl1[i]=vertices[i]._72();
			this._hl1[_u7]=this._hl1[0]._72();
			this._jl1._PG(this._hl1[this._il1-2]);
			this._kl1._PG(this._hl1[1]);
			this._ll1=true;
			this._ml1=true;
		}
		,_pl1:
function(vertices,_u7)
		{
			_Ih1(this._hl1==null&&this._il1==0);
			_Ih1(_u7>=2);
			for(var i=1;i<_u7;++i)
			{
				var _la=vertices[i-1];
				var _04=vertices[i];
				_Ih1(_zj1(_la,_04)>_Rh1*_Rh1);
			}
			this._il1=_u7;
			this._hl1=new Array(_u7);
			for(var i=0;i<_u7;++i)this._hl1[i]=vertices[i]._72();
			this._ll1=false;
			this._ml1=false;
			this._jl1._xi1();
			this._kl1._xi1();
		}
		,_ql1:
function(_rl1)
		{
			this._jl1._PG(_rl1);
			this._ll1=true;
		}
		,_sl1:
function(_tl1)
		{
			this._kl1._PG(_tl1);
			this._ml1=true;
		}
		,_72:
function()
		{
			var shape=new _gl1();
			shape._il1=this._il1;
			shape._hl1=new Array(this._il1);
			for(var i=0;i<this._il1;++i)shape._hl1[i]=this._hl1[i]._72();
			shape._jl1=this._jl1._72();
			shape._kl1=this._kl1._72();
			shape._ll1=this._ll1;
			shape._ml1=this._ml1;
			return shape;
		}
		,_Fk1:
function()
		{
			return this._il1-1;
		}
		,_ul1:
function(_vl1,index)
		{
			_Ih1(0<=index&&index<this._il1-1);
			_vl1._yF=_Dk1._Rk1;
			_vl1._Ek1=this._Ek1;
			_vl1._4l1=this._hl1[index+0];
			_vl1._5l1=this._hl1[index+1];
			if(index>0)
			{
				_vl1._3l1=this._hl1[index-1];
				_vl1._7l1=true;
			}
			else 
			{
				_vl1._3l1=this._jl1;
				_vl1._7l1=this._ll1;
			}
			if(index<this._il1-2)
			{
				_vl1._6l1=this._hl1[index+2];
				_vl1._8l1=true;
			}
			else 
			{
				_vl1._6l1=this._kl1;
				_vl1._8l1=this._ml1;
			}
		}
		,_Gk1:
function(transform,_fx)
		{
			return false;
		}
		,_Hk1:
function(output,input,_hj1,_Ik1)
		{
			_Ih1(_Ik1<this._il1);
			var _wl1=_Ik1;
			var _xl1=_Ik1+1;
			if(_xl1==this._il1)
			{
				_xl1=0;
			}
			_gl1._nl1._4l1=this._hl1[_wl1]._72();
			_gl1._nl1._5l1=this._hl1[_xl1]._72();
			return _gl1._nl1._Hk1(output,input,_hj1,0);
		}
		,_Jk1:
function(_Kk1,_hj1,_Ik1)
		{
			_Ih1(_Ik1<this._il1);
			var _wl1=_Ik1;
			var _xl1=_Ik1+1;
			if(_xl1==this._il1)
			{
				_xl1=0;
			}
			var _wa=(_hj1.q.c*this._hl1[_wl1].x-_hj1.q._hg*this._hl1[_wl1].y)+_hj1._fx.x;
			var _xa=(_hj1.q._hg*this._hl1[_wl1].x+_hj1.q.c*this._hl1[_wl1].y)+_hj1._fx.y;
			var _ya=(_hj1.q.c*this._hl1[_xl1].x-_hj1.q._hg*this._hl1[_xl1].y)+_hj1._fx.x;
			var _za=(_hj1.q._hg*this._hl1[_xl1].x+_hj1.q.c*this._hl1[_xl1].y)+_hj1._fx.y;
			_Kk1._Yk1.x=_Uj1(_wa,_ya);
			_Kk1._Yk1.y=_Uj1(_xa,_za);
			_Kk1._Zk1.x=_Wj1(_wa,_ya);
			_Kk1._Zk1.y=_Wj1(_xa,_za);
		}
		,_Lk1:
function(_Mk1,_j_)
		{
			_Mk1._Bk1=0.0;
			_Mk1._fk1._xi1();
			_Mk1._Ck1=0.0;
		}
		,_Nk1:
function(_hj1,_fx,_Ok1,_Pk1,_Ik1)
		{
			this._ul1(_gl1._nl1,_Ik1);
			_gl1._nl1._Nk1(_hj1,_fx,_Ok1,_Pk1,0);
		}
		,_Ji1:
function(out)
		{
			var __i=out||
			{
			}
			;
			this.parent.prototype._Ji1.call(this,__i);
			__i['m_count']=this._il1;
			__i['m_vertices']=[];
			for(var i=0;i<this._il1;++i)__i['m_vertices'].push(this._hl1[i]._Ji1());
			__i['m_hasPrevVertex']=this._ll1;
			if(this._ll1)__i['m_prevVertex']=this._jl1._Ji1();
			__i['m_hasNextVertex']=this._ml1;
			if(this._ml1)__i['m_nextVertex']=this._kl1._Ji1();
			return __i;
		}
		,_Ki1:
function(data)
		{
			this.parent.prototype._Ki1.call(this,data);
			this._il1=data['m_count'];
			this._hl1=[];
			for(var i=0;i<this._il1;
++i)
			{
				this._hl1[i]=new _wi1();
				this._hl1[i]._Ki1(data['m_vertices'][i]);
			}
			this._ll1=data['m_hasPrevVertex'];
			if(this._ll1)this._jl1._Ki1(data['m_prevVertex']);
			this._ml1=data['m_hasNextVertex'];
			if(this._ml1)this._kl1._Ki1(data['m_nextVertex']);
		}
	}
	;
	_gl1._fh1(_Dk1);

	function _yl1()
	{
		this.parent.call(this);
		this._yF=_Dk1._Sk1;
		this._Ek1=_Th1;
		this._il1=0;
		this._zl1=new _wi1();
		this._hl1=new Array(_Oh1);
		this._Al1=new Array(_Oh1);
		Object.seal(this);
	}
	_yl1.prototype=
	{
		_72:
function()
		{
			var shape=new _yl1();
			shape._il1=this._il1;
			shape._zl1=this._zl1._72();
			for(var i=0;i<this._il1;++i)
			{
				shape._hl1[i]=this._hl1[i]._72();
				shape._Al1[i]=this._Al1[i]._72();
			}
			return shape;
		}
		,_Fk1:
function()
		{
			return 1;
		}
		,Set:
function(vertices,_u7)
		{
			_Ih1(3<=_u7&&_u7<=_Oh1);
			if(_u7<3)
			{
				this._Bl1(1.0,1.0);
				return;
			}
			var _u5=_Uj1(_u7,_Oh1);
			var _DA=new Array(_Oh1);
			var _Cl1=0;
			for(var i=0;i<_u5;++i)
			{
				var _Z3=vertices[i];
				var _Dl1=true;
				for(var _05=0;_05<_Cl1;++_05)
				{
					if(_zj1(_Z3,_DA[_05])<0.5*_Rh1)
					{
						_Dl1=false;
						break;
					}
				}
				if(_Dl1)
				{
					_DA[_Cl1++]=_Z3._72();
				}
			}
			_u5=_Cl1;
			if(_u5<3)
			{
				_Ih1(false);
				this._Bl1(1.0,1.0);
				return;
			}
			var _El1=0;
			var _4a=_DA[0].x;
			for(i=1;i<_u5;++i)
			{
				var x=_DA[i].x;
				if(x>_4a||(x==_4a&&_DA[i].y<_DA[_El1].y))
				{
					_El1=i;
					_4a=x;
				}
			}
			var hull=new Array(_Oh1);
			var _w5=0;
			var _Fl1=_El1;
			for(;;)
			{
				hull[_w5]=_Fl1;
				var _Gl1=0;
				for(_05=1;_05<_u5;++_05)
				{
					if(_Gl1==_Fl1)
					{
						_Gl1=_05;
						continue;
					}
					var _f3=_wi1._Di1(_DA[_Gl1],_DA[hull[_w5]]);
					var _Z3=_wi1._Di1(_DA[_05],_DA[hull[_w5]]);
					var c=_tj1(_f3,_Z3);
					if(c<0.0)
					{
						_Gl1=_05;
					}
					if(c==0.0&&_Z3._Ei1()>_f3._Ei1())
					{
						_Gl1=_05;
					}
				}
				++_w5;
				_Fl1=_Gl1;
				if(_Gl1==_El1)
				{
					break;
				}
			}
			this._il1=_w5;
			for(i=0;i<_w5;++i)
			{
				this._hl1[i]=_DA[hull[i]]._72();
			}
			for(i=0;i<_w5;++i)
			{
				var _wl1=i;
				var _xl1=i+1<_w5?i+1:0;
				var _vl1=_wi1._Di1(this._hl1[_xl1],this._hl1[_wl1]);
				_Ih1(_vl1._Ei1()>_Lh1*_Lh1);
				this._Al1[i]=_uj1(_vl1,1.0)._72();
				this._Al1[i]._Fi1();
			}
			this._zl1=_yl1._Hl1(this._hl1,_w5);
		}
		,_Bl1:
function(_Il1,_Jl1,_fk1,angle)
		{
			this._il1=4;
			this._hl1[0]=new _wi1(-_Il1,-_Jl1);
			this._hl1[1]=new _wi1(_Il1,-_Jl1);
			this._hl1[2]=new _wi1(_Il1,_Jl1);
			this._hl1[3]=new _wi1(-_Il1,_Jl1);
			this._Al1[0]=new _wi1(0.0,-1.0);
			this._Al1[1]=new _wi1(1.0,0.0);
			this._Al1[2]=new _wi1(0.0,1.0);
			this._Al1[3]=new _wi1(-1.0,0.0);
			if(!_fk1)return;
			this._zl1._PG(_fk1);
			var _hj1=new _gj1();
			_hj1._fx=_fk1;
			_hj1.q.Set(angle);
			for(var i=0;i<this._il1;++i)
			{
				this._hl1[i]._PG(_Jj1(_hj1,this._hl1[i]));
				this._Al1[i]._PG(_Hj1(_hj1.q,this._Al1[i]));
			}
		}
		,_Gk1:
function(_hj1,_fx)
		{
			var _Kl1=_Ij1(_hj1.q,_wi1._Di1(_fx,_hj1._fx));
			for(var i=0;i<this._il1;++i)
			{
				var _xw=_sj1(this._Al1[i],_wi1._Di1(_Kl1,this._hl1[i]));
				if(_xw>0.0)
				{
					return false;
				}
			}
			return true;
		}
		,_Hk1:
function(output,input,_hj1,_Ik1)
		{
			var _sn=_Ij1(_hj1.q,_wi1._Di1(input._sn,_hj1._fx));
			var _ik1=_Ij1(_hj1.q,_wi1._Di1(input._ik1,_hj1._fx));
			var _en=_wi1._Di1(_ik1,_sn);
			var _1P=0.0,_Ll1=input._O_;
			var index=-1;
			for(var i=0;i<this._il1;++i)
			{
				var _9l1=_sj1(this._Al1[i],_wi1._Di1(this._hl1[i],_sn));
				var _al1=_sj1(this._Al1[i],_en);
				if(_al1==0.0)
				{
					if(_9l1<0.0)
					{
						return false;
					}
				}
				else 
				{
					if(_al1<0.0&&_9l1<_1P*_al1)
					{
						_1P=_9l1/_al1;
						index=i;
					}
					else if(_al1>0.0&&_9l1<_Ll1*_al1)
					{
						_Ll1=_9l1/_al1;
					}
				}
				if(_Ll1<_1P)
				{
					return false;
				}
			}
			_Ih1(0.0<=_1P&&_1P<=input._O_);
			if(index>=0)
			{
				output._T_=_1P;
				output._Pk1=_Hj1(_hj1.q,this._Al1[index]);
				return true;
			}
			return false;
		}
		,_Jk1:
function(_Kk1,_hj1,_Ik1)
		{
			var _bl1=(_hj1.q.c*this._hl1[0].x-_hj1.q._hg*this._hl1[0].y)+_hj1._fx.x;
			var _cl1=(_hj1.q._hg*this._hl1[0].x+_hj1.q.c*this._hl1[0].y)+_hj1._fx.y;
			var _dl1=_bl1;
			var _el1=_cl1;
			for(var i=1;i<this._il1;++i)
			{
				var _U9=(_hj1.q.c*this._hl1[i].x-_hj1.q._hg*this._hl1[i].y)+_hj1._fx.x;
				var _V9=(_hj1.q._hg*this._hl1[i].x+_hj1.q.c*this._hl1[i].y)+_hj1._fx.y;
				_bl1=_Uj1(_bl1,_U9);
				_cl1=_Uj1(_cl1,_V9);
				_dl1=_Wj1(_dl1,_U9);
				_el1=_Wj1(_el1,_V9);
			}
			_Kk1._Yk1.x=_bl1-this._Ek1;
			_Kk1._Yk1.y=_cl1-this._Ek1;
			_Kk1._Zk1.x=_dl1+this._Ek1;
			_Kk1._Zk1.y=_el1+this._Ek1;
		}
		,_Lk1:
function(_Mk1,_j_)
		{
			_Ih1(this._il1>=3);
			var _fk1=new _wi1(0.0,0.0);
			var _Ml1=0.0;
			var _Ck1=0.0;
			var _hg=new _wi1(0.0,0.0);
			for(var i=0;i<this._il1;++i)
			{
				_hg._ce(this._hl1[i]);
			}
			_hg.Multiply(1.0/this._il1);
			var _Nl1=1.0/3.0;
			for(var i=0;i<this._il1;++i)
			{
				var _Ol1=_wi1._Di1(this._hl1[i],_hg);
				var _Pl1=i+1<this._il1?_wi1._Di1(this._hl1[i+1],_hg):_wi1._Di1(this._hl1[0],_hg);
				var _Ql1=_tj1(_Ol1,_Pl1);
				var _Rl1=0.5*_Ql1;
				_Ml1+=_Rl1;
				_fk1._ce(_wi1.Multiply(_Rl1*_Nl1,_wi1._ce(_Ol1,_Pl1)));
				var _Sl1=_Ol1.x,_Tl1=_Ol1.y;
				var _Ul1=_Pl1.x,_Vl1=_Pl1.y;
				var _Wl1=_Sl1*_Sl1+_Ul1*_Sl1+_Ul1*_Ul1;
				var _Xl1=_Tl1*_Tl1+_Vl1*_Tl1+_Vl1*_Vl1;
				_Ck1+=(0.25*_Nl1*_Ql1)*(_Wl1+_Xl1);
			}
			_Mk1._Bk1=_j_*_Ml1;
			_Ih1(_Ml1>_Lh1);
			_fk1.Multiply(1.0/_Ml1);
			_Mk1._fk1=_wi1._ce(_fk1,_hg);
			_Mk1._Ck1=_j_*_Ck1;
			_Mk1._Ck1+=_Mk1._Bk1*(_sj1(_Mk1._fk1,_Mk1._fk1)-_sj1(_fk1,_fk1));
		}
		,_Mc:
function()
		{
			return this._il1;
		}
		,_1l1:
function(index)
		{
			_Ih1(0<=index&&index<this._il1);
			return this._hl1[index];
		}
		,_Yl1:
function()
		{
			for(var i=0;
i<this._il1;++i)
			{
				var _wl1=i;
				var _xl1=i<this._il1-1?_wl1+1:0;
				var _fx=this._hl1[_wl1];
				var e=_wi1._Di1(this._hl1[_xl1],_fx);
				for(var _05=0;_05<this._il1;++_05)
				{
					if(_05==_wl1||_05==_xl1)
					{
						continue;
					}
					var _Z3=_wi1._Di1(this._hl1[_05],_fx);
					var c=_tj1(e,_Z3);
					if(c<0.0)
					{
						return false;
					}
				}
			}
			return true;
		}
		,_Nk1:
function(_hj1,_fx,_Zl1,_Pk1,_Ik1)
		{
			var _Kl1=_Ij1(_hj1.q,_wi1._Di1(_fx,_hj1._fx));
			var maxDistance=-Number.MAX_VALUE;
			var __l1=_Kl1;
			for(var i=0;i<this._il1;++i)
			{
				var _xw=_sj1(this._Al1[i],_wi1._Di1(_Kl1,this._hl1[i]));
				if(_xw>maxDistance)
				{
					maxDistance=_xw;
					__l1=this._Al1[i];
				}
			}
			if(maxDistance>0)
			{
				var _0m1=__l1;
				var _1m1=maxDistance*maxDistance;
				for(var i=0;i<this._il1;++i)
				{
					var _Ok1=_wi1._Di1(_Kl1,this._hl1[i]);
					var _2m1=_Ok1._Ei1();
					if(_1m1>_2m1)
					{
						_0m1=_Ok1;
						_1m1=_2m1;
					}
				}
				_Zl1[0]=_ti1(_1m1);
				_Pk1._PG(_Hj1(_hj1.q,_0m1));
				_Pk1._Fi1();
			}
			else 
			{
				_Zl1[0]=maxDistance;
				_Pk1._PG(_Hj1(_hj1.q,__l1));
			}
		}
		,_Ji1:
function(out)
		{
			var __i=out||
			{
			}
			;
			this.parent.prototype._Ji1.call(this,__i);
			__i['m_count']=this._il1;
			__i['m_centroid']=this._zl1._Ji1();
			__i['m_vertices']=[];
			__i['m_normals']=[];
			for(var i=0;i<this._il1;++i)
			{
				__i['m_vertices'].push(this._hl1[i]._Ji1());
				__i['m_normals'].push(this._Al1[i]._Ji1());
			}
			return __i;
		}
		,_Ki1:
function(data)
		{
			this.parent.prototype._Ki1.call(this,data);
			this._il1=data['m_count'];
			this._zl1._Ki1(data['m_centroid']);
			this._hl1=[];
			this._Al1=[];
			for(var i=0;i<this._il1;++i)
			{
				this._hl1[i]=new _wi1();
				this._hl1[i]._Ki1(data['m_vertices'][i]);
				this._Al1[i]=new _wi1();
				this._Al1[i]._Ki1(data['m_normals'][i]);
			}
		}
	}
	;
	_yl1._Hl1=
function(_3m1,_u7)
	{
		_Ih1(_u7>=3);
		var c=new _wi1();
		var _Ml1=0.0;
		var _4m1=new _wi1(0.0,0.0);
		var _5m1=1.0/3.0;
		for(var i=0;i<_u7;++i)
		{
			var _sn=_4m1;
			var _ik1=_3m1[i];
			var _6m1=i+1<_u7?_3m1[i+1]:_3m1[0];
			var _Ol1=_wi1._Di1(_ik1,_sn);
			var _Pl1=_wi1._Di1(_6m1,_sn);
			var _Ql1=_tj1(_Ol1,_Pl1);
			var _Rl1=0.5*_Ql1;
			_Ml1+=_Rl1;
			c._ce(_wi1.Multiply(_Rl1,_wi1.Multiply(_5m1,_wi1._ce(_wi1._ce(_sn,_ik1),_6m1))));
		}
		_Ih1(_Ml1>_Lh1);
		c.Multiply(1.0/_Ml1);
		return c;
	}
	;
	_yl1._fh1(_Dk1);

	function _7m1()
	{
		this._8m1=0;
		this._9m1=0;
	}

	function _am1(_bm1,_cm1)
	{
		if(_bm1._8m1==_cm1._8m1)
		{
			return _bm1._9m1-_cm1._9m1;
		}
		return _bm1._8m1-_cm1._8m1;
	}

	function _dm1()
	{
		this._em1=new _fm1();
		this._gm1=0;
		this._hm1=0;
		this._im1=0;
		this._jm1=[];
		this._km1=0;
		this._lm1=[];
	}
	_dm1.prototype=
	{
		_mm1:
function(_Kk1,_nm1)
		{
			var _om1=this._em1._mm1(_Kk1,_nm1);
			++this._hm1;
			this._pm1(_om1);
			return _om1;
		}
		,_qm1:
function(_om1)
		{
			this._rm1(_om1);
			--this._hm1;
			this._em1._qm1(_om1);
		}
		,_sm1:
function(_om1,_Kk1,_tm1)
		{
			var buffer=this._em1._sm1(_om1,_Kk1,_tm1);
			if(buffer)
			{
				this._pm1(_om1);
			}
		}
		,_um1:
function(_om1)
		{
			this._pm1(_om1);
		}
		,_vm1:
function(_om1)
		{
			return this._em1._vm1(_om1);
		}
		,_wm1:
function(_om1)
		{
			return this._em1._wm1(_om1);
		}
		,_AZ:
function(_8m1,_9m1)
		{
			var _xm1=this._em1._vm1(_8m1);
			var _ym1=this._em1._vm1(_9m1);
			return _zm1(_xm1,_ym1);
		}
		,_Am1:
function()
		{
			return this._hm1;
		}
		,_Bm1:
function(_Ae1)
		{
			this._im1=0;
			this._jm1.length=0;
			for(var i=0;i<this._km1;++i)
			{
				this._gm1=this._lm1[i];
				if(this._gm1==_dm1._Cm1)
				{
					continue;
				}
				var _Dm1=this._em1._vm1(this._gm1);
				this._em1._Em1(this,_Dm1);
			}
			this._km1=0;
			this._jm1.sort(_am1);
			var i=0;
			while(i<this._im1) 
			{
				var _Fm1=this._jm1[i];
				var _Gm1=this._em1._wm1(_Fm1._8m1);
				var _Hm1=this._em1._wm1(_Fm1._9m1);
				_Ae1._Im1(_Gm1,_Hm1);
				++i;
				while(i<this._im1) 
				{
					var _Jm1=this._jm1[i];
					if(_Jm1._8m1!=_Fm1._8m1||_Jm1._9m1!=_Fm1._9m1)
					{
						break;
					}
					++i;
				}
			}
		}
		,_Em1:
function(_Ae1,_Kk1)
		{
			this._em1._Em1(_Ae1,_Kk1);
		}
		,_Hk1:
function(_Ae1,input)
		{
			this._em1._Hk1(_Ae1,input);
		}
		,_Km1:
function()
		{
			return this._em1._HD();
		}
		,_Lm1:
function()
		{
			return this._em1._Mm1();
		}
		,_Nm1:
function()
		{
			return this._em1._Om1();
		}
		,_Pm1:
function(_Qm1)
		{
			this._em1._Pm1(_Qm1);
		}
		,_pm1:
function(_om1)
		{
			this._lm1[this._km1]=_om1;
			++this._km1;
		}
		,_rm1:
function(_om1)
		{
			for(var i=0;i<this._km1;
++i)
			{
				if(this._lm1[i]==_om1)
				{
					this._lm1[i]=_dm1._Cm1;
				}
			}
		}
		,_Rm1:
function(_om1)
		{
			if(_om1==this._gm1)
			{
				return true;
			}
			this._jm1[this._im1]=new _7m1();
			this._jm1[this._im1]._8m1=_Uj1(_om1,this._gm1);
			this._jm1[this._im1]._9m1=_Wj1(_om1,this._gm1);
			++this._im1;
			return true;
		}
	}
	;
	_dm1._Cm1=-1;

	function _Sm1()
	{
		this._hl1=null;
		this._il1=0;
		this._Ek1=0;
	}
	_Sm1.prototype=
	{
		_PG:
function(_H5)
		{
			this._hl1=_H5._hl1;
			this._il1=_H5._il1;
			this._Ek1=_H5._Ek1;
		}
		,Set:
function(shape,index)
		{
			switch(shape._9e1())
			{
				case _Dk1._Qk1:
				{
					var _Tm1=shape;
					this._hl1=[_Tm1._Wk1];
					this._il1=1;
					this._Ek1=_Tm1._Ek1;
				}
				break;
				case _Dk1._Sk1:
				{
					var _j5=shape;
					this._hl1=_j5._hl1;
					this._il1=_j5._il1;
					this._Ek1=_j5._Ek1;
				}
				break;
				case _Dk1._Tk1:
				{
					var _Um1=shape;
					_Ih1(0<=index&&index<_Um1._il1);
					this._hl1=[_Um1._hl1[index]];
					if(index+1<_Um1._il1)
					{
						this._hl1[1]=_Um1._hl1[index+1];
					}
					else 
					{
						this._hl1[1]=_Um1._hl1[0];
					}
					this._il1=2;
					this._Ek1=_Um1._Ek1;
				}
				break;
				case _Dk1._Rk1:
				{
					var _vl1=shape;
					this._hl1=[_vl1._4l1,_vl1._5l1];
					this._il1=2;
					this._Ek1=_vl1._Ek1;
				}
				break;
				default :_Ih1(false);
			}
		}
		,__k1:
function(_ha,_ia)
		{
			var _Vm1=0;
			var _Wm1=this._hl1[0].x*_ha+this._hl1[0].y*_ia;
			for(var i=1;i<this._il1;++i)
			{
				var value=this._hl1[i].x*_ha+this._hl1[i].y*_ia;
				if(value>_Wm1)
				{
					_Vm1=i;
					_Wm1=value;
				}
			}
			return _Vm1;
		}
		,_0l1:
function(_ha,_ia)
		{
			return this._hl1[this.__k1(_ha,_ia)];
		}
		,_Mc:
function()
		{
			return this._il1;
		}
		,_1l1:
function(index)
		{
			_Ih1(0<=index&&index<this._il1);
			return this._hl1[index];
		}
	}
	;

	function _Xm1()
	{
		this._Ym1=0;
		this._u7=0;
		this._Zm1=[0,0,0];
		this.__m1=[0,0,0];
	}
	;

	function _0n1()
	{
		this._1n1=new _Sm1();
		this._2n1=new _Sm1();
		this._3n1=new _gj1();
		this._4n1=new _gj1();
		this._5n1=false;
	}
	;

	function _6n1()
	{
		this._7n1=new _wi1();
		this._8n1=new _wi1();
		this._Ok1=0;
		this.iterations=0;
	}
	;

	function _9n1()
	{
		this._an1=new _wi1();
		this._bn1=new _wi1();
		this.w=new _wi1();
		this._i3=0;
		this._Zm1=0;
		this.__m1=0;
	}
	_9n1.prototype=
	{
		_PG:
function(_H5)
		{
			this._an1.x=_H5._an1.x;
			this._an1.y=_H5._an1.y;
			this._bn1.x=_H5._bn1.x;
			this._bn1.y=_H5._bn1.y;
			this.w.x=_H5.w.x;
			this.w.y=_H5.w.y;
			this._i3=_H5._i3;
			this._Zm1=_H5._Zm1;
			this.__m1=_H5.__m1;
		}
	}
	;

	function _cn1()
	{
		this._dn1=[new _9n1(),new _9n1(),new _9n1()];
		this._il1=0;
	}
	_cn1.prototype=
	{
		_en1:
function(_t7,_1n1,_3n1,_2n1,_4n1)
		{
			_Ih1(_t7._u7<=3);
			this._il1=_t7._u7;
			var vertices=this._dn1;
			for(var i=0;i<this._il1;++i)
			{
				var _Z3=vertices[i];
				_Z3._Zm1=_t7._Zm1[i];
				_Z3.__m1=_t7.__m1[i];
				var _fn1=_1n1._1l1(_Z3._Zm1);
				var _gn1=_2n1._1l1(_Z3.__m1);
				_Z3._an1.x=(_3n1.q.c*_fn1.x-_3n1.q._hg*_fn1.y)+_3n1._fx.x;
				_Z3._an1.y=(_3n1.q._hg*_fn1.x+_3n1.q.c*_fn1.y)+_3n1._fx.y;
				_Z3._bn1.x=(_4n1.q.c*_gn1.x-_4n1.q._hg*_gn1.y)+_4n1._fx.x;
				_Z3._bn1.y=(_4n1.q._hg*_gn1.x+_4n1.q.c*_gn1.y)+_4n1._fx.y;
				_Z3.w.x=_Z3._bn1.x-_Z3._an1.x;
				_Z3.w.y=_Z3._bn1.y-_Z3._an1.y;
				_Z3._i3=0.0;
			}
			if(this._il1>1)
			{
				var _hn1=_t7._Ym1;
				var _in1=this._jn1();
				if(_in1<0.5*_hn1||2.0*_hn1<_in1||_in1<_Lh1)
				{
					this._il1=0;
				}
			}
			if(this._il1==0)
			{
				var _Z3=vertices[0];
				_Z3._Zm1=0;
				_Z3.__m1=0;
				var _fn1=_1n1._1l1(0);
				var _gn1=_2n1._1l1(0);
				_Z3._an1.x=(_3n1.q.c*_fn1.x-_3n1.q._hg*_fn1.y)+_3n1._fx.x;
				_Z3._an1.y=(_3n1.q._hg*_fn1.x+_3n1.q.c*_fn1.y)+_3n1._fx.y;
				_Z3._bn1.x=(_4n1.q.c*_gn1.x-_4n1.q._hg*_gn1.y)+_4n1._fx.x;
				_Z3._bn1.y=(_4n1.q._hg*_gn1.x+_4n1.q.c*_gn1.y)+_4n1._fx.y;
				_Z3.w.x=_Z3._bn1.x-_Z3._an1.x;
				_Z3.w.y=_Z3._bn1.y-_Z3._an1.y;
				_Z3._i3=1.0;
				this._il1=1;
			}
		}
		,_kn1:
function(_t7)
		{
			_t7._Ym1=this._jn1();
			_t7._u7=this._il1;
			var vertices=this._dn1;
			for(var i=0;i<this._il1;++i)
			{
				_t7._Zm1[i]=vertices[i]._Zm1;
				_t7.__m1[i]=vertices[i].__m1;
			}
		}
		,_ln1:
function(_fx)
		{
			switch(this._il1)
			{
				case 1:_fx.x=-this._dn1[0].w.x;
				_fx.y=-this._dn1[0].w.y;
				break;
				case 2:
				{
					var _mn1=this._dn1[1].w.x-this._dn1[0].w.x;
					var _nn1=this._dn1[1].w.y-this._dn1[0].w.y;
					var _on1=_mn1*-this._dn1[0].w.y-_nn1*-this._dn1[0].w.x;
					if(_on1>0.0)
					{
						_fx.x=-1.0*_nn1;
						_fx.y=1.0*_mn1;
					}
					else 
					{
						_fx.x=1.0*_nn1;
						_fx.y=-1.0*_mn1;
					}
				}
				break;
				default :_Ih1(false);
				_fx.x=_fx.y=0;
				break;
			}
		}
		,_pn1:
function(_fx)
		{
			switch(this._il1)
			{
				case 1:_fx.x=this._dn1[0].w.x;
				_fx.y=this._dn1[0].w.y;
				break;
				case 2:_fx.x=(this._dn1[0]._i3*this._dn1[0].w.x)+(this._dn1[1]._i3*this._dn1[1].w.x);
				_fx.y=(this._dn1[0]._i3*this._dn1[0].w.y)+(this._dn1[1]._i3*this._dn1[1].w.y);
				break;
				case 3:_fx.x=_fx.y=0;
				break;
				default :_Ih1(false);
				_fx.x=_fx.y=0;
				break;
			}
		}
		,_qn1:
function(_rn1,_sn1)
		{
			switch(this._il1)
			{
				case 1:_rn1.x=this._dn1[0]._an1.x;
				_rn1.y=this._dn1[0]._an1.y;
				_sn1.x=this._dn1[0]._bn1.x;
				_sn1.y=this._dn1[0]._bn1.y;
				break;
				case 2:_rn1.x=(this._dn1[0]._i3*this._dn1[0]._an1.x)+(this._dn1[1]._i3*this._dn1[1]._an1.x);
				_rn1.y=(this._dn1[0]._i3*this._dn1[0]._an1.y)+(this._dn1[1]._i3*this._dn1[1]._an1.y);
				_sn1.x=(this._dn1[0]._i3*this._dn1[0]._bn1.x)+(this._dn1[1]._i3*this._dn1[1]._bn1.x);
				_sn1.y=(this._dn1[0]._i3*this._dn1[0]._bn1.y)+(this._dn1[1]._i3*this._dn1[1]._bn1.y);
				break;
				case 3:_rn1.x=(this._dn1[0]._i3*this._dn1[0]._an1.x)+(this._dn1[1]._i3*this._dn1[1]._an1.x)+(this._dn1[2]._i3*this._dn1[2]._an1.x);
				_rn1.y=(this._dn1[0]._i3*this._dn1[0]._an1.y)+(this._dn1[1]._i3*this._dn1[1]._an1.y)+(this._dn1[2]._i3*this._dn1[2]._an1.y);
				_sn1.x=_rn1.x;
				_sn1.y=_rn1.y;
				break;
				default :_Ih1(false);
				break;
			}
		}
		,_jn1:
function()
		{
			switch(this._il1)
			{
				case 1:return 0.0;
				case 2:return _yj1(this._dn1[0].w,this._dn1[1].w);
				case 3:return(this._dn1[1].w.x-this._dn1[0].w.x)*(this._dn1[2].w.y-this._dn1[0].w.y)-(this._dn1[1].w.y-this._dn1[0].w.y)*(this._dn1[2].w.x-this._dn1[0].w.x);
				default :_Ih1(false);
				return 0.0;
			}
		}
		,_tn1:
function()
		{
			var _un1=this._dn1[0].w;
			var _vn1=this._dn1[1].w;
			var _mn1=_vn1.x-_un1.x;
			var _nn1=_vn1.y-_un1.y;
			var _wn1=-(_un1.x*_mn1+_un1.y*_nn1);
			if(_wn1<=0.0)
			{
				this._dn1[0]._i3=1.0;
				this._il1=1;
				return;
			}
			var _xn1=_vn1.x*_mn1+_vn1.y*_nn1;
			if(_xn1<=0.0)
			{
				this._dn1[1]._i3=1.0;
				this._il1=1;
				this._dn1[0]._PG(this._dn1[1]);
				return;
			}
			var _yn1=1.0/(_xn1+_wn1);
			this._dn1[0]._i3=_xn1*_yn1;
			this._dn1[1]._i3=_wn1*_yn1;
			this._il1=2;
		}
		,_zn1:
function()
		{
			var _un1=this._dn1[0].w;
			var _vn1=this._dn1[1].w;
			var _An1=this._dn1[2].w;
			var _mn1=_vn1.x-_un1.x;
			var _nn1=_vn1.y-_un1.y;
			var _Bn1=_un1.x*_mn1+_un1.y*_nn1;
			var _Cn1=_vn1.x*_mn1+_vn1.y*_nn1;
			var _xn1=_Cn1;
			var _wn1=-_Bn1;
			var _Dn1=_An1.x-_un1.x;
			var _En1=_An1.y-_un1.y;
			var _Fn1=_un1.x*_Dn1+_un1.y*_En1;
			var _Gn1=_An1.x*_Dn1+_An1.y*_En1;
			var _Hn1=_Gn1;
			var _In1=-_Fn1;
			var _Jn1=_An1.x-_vn1.x;
			var _Kn1=_An1.y-_vn1.y;
			var _Ln1=_vn1.x*_Jn1+_vn1.y*_Kn1;
			var _Mn1=_An1.x*_Jn1+_An1.y*_Kn1;
			var _Nn1=_Mn1;
			var _On1=-_Ln1;
			var _Pn1=_mn1*_En1-_nn1*_Dn1;
			var _Qn1=_Pn1*(_vn1.x*_An1.y-_vn1.y*_An1.x);
			var _Rn1=_Pn1*(_An1.x*_un1.y-_An1.y*_un1.x);
			var _Sn1=_Pn1*(_un1.x*_vn1.y-_un1.y*_vn1.x);
			if(_wn1<=0.0&&_In1<=0.0)
			{
				this._dn1[0]._i3=1.0;
				this._il1=1;
				return;
			}
			if(_xn1>0.0&&_wn1>0.0&&_Sn1<=0.0)
			{
				var _yn1=1.0/(_xn1+_wn1);
				this._dn1[0]._i3=_xn1*_yn1;
				this._dn1[1]._i3=_wn1*_yn1;
				this._il1=2;
				return;
			}
			if(_Hn1>0.0&&_In1>0.0&&_Rn1<=0.0)
			{
				var _Tn1=1.0/(_Hn1+_In1);
				this._dn1[0]._i3=_Hn1*_Tn1;
				this._dn1[2]._i3=_In1*_Tn1;
				this._il1=2;
				this._dn1[1]._PG(this._dn1[2]);
				return;
			}
			if(_xn1<=0.0&&_On1<=0.0)
			{
				this._dn1[1]._i3=1.0;
				this._il1=1;
				this._dn1[0]._PG(this._dn1[1]);
				return;
			}
			if(_Hn1<=0.0&&_Nn1<=0.0)
			{
				this._dn1[2]._i3=1.0;
				this._il1=1;
				this._dn1[0]._PG(this._dn1[2]);
				return;
			}
			if(_Nn1>0.0&&_On1>0.0&&_Qn1<=0.0)
			{
				var _Un1=1.0/(_Nn1+_On1);
				this._dn1[1]._i3=_Nn1*_Un1;
				this._dn1[2]._i3=_On1*_Un1;
				this._il1=2;
				this._dn1[0]._PG(this._dn1[2]);
				return;
			}
			var _Vn1=1.0/(_Qn1+_Rn1+_Sn1);
			this._dn1[0]._i3=_Qn1*_Vn1;
			this._dn1[1]._i3=_Rn1*_Vn1;
			this._dn1[2]._i3=_Sn1*_Vn1;
			this._il1=3;
		}
	}
	;
	var _Wn1=new _cn1();
	var _Xn1=new _wi1();
	var _Yn1=new _wi1();

	function _Zn1(output,_t7,input)
	{
		++_Zn1.__n1;
		var _1n1=input._1n1;
		var _2n1=input._2n1;
		var _3n1=input._3n1;
		var _4n1=input._4n1;
		_Wn1._en1(_t7,_1n1,_3n1,_2n1,_4n1);
		var vertices=_Wn1._dn1;
		var _0o1=20;
		var _1o1=[0,0,0],_2o1=[0,0,0];
		var _3o1=0;
		var _4o1=_Kh1;
		var _5o1=_4o1;
		var _Ba1=0;
		while(_Ba1<_0o1) 
		{
			_3o1=_Wn1._il1;
			for(var i=0;i<_3o1;++i)
			{
				_1o1[i]=vertices[i]._Zm1;
				_2o1[i]=vertices[i].__m1;
			}
			switch(_Wn1._il1)
			{
				case 1:break;
				case 2:_Wn1._tn1();
				break;
				case 3:_Wn1._zn1();
				break;
				default :_Ih1(false);
			}
			if(_Wn1._il1==3)
			{
				break;
			}
			_Wn1._pn1(_Yn1);
			_5o1=_Yn1._Ei1();
			_4o1=_5o1;
			_Wn1._ln1(_Yn1);
			if(_Yn1._Ei1()<_Lh1*_Lh1)
			{
				break;
			}
			var _6o1=vertices[_Wn1._il1];
			_6o1._Zm1=_1n1.__k1(_3n1.q.c*-_Yn1.x+_3n1.q._hg*-_Yn1.y,-_3n1.q._hg*-_Yn1.x+_3n1.q.c*-_Yn1.y);
			var _7o1=_1n1._1l1(_6o1._Zm1);
			_6o1._an1.x=(_3n1.q.c*_7o1.x-_3n1.q._hg*_7o1.y)+_3n1._fx.x;
			_6o1._an1.y=(_3n1.q._hg*_7o1.x+_3n1.q.c*_7o1.y)+_3n1._fx.y;
			_6o1.__m1=_2n1.__k1(_4n1.q.c*_Yn1.x+_4n1.q._hg*_Yn1.y,-_4n1.q._hg*_Yn1.x+_4n1.q.c*_Yn1.y);
			var _8o1=_2n1._1l1(_6o1.__m1);
			_6o1._bn1.x=(_4n1.q.c*_8o1.x-_4n1.q._hg*_8o1.y)+_4n1._fx.x;
			_6o1._bn1.y=(_4n1.q._hg*_8o1.x+_4n1.q.c*_8o1.y)+_4n1._fx.y;
			_6o1.w.x=_6o1._bn1.x-_6o1._an1.x;
			_6o1.w.y=_6o1._bn1.y-_6o1._an1.y;
			++_Ba1;
			++_Zn1._9o1;
			var _ao1=false;
			for(var i=0;i<_3o1;++i)
			{
				if(_6o1._Zm1==_1o1[i]&&_6o1.__m1==_2o1[i])
				{
					_ao1=true;
					break;
				}
			}
			if(_ao1)
			{
				break;
			}
			++_Wn1._il1;
		}
		_Zn1._bo1=_Wj1(_Zn1._bo1,_Ba1);
		_Wn1._qn1(output._7n1,output._8n1);
		output._Ok1=_yj1(output._7n1,output._8n1);
		output.iterations=_Ba1;
		_Wn1._kn1(_t7);
		if(input._5n1)
		{
			var _co1=_1n1._Ek1;
			var _do1=_2n1._Ek1;
			if(output._Ok1>_co1+_do1&&output._Ok1>_Lh1)
			{
				output._Ok1-=_co1+_do1;
				_Xn1.x=output._8n1.x-output._7n1.x;
				_Xn1.y=output._8n1.y-output._7n1.y;
				_Xn1._Fi1();
				output._7n1.x+=(_co1*_Xn1.x);
				output._7n1.y+=(_co1*_Xn1.y);
				output._8n1.x-=(_do1*_Xn1.x);
				output._8n1.y-=(_do1*_Xn1.y);
			}
			else 
			{
				var _0n=(0.5*(output._7n1.x+output._8n1.x));
				var _1n=(0.5*(output._7n1.y+output._8n1.y));
				output._7n1.x=_0n;
				output._7n1.y=_1n;
				output._8n1.x=_0n;
				output._8n1.y=_1n;
				output._Ok1=0.0;
			}
		}
	}
	_Zn1.__n1=0;
	_Zn1._9o1=0;
	_Zn1._bo1=0;
	var _eo1=255;

	function _fo1()
	{
	}
	_fo1.prototype=
	{
		_Zm1:0,__m1:0,_go1:0,_ho1:0,_WA:
function()
		{
			this._Zm1=this.__m1=this._go1=this._ho1=0;
		}
		,_F4:
function()
		{
			return this._Zm1|(this.__m1<<8)|(this._go1<<16)|(this._ho1<<24);
		}
		,_PG:
function(_ij)
		{
			this._Zm1=_ij._Zm1;
			this.__m1=_ij.__m1;
			this._go1=_ij._go1;
			this._ho1=_ij._ho1;
		}
	}
	;
	_fo1._io1=0;
	_fo1._jo1=1;

	function _ko1()
	{
		this._lo1=new _wi1();
		this._mo1=0;
		this._no1=0;
		this.id=new _fo1();
	}
	;
	_ko1.prototype=
	{
		_72:
function()
		{
			var _oo1=new _ko1();
			_oo1._lo1.x=this._lo1.x;
			_oo1._lo1.y=this._lo1.y;
			_oo1._mo1=this._mo1;
			_oo1._no1=this._no1;
			_oo1.id._PG(this.id);
			return _oo1;
		}
	}
	;

	function _po1()
	{
		this.points=new Array(_Nh1);
		this._qo1=new _wi1();
		this._lo1=new _wi1();
		this.type=0;
		this._ro1=0;
	}
	;
	_po1.prototype=
	{
		_72:
function()
		{
			var _so1=new _po1();
			_so1._ro1=this._ro1;
			_so1.type=this.type;
			_so1._lo1.x=this._lo1.x;
			_so1._lo1.y=this._lo1.y;
			_so1._qo1.x=this._qo1.x;
			_so1._qo1.y=this._qo1.y;
			for(var i=0;i<this._ro1;++i)_so1.points[i]=this.points[i]._72();
			return _so1;
		}
		,_PG:
function(_so1)
		{
			this._ro1=_so1._ro1;
			this.type=_so1.type;
			this._lo1.x=_so1._lo1.x;
			this._lo1.y=_so1._lo1.y;
			this._qo1.x=_so1._qo1.x;
			this._qo1.y=_so1._qo1.y;
			for(var i=0;i<this._ro1;++i)this.points[i]=_so1.points[i]._72();
		}
	}
	;
	_po1._to1=0;
	_po1._uo1=1;
	_po1._vo1=2;
	_po1._wo1=0;
	_po1._xo1=1;
	_po1._yo1=2;
	_po1._zo1=3;

	function _Ao1()
	{
		this._Pk1=new _wi1();
		this.points=new Array(_Nh1);
		this._Bo1=new Array(_Nh1);
	}
	_Ao1.prototype=
	{
		_Co1:
function(_so1,_Do1,_Eo1,_Fo1,_Go1)
		{
			if(_so1._ro1==0)
			{
				return;
			}
			switch(_so1.type)
			{
				case _po1._to1:
				{
					this._Pk1.x=1;
					this._Pk1.y=0;
					var _Ho1=(_Do1.q.c*_so1._lo1.x-_Do1.q._hg*_so1._lo1.y)+_Do1._fx.x;
					var _Io1=(_Do1.q._hg*_so1._lo1.x+_Do1.q.c*_so1._lo1.y)+_Do1._fx.y;
					var _Jo1=(_Fo1.q.c*_so1.points[0]._lo1.x-_Fo1.q._hg*_so1.points[0]._lo1.y)+_Fo1._fx.x;
					var _Ko1=(_Fo1.q._hg*_so1.points[0]._lo1.x+_Fo1.q.c*_so1.points[0]._lo1.y)+_Fo1._fx.y;
					var _Hm=_Ho1-_Jo1;
					var _Im=_Io1-_Ko1;
					if((_Hm*_Hm+_Im*_Im)>_Lh1*_Lh1)
					{
						this._Pk1.x=_Jo1-_Ho1;
						this._Pk1.y=_Ko1-_Io1;
						this._Pk1._Fi1();
					}
					var _Lo1=_Ho1+(_Eo1*this._Pk1.x);
					var _Mo1=_Io1+(_Eo1*this._Pk1.y);
					var _No1=_Jo1-(_Go1*this._Pk1.x);
					var _Oo1=_Ko1-(_Go1*this._Pk1.y);
					this.points[0]=new _wi1(0.5*(_Lo1+_No1),0.5*(_Mo1+_Oo1));
					this._Bo1[0]=(_No1-_Lo1)*this._Pk1.x+(_Oo1-_Mo1)*this._Pk1.y;
				}
				break;
				case _po1._uo1:
				{
					this._Pk1.x=_Do1.q.c*_so1._qo1.x-_Do1.q._hg*_so1._qo1.y;
					this._Pk1.y=_Do1.q._hg*_so1._qo1.x+_Do1.q.c*_so1._qo1.y;
					var _Po1=(_Do1.q.c*_so1._lo1.x-_Do1.q._hg*_so1._lo1.y)+_Do1._fx.x;
					var _Qo1=(_Do1.q._hg*_so1._lo1.x+_Do1.q.c*_so1._lo1.y)+_Do1._fx.y;
					for(var i=0;i<_so1._ro1;++i)
					{
						var _Ro1=(_Fo1.q.c*_so1.points[i]._lo1.x-_Fo1.q._hg*_so1.points[i]._lo1.y)+_Fo1._fx.x;
						var _So1=(_Fo1.q._hg*_so1.points[i]._lo1.x+_Fo1.q.c*_so1.points[i]._lo1.y)+_Fo1._fx.y;
						var _en=(_Ro1-_Po1)*this._Pk1.x+(_So1-_Qo1)*this._Pk1.y;
						var _Lo1=_Ro1+((_Eo1-_en)*this._Pk1.x);
						var _Mo1=_So1+((_Eo1-_en)*this._Pk1.y);
						var _No1=(_Ro1-(_Go1*this._Pk1.x));
						var _Oo1=(_So1-(_Go1*this._Pk1.y));
						this.points[i]=new _wi1(0.5*(_Lo1+_No1),0.5*(_Mo1+_Oo1));
						this._Bo1[i]=(_No1-_Lo1)*this._Pk1.x+(_Oo1-_Mo1)*this._Pk1.y;
					}
				}
				break;
				case _po1._vo1:
				{
					this._Pk1.x=_Fo1.q.c*_so1._qo1.x-_Fo1.q._hg*_so1._qo1.y;
					this._Pk1.y=_Fo1.q._hg*_so1._qo1.x+_Fo1.q.c*_so1._qo1.y;
					var _Po1=(_Fo1.q.c*_so1._lo1.x-_Fo1.q._hg*_so1._lo1.y)+_Fo1._fx.x;
					var _Qo1=(_Fo1.q._hg*_so1._lo1.x+_Fo1.q.c*_so1._lo1.y)+_Fo1._fx.y;
					for(var i=0;i<_so1._ro1;++i)
					{
						var _Ro1=(_Do1.q.c*_so1.points[i]._lo1.x-_Do1.q._hg*_so1.points[i]._lo1.y)+_Do1._fx.x;
						var _So1=(_Do1.q._hg*_so1.points[i]._lo1.x+_Do1.q.c*_so1.points[i]._lo1.y)+_Do1._fx.y;
						var _en=(_Ro1-_Po1)*this._Pk1.x+(_So1-_Qo1)*this._Pk1.y;
						var _No1=_Ro1+((_Go1-_en)*this._Pk1.x);
						var _Oo1=_So1+((_Go1-_en)*this._Pk1.y);
						var _Lo1=(_Ro1-(_Eo1*this._Pk1.x));
						var _Mo1=(_So1-(_Eo1*this._Pk1.y));
						this.points[i]=new _wi1(0.5*(_Lo1+_No1),0.5*(_Mo1+_Oo1));
						this._Bo1[i]=(_Lo1-_No1)*this._Pk1.x+(_Mo1-_Oo1)*this._Pk1.y;
					}
					this._Pk1.x=-this._Pk1.x;
					this._Pk1.y=-this._Pk1.y;
				}
				break;
			}
		}
	}
	;

	function _To1(_Uo1,_Vo1,_Wo1,_Xo1)
	{
		for(var i=0;i<_Nh1;++i)
		{
			_Uo1[i]=_po1._wo1;
			_Vo1[i]=_po1._wo1;
		}
		for(var i=0;i<_Wo1._ro1;++i)
		{
			var id=_Wo1.points[i].id;
			_Uo1[i]=_po1._zo1;
			for(var _05=0;_05<_Xo1._ro1;++_05)
			{
				if(_Xo1.points[_05].id._F4()==id._F4())
				{
					_Uo1[i]=_po1._yo1;
					break;
				}
			}
		}
		for(var i=0;i<_Xo1._ro1;++i)
		{
			var id=_Xo1.points[i].id;
			_Vo1[i]=_po1._xo1;
			for(var _05=0;_05<_Wo1._ro1;++_05)
			{
				if(_Wo1.points[_05].id._F4()==id._F4())
				{
					_Vo1[i]=_po1._yo1;
					break;
				}
			}
		}
	}

	function _Yo1()
	{
		this._Z3=new _wi1();
		this.id=new _fo1();
	}
	;

	function _Zo1()
	{
		this._sn=new _wi1(),this._ik1=new _wi1();
		this._O_=0;
	}
	;

	function __o1()
	{
		this._Pk1=new _wi1();
		this._T_=0;
	}
	;

	function _0p1()
	{
		this._Yk1=new _wi1();
		this._Zk1=new _wi1();
	}
	_0p1.prototype=
	{
		_PG:
function(other)
		{
			this._Yk1.x=other._Yk1.x;
			this._Yk1.y=other._Yk1.y;
			this._Zk1.x=other._Zk1.x;
			this._Zk1.y=other._Zk1.y;
		}
		,_72:
function()
		{
			var _1p1=new _0p1();
			_1p1._Yk1.x=this._Yk1.x;
			_1p1._Yk1.y=this._Yk1.y;
			_1p1._Zk1.x=this._Zk1.x;
			_1p1._Zk1.y=this._Zk1.y;
			return _1p1;
		}
		,_Hi1:
function()
		{
			return(this._Zk1.x-this._Yk1.x)>=0.0&&(this._Zk1.y-this._Yk1.y)>=0.0&&this._Yk1._Hi1()&&this._Zk1._Hi1();
		}
		,_2p1:
function()
		{
			return new _wi1(0.5*(this._Yk1.x+this._Zk1.x),0.5*(this._Yk1.y+this._Zk1.y));
		}
		,_3p1:
function()
		{
			return new _wi1(0.5*(this._Zk1.x-this._Yk1.x),0.5*(this._Zk1.y-this._Yk1.y));
		}
		,_4p1:
function()
		{
			return 2.0*((this._Zk1.x-this._Yk1.x)+(this._Zk1.y-this._Yk1.y));
		}
		,_5p1:
function(_6p1,_7p1)
		{
			if(_7p1)
			{
				this._Yk1.x=_Uj1(_6p1._Yk1.x,_7p1._Yk1.x);
				this._Yk1.y=_Uj1(_6p1._Yk1.y,_7p1._Yk1.y);
				this._Zk1.x=_Wj1(_6p1._Zk1.x,_7p1._Zk1.x);
				this._Zk1.y=_Wj1(_6p1._Zk1.y,_7p1._Zk1.y);
			}
			else 
			{
				this._Yk1.x=_Uj1(this._Yk1.x,_6p1._Yk1.x);
				this._Yk1.y=_Uj1(this._Yk1.y,_6p1._Yk1.y);
				this._Zk1.x=_Wj1(this._Zk1.x,_6p1._Zk1.x);
				this._Zk1.y=_Wj1(this._Zk1.y,_6p1._Zk1.y);
			}
		}
		,_8p1:
function(_Kk1)
		{
			return this._Yk1.x<=_Kk1._Yk1.x&&this._Yk1.y<=_Kk1._Yk1.y&&_Kk1._Zk1.x<=this._Zk1.x&&_Kk1._Zk1.y<=this._Zk1.y;
		}
		,_Hk1:
function(output,input)
		{
			var _9p1=-_Kh1;
			var _ap1=_Kh1;
			var _fx=input._sn;
			var _en=_wi1._Di1(input._ik1,input._sn);
			var _bp1=_Sj1(_en);
			var _Pk1=new _wi1();
			for(var i=0;i<2;++i)
			{
				if(_bp1._Bi1(i)<_Lh1)
				{
					if(_fx._Bi1(i)<this._Yk1._Bi1(i)||this._Zk1._Bi1(i)<_fx._Bi1(i))
					{
						return false;
					}
				}
				else 
				{
					var _cp1=1.0/_en._Bi1(i);
					var _dp1=(this._Yk1._Bi1(i)-_fx._Bi1(i))*_cp1;
					var _ep1=(this._Zk1._Bi1(i)-_fx._Bi1(i))*_cp1;
					var _hg=-1.0;
					if(_dp1>_ep1)
					{
						var _QB=_ep1;
						_ep1=_dp1;
						_dp1=_QB;
						_hg=1.0;
					}
					if(_dp1>_9p1)
					{
						_Pk1.x=_Pk1.y=0;
						_Pk1._Ci1(i,_hg);
						_9p1=_dp1;
					}
					_ap1=_Uj1(_ap1,_ep1);
					if(_9p1>_ap1)
					{
						return false;
					}
				}
			}
			if(_9p1<0.0||input._O_<_9p1)
			{
				return false;
			}
			output._T_=_9p1;
			output._Pk1.x=_Pk1.x;
			output._Pk1.y=_Pk1.y;
			return true;
		}
	}
	;

	function _fp1(_so1,_gp1,_Do1,_hp1,_Fo1)
	{
		_so1._ro1=0;
		var _rn1=_Jj1(_Do1,_gp1._Wk1);
		var _sn1=_Jj1(_Fo1,_hp1._Wk1);
		var _ha=_sn1.x-_rn1.x;
		var _ia=_sn1.y-_rn1.y;
		var _ip1=_ha*_ha+_ia*_ia;
		var _co1=_gp1._Ek1,_do1=_hp1._Ek1;
		var _MZ=_co1+_do1;
		if(_ip1>_MZ*_MZ)
		{
			return;
		}
		_so1.type=_po1._to1;
		_so1._lo1.x=_gp1._Wk1.x;
		_so1._lo1.y=_gp1._Wk1.y;
		_so1._qo1.x=_so1._qo1.y=0;
		_so1._ro1=1;
		_so1.points[0]=new _ko1();
		_so1.points[0]._lo1.x=_hp1._Wk1.x;
		_so1.points[0]._lo1.y=_hp1._Wk1.y;
		_so1.points[0].id._WA();
	}

	function _jp1(_so1,_kp1,_Do1,_hp1,_Fo1)
	{
		_so1._ro1=0;
		var c=_Jj1(_Fo1,_hp1._Wk1);
		var _lp1=_Lj1(_Do1,c);
		var _mp1=0;
		var _np1=-_Kh1;
		var _MZ=_kp1._Ek1+_hp1._Ek1;
		var vertexCount=_kp1._il1;
		var vertices=_kp1._hl1;
		var _op1=_kp1._Al1;
		for(var i=0;i<vertexCount;++i)
		{
			var _hg=_op1[i].x*(_lp1.x-vertices[i].x)+_op1[i].y*(_lp1.y-vertices[i].y);
			if(_hg>_MZ)
			{
				return;
			}
			if(_hg>_np1)
			{
				_np1=_hg;
				_mp1=i;
			}
		}
		var _pp1=_mp1;
		var _qp1=_pp1+1<vertexCount?_pp1+1:0;
		var _la=vertices[_pp1];
		var _04=vertices[_qp1];
		if(_np1<_Lh1)
		{
			_so1._ro1=1;
			_so1.type=_po1._uo1;
			_so1._qo1.x=_op1[_mp1].x;
			_so1._qo1.y=_op1[_mp1].y;
			_so1._lo1.x=0.5*(_la.x+_04.x);
			_so1._lo1.y=0.5*(_la.y+_04.y);
			_so1.points[0]=new _ko1();
			_so1.points[0]._lo1.x=_hp1._Wk1.x;
			_so1.points[0]._lo1.y=_hp1._Wk1.y;
			_so1.points[0].id._WA();
			return;
		}
		var _rp1=(_lp1.x-_la.x)*(_04.x-_la.x)+(_lp1.y-_la.y)*(_04.y-_la.y);
		var __3=(_lp1.x-_04.x)*(_la.x-_04.x)+(_lp1.y-_04.y)*(_la.y-_04.y);
		if(_rp1<=0.0)
		{
			if(_zj1(_lp1,_la)>_MZ*_MZ)
			{
				return;
			}
			_so1._ro1=1;
			_so1.type=_po1._uo1;
			_so1._qo1.x=_lp1.x-_la.x;
			_so1._qo1.y=_lp1.y-_la.y;
			_so1._qo1._Fi1();
			_so1._lo1.x=_la.x;
			_so1._lo1.y=_la.y;
			_so1.points[0]=new _ko1();
			_so1.points[0]._lo1.x=_hp1._Wk1.x;
			_so1.points[0]._lo1.y=_hp1._Wk1.y;
			_so1.points[0].id._WA();
		}
		else if(__3<=0.0)
		{
			if(_zj1(_lp1,_04)>_MZ*_MZ)
			{
				return;
			}
			_so1._ro1=1;
			_so1.type=_po1._uo1;
			_so1._qo1.x=_lp1.x-_04.x;
			_so1._qo1.y=_lp1.y-_04.y;
			_so1._qo1._Fi1();
			_so1._lo1.x=_04.x;
			_so1._lo1.y=_04.y;
			_so1.points[0]=new _ko1();
			_so1.points[0]._lo1.x=_hp1._Wk1.x;
			_so1.points[0]._lo1.y=_hp1._Wk1.y;
			_so1.points[0].id._WA();
		}
		else 
		{
			var _sp1=0.5*(_la.x+_04.x);
			var _tp1=0.5*(_la.y+_04.y);
			var _up1=(_lp1.x-_sp1)*_op1[_pp1].x+(_lp1.y-_tp1)*_op1[_pp1].y;
			if(_up1>_MZ)
			{
				return;
			}
			_so1._ro1=1;
			_so1.type=_po1._uo1;
			_so1._qo1.x=_op1[_pp1].x;
			_so1._qo1.y=_op1[_pp1].y;
			_so1._lo1.x=_sp1;
			_so1._lo1.y=_tp1;
			_so1.points[0]=new _ko1();
			_so1.points[0]._lo1.x=_hp1._Wk1.x;
			_so1.points[0]._lo1.y=_hp1._Wk1.y;
			_so1.points[0].id._WA();
		}
	}

	function _vp1(_wp1,_xp1,_yp1,_zp1,_Ap1)
	{
		var _Bp1=_xp1._il1;
		var _Cp1=_zp1._il1;
		var _Dp1=_xp1._Al1;
		var _Ep1=_xp1._hl1;
		var _Fp1=_zp1._hl1;
		var _hj1=_Oj1(_Ap1,_yp1);
		var _Vm1=0;
		var _Gp1=-_Kh1;
		for(var i=0;i<_Bp1;++i)
		{
			var _Hp1=_hj1.q.c*_Dp1[i].x-_hj1.q._hg*_Dp1[i].y;
			var _Ip1=_hj1.q._hg*_Dp1[i].x+_hj1.q.c*_Dp1[i].y;
			var _wa=(_hj1.q.c*_Ep1[i].x-_hj1.q._hg*_Ep1[i].y)+_hj1._fx.x;
			var _xa=(_hj1.q._hg*_Ep1[i].x+_hj1.q.c*_Ep1[i].y)+_hj1._fx.y;
			var _Kh=_Kh1;
			for(var _05=0;_05<_Cp1;++_05)
			{
				var _Jp1=_Hp1*(_Fp1[_05].x-_wa)+_Ip1*(_Fp1[_05].y-_xa);
				if(_Jp1<_Kh)
				{
					_Kh=_Jp1;
				}
			}
			if(_Kh>_Gp1)
			{
				_Gp1=_Kh;
				_Vm1=i;
			}
		}
		_wp1[0]=_Vm1;
		return _Gp1;
	}

	function _Kp1(c,_xp1,_yp1,_Lp1,_zp1,_Ap1)
	{
		var _Mp1=_xp1._Al1;
		var _Cp1=_zp1._il1;
		var _Np1=_zp1._hl1;
		var _Op1=_zp1._Al1;
		_Ih1(0<=_Lp1&&_Lp1<_xp1._il1);
		var _Pp1=_yp1.q.c*_Mp1[_Lp1].x-_yp1.q._hg*_Mp1[_Lp1].y;
		var _Qp1=_yp1.q._hg*_Mp1[_Lp1].x+_yp1.q.c*_Mp1[_Lp1].y;
		var _Rp1=_Ap1.q.c*_Pp1+_Ap1.q._hg*_Qp1;
		var _Sp1=-_Ap1.q._hg*_Pp1+_Ap1.q.c*_Qp1;
		var index=0;
		var _Tp1=_Kh1;
		for(var i=0;i<_Cp1;++i)
		{
			var _xw=_Rp1*_Op1[i].x+_Sp1*_Op1[i].y;
			if(_xw<_Tp1)
			{
				_Tp1=_xw;
				index=i;
			}
		}
		var _wl1=index;
		var _xl1=_wl1+1<_Cp1?_wl1+1:0;
		c[0]._Z3.x=(_Ap1.q.c*_Np1[_wl1].x-_Ap1.q._hg*_Np1[_wl1].y)+_Ap1._fx.x;
		c[0]._Z3.y=(_Ap1.q._hg*_Np1[_wl1].x+_Ap1.q.c*_Np1[_wl1].y)+_Ap1._fx.y;
		c[0].id._Zm1=_Lp1;
		c[0].id.__m1=_wl1;
		c[0].id._go1=_fo1._jo1;
		c[0].id._ho1=_fo1._io1;
		c[1]._Z3.x=(_Ap1.q.c*_Np1[_xl1].x-_Ap1.q._hg*_Np1[_xl1].y)+_Ap1._fx.x;
		c[1]._Z3.y=(_Ap1.q._hg*_Np1[_xl1].x+_Ap1.q.c*_Np1[_xl1].y)+_Ap1._fx.y;
		c[1].id._Zm1=_Lp1;
		c[1].id.__m1=_xl1;
		c[1].id._go1=_fo1._jo1;
		c[1].id._ho1=_fo1._io1;
	}

	function _Up1(_so1,_Vp1,_Do1,_Wp1,_Fo1)
	{
		_so1._ro1=0;
		var _Xp1=_Vp1._Ek1+_Wp1._Ek1;
		var _Yp1=[0];
		var _Zp1=_vp1(_Yp1,_Vp1,_Do1,_Wp1,_Fo1);
		if(_Zp1>_Xp1)return;
		var __p1=[0];
		var _0q1=_vp1(__p1,_Wp1,_Fo1,_Vp1,_Do1);
		if(_0q1>_Xp1)return;
		var _xp1;
		var _zp1;
		var _yp1,_Ap1;
		var _Lp1=0;
		var _DN=0;
		var _1q1=0.1*_Rh1;
		if(_0q1>_Zp1+_1q1)
		{
			_xp1=_Wp1;
			_zp1=_Vp1;
			_yp1=_Fo1;
			_Ap1=_Do1;
			_Lp1=__p1[0];
			_so1.type=_po1._vo1;
			_DN=1;
		}
		else 
		{
			_xp1=_Vp1;
			_zp1=_Wp1;
			_yp1=_Do1;
			_Ap1=_Fo1;
			_Lp1=_Yp1[0];
			_so1.type=_po1._uo1;
			_DN=0;
		}
		_Kp1(_Up1._2q1,_xp1,_yp1,_Lp1,_zp1,_Ap1);
		var _Bp1=_xp1._il1;
		var _3q1=_xp1._hl1;
		var _4q1=_Lp1;
		var _5q1=_Lp1+1<_Bp1?_Lp1+1:0;
		var _6q1=_3q1[_4q1];
		var _7q1=_3q1[_5q1];
		_Up1._8q1.x=_7q1.x-_6q1.x;
		_Up1._8q1.y=_7q1.y-_6q1.y;
		_Up1._8q1._Fi1();
		var _9q1=1.0*_Up1._8q1.y;
		var _aq1=-1.0*_Up1._8q1.x;
		var _Po1=0.5*(_6q1.x+_7q1.x);
		var _Qo1=0.5*(_6q1.y+_7q1.y);
		var _bq1=_yp1.q.c*_Up1._8q1.x-_yp1.q._hg*_Up1._8q1.y;
		var _cq1=_yp1.q._hg*_Up1._8q1.x+_yp1.q.c*_Up1._8q1.y;
		var _dq1=1.0*_cq1;
		var _eq1=-1.0*_bq1;
		_6q1=_Jj1(_yp1,_6q1);
		_7q1=_Jj1(_yp1,_7q1);
		var _fq1=_dq1*_6q1.x+_eq1*_6q1.y;
		var _gq1=-(_bq1*_6q1.x+_cq1*_6q1.y)+_Xp1;
		var _hq1=(_bq1*_7q1.x+_cq1*_7q1.y)+_Xp1;
		var _iq1=new Array(2);
		var _jq1=new Array(2);
		var _kq1;
		_kq1=_lq1(_iq1,_Up1._2q1,-_bq1,-_cq1,_gq1,_4q1);
		if(_kq1<2)return;
		_kq1=_lq1(_jq1,_iq1,_bq1,_cq1,_hq1,_5q1);
		if(_kq1<2)
		{
			return;
		}
		_so1._qo1.x=_9q1;
		_so1._qo1.y=_aq1;
		_so1._lo1.x=_Po1;
		_so1._lo1.y=_Qo1;
		var _ro1=0;
		for(var i=0;i<_Nh1;++i)
		{
			var _np1=(_dq1*_jq1[i]._Z3.x+_eq1*_jq1[i]._Z3.y)-_fq1;
			if(_np1<=_Xp1)
			{
				var _mq1=_so1.points[_ro1]=new _ko1();
				_mq1._lo1._PG(_Lj1(_Ap1,_jq1[i]._Z3));
				_mq1.id._PG(_jq1[i].id);
				if(_DN)
				{
					var _nq1=new _fo1();
					_nq1._PG(_mq1.id);
					_mq1.id._Zm1=_nq1.__m1;
					_mq1.id.__m1=_nq1._Zm1;
					_mq1.id._go1=_nq1._ho1;
					_mq1.id._ho1=_nq1._go1;
				}
				++_ro1;
			}
		}
		_so1._ro1=_ro1;
	}
	_Up1._8q1=new _wi1();
	_Up1._2q1=[new _Yo1(),new _Yo1()];

	function _oq1(_so1,_Yp1,_Do1,_hp1,_Fo1)
	{
		_so1._ro1=0;
		var _pq1=_Lj1(_Do1,_Jj1(_Fo1,_hp1._Wk1));
		var _Jh1=_Yp1._4l1,_Ti1=_Yp1._5l1;
		var _5i=_Ti1.x-_Jh1.x;
		var _jD=_Ti1.y-_Jh1.y;
		var _Y3=_5i*(_Ti1.x-_pq1.x)+_jD*(_Ti1.y-_pq1.y);
		var _Z3=_5i*(_pq1.x-_Jh1.x)+_jD*(_pq1.y-_Jh1.y);
		var _MZ=_Yp1._Ek1+_hp1._Ek1;
		var _nq1=new _fo1();
		_nq1.__m1=0;
		_nq1._ho1=_fo1._io1;
		if(_Z3<=0.0)
		{
			var _qq1=_Jh1;
			var _ha=_pq1.x-_qq1.x;
			var _ia=_pq1.y-_qq1.y;
			var _vC=_ha*_ha+_ia*_ia;
			if(_vC>_MZ*_MZ)
			{
				return;
			}
			if(_Yp1._7l1)
			{
				var _rq1=_Yp1._3l1;
				var _sq1=_Jh1;
				var _tq1=_sq1.x-_rq1.x;
				var _uq1=_sq1.y-_rq1.y;
				var _rp1=_tq1*(_sq1.x-_pq1.x)+_uq1*(_sq1.y-_pq1.y);
				if(_rp1>0.0)
				{
					return;
				}
			}
			_nq1._Zm1=0;
			_nq1._go1=_fo1._io1;
			_so1._ro1=1;
			_so1.type=_po1._to1;
			_so1._qo1.x=_so1._qo1.y=0;
			_so1._lo1.x=_qq1.x;
			_so1._lo1.y=_qq1.y;
			_so1.points[0]=new _ko1();
			_so1.points[0].id._PG(_nq1);
			_so1.points[0]._lo1.x=_hp1._Wk1.x;
			_so1.points[0]._lo1.y=_hp1._Wk1.y;
			return;
		}
		if(_Y3<=0.0)
		{
			var _qq1=_Ti1;
			var _ha=_pq1.x-_qq1.x;
			var _ia=_pq1.y-_qq1.y;
			var _vC=_ha*_ha+_ia*_ia;
			if(_vC>_MZ*_MZ)
			{
				return;
			}
			if(_Yp1._8l1)
			{
				var _vq1=_Yp1._6l1;
				var _wq1=_Ti1;
				var _xq1=_vq1.x-_wq1.x;
				var _yq1=_vq1.y-_wq1.y;
				var _04=_xq1*(_pq1.x-_wq1.x)+_yq1*(_pq1.y-_wq1.y);
				if(_04>0.0)
				{
					return;
				}
			}
			_nq1._Zm1=1;
			_nq1._go1=_fo1._io1;
			_so1._ro1=1;
			_so1.type=_po1._to1;
			_so1._qo1.x=_so1._qo1.y=0;
			_so1._lo1.x=_qq1.x;
			_so1._lo1.y=_qq1.y;
			_so1.points[0]=new _ko1();
			_so1.points[0].id._PG(_nq1);
			_so1.points[0]._lo1.x=_hp1._Wk1.x;
			_so1.points[0]._lo1.y=_hp1._Wk1.y;
			return;
		}
		var _zq1=_5i*_5i+_jD*_jD;
		_Ih1(_zq1>0.0);
		var _Aq1=(1.0/_zq1)*((_Y3*_Jh1.x)+(_Z3*_Ti1.x));
		var _Bq1=(1.0/_zq1)*((_Y3*_Jh1.y)+(_Z3*_Ti1.y));
		var _ha=_pq1.x-_Aq1;
		var _ia=_pq1.y-_Bq1;
		var _vC=_ha*_ha+_ia*_ia;
		if(_vC>_MZ*_MZ)
		{
			return;
		}
		var _Hp1=-_jD;
		var _Ip1=_5i;
		if(_Hp1*(_pq1.x-_Jh1.x)+_Ip1*(_pq1.y-_Jh1.y)<0.0)
		{
			_Hp1=-_Hp1;
			_Ip1=-_Ip1;
		}
		_nq1._Zm1=0;
		_nq1._go1=_fo1._jo1;
		_so1._ro1=1;
		_so1.type=_po1._uo1;
		_so1._qo1.x=_Hp1;
		_so1._qo1.y=_Ip1;
		_so1._qo1._Fi1();
		_so1._lo1.x=_Jh1.x;
		_so1._lo1.y=_Jh1.y;
		_so1.points[0]=new _ko1();
		_so1.points[0].id._PG(_nq1);
		_so1.points[0]._lo1.x=_hp1._Wk1.x;
		_so1.points[0]._lo1.y=_hp1._Wk1.y;
	}

	function _Cq1()
	{
		this.type=0;
		this.index=0;
		this._np1=0;
	}
	_Cq1._Dq1=0;
	_Cq1._Eq1=1;
	_Cq1._Fq1=2;

	function _Gq1()
	{
		this.vertices=new Array(_Oh1);
		this._op1=new Array(_Oh1);
		this._u7=0;
	}
	;

	function _Hq1()
	{
		this._wl1=0,this._xl1=0;
		this._la=new _wi1(),this._04=new _wi1();
		this._Pk1=new _wi1();
		this._Iq1=new _wi1();
		this._gq1=0;
		this._Jq1=new _wi1();
		this._hq1=0;
	}
	;

	function _Kq1()
	{
		this._Lq1=new _Gq1();
		this._Mq1=new _gj1();
		this._Nq1=new _wi1();
		this._Oq1=new _wi1(),this._Pq1=new _wi1(),this._Qq1=new _wi1(),this._Rq1=new _wi1();
		this._Sq1=new _wi1(),this._Tq1=new _wi1(),this._Uq1=new _wi1();
		this._Vq1=new _wi1();
		this._Wq1=0,this._Xq1=0;
		this._Yq1=new _wi1(),this._Zq1=new _wi1();
		this._Ek1=0;
		this.__q1=false;
	}
	_Kq1._0r1=new _wi1();
	_Kq1._1r1=new _wi1();
	_Kq1._2r1=new _wi1();
	_Kq1.prototype=
	{
		_3r1:
function(_so1,_Yp1,_Do1,_4r1,_Fo1)
		{
			this._Mq1._PG(_Oj1(_Do1,_Fo1));
			this._Nq1.x=(this._Mq1.q.c*_4r1._zl1.x-this._Mq1.q._hg*_4r1._zl1.y)+this._Mq1._fx.x;
			this._Nq1.y=(this._Mq1.q._hg*_4r1._zl1.x+this._Mq1.q.c*_4r1._zl1.y)+this._Mq1._fx.y;
			this._Oq1.x=_Yp1._3l1.x;
			this._Oq1.y=_Yp1._3l1.y;
			this._Pq1.x=_Yp1._4l1.x;
			this._Pq1.y=_Yp1._4l1.y;
			this._Qq1.x=_Yp1._5l1.x;
			this._Qq1.y=_Yp1._5l1.y;
			this._Rq1.x=_Yp1._6l1.x;
			this._Rq1.y=_Yp1._6l1.y;
			var _5r1=_Yp1._7l1;
			var _6r1=_Yp1._8l1;
			_Kq1._0r1.x=this._Qq1.x-this._Pq1.x;
			_Kq1._0r1.y=this._Qq1.y-this._Pq1.y;
			_Kq1._0r1._Fi1();
			this._Tq1.x=_Kq1._0r1.y;
			this._Tq1.y=-_Kq1._0r1.x;
			var _7r1=this._Tq1.x*(this._Nq1.x-this._Pq1.x)+this._Tq1.y*(this._Nq1.y-this._Pq1.y);
			var _8r1=0.0,_9r1=0.0;
			var _ar1=false,_br1=false;
			if(_5r1)
			{
				_Kq1._1r1.x=this._Pq1.x-this._Oq1.x;
				_Kq1._1r1.y=this._Pq1.y-this._Oq1.y;
				_Kq1._1r1._Fi1();
				this._Sq1.x=_Kq1._1r1.y;
				this._Sq1.y=-_Kq1._1r1.x;
				_ar1=(_Kq1._1r1.x*_Kq1._0r1.y-_Kq1._1r1.y*_Kq1._0r1.x)>=0;
				_8r1=this._Sq1.x*(this._Nq1.x-this._Oq1.x)+this._Sq1.y*(this._Nq1.y-this._Oq1.y);
			}
			if(_6r1)
			{
				_Kq1._2r1.x=this._Rq1.x-this._Qq1.x;
				_Kq1._2r1.y=this._Rq1.y-this._Qq1.y;
				_Kq1._2r1._Fi1();
				this._Uq1.x=_Kq1._2r1.y;
				this._Uq1.y=-_Kq1._2r1.x;
				_br1=(_Kq1._0r1.x*_Kq1._2r1.y-_Kq1._0r1.y*_Kq1._2r1.x)>0.0;
				_9r1=this._Uq1.x*(this._Nq1.x-this._Qq1.x)+this._Uq1.y*(this._Nq1.y-this._Qq1.y);
			}
			if(_5r1&&_6r1)
			{
				if(_ar1&&_br1)
				{
					this.__q1=_8r1>=0.0||_7r1>=0.0||_9r1>=0.0;
					if(this.__q1)
					{
						this._Vq1.x=this._Tq1.x;
						this._Vq1.y=this._Tq1.y;
						this._Yq1.x=this._Sq1.x;
						this._Yq1.y=this._Sq1.y;
						this._Zq1.x=this._Uq1.x;
						this._Zq1.y=this._Uq1.y;
					}
					else 
					{
						this._Vq1.x=-this._Tq1.x;
						this._Vq1.y=-this._Tq1.y;
						this._Yq1.x=-this._Tq1.x;
						this._Yq1.y=-this._Tq1.y;
						this._Zq1.x=-this._Tq1.x;
						this._Zq1.y=-this._Tq1.y;
					}
				}
				else if(_ar1)
				{
					this.__q1=_8r1>=0.0||(_7r1>=0.0&&_9r1>=0.0);
					if(this.__q1)
					{
						this._Vq1.x=this._Tq1.x;
						this._Vq1.y=this._Tq1.y;
						this._Yq1.x=this._Sq1.x;
						this._Yq1.y=this._Sq1.y;
						this._Zq1.x=this._Tq1.x;
						this._Zq1.y=this._Tq1.y;
					}
					else 
					{
						this._Vq1.x=-this._Tq1.x;
						this._Vq1.y=-this._Tq1.y;
						this._Yq1.x=-this._Uq1.x;
						this._Yq1.y=-this._Uq1.y;
						this._Zq1.x=-this._Tq1.x;
						this._Zq1.y=-this._Tq1.y;
					}
				}
				else if(_br1)
				{
					this.__q1=_9r1>=0.0||(_8r1>=0.0&&_7r1>=0.0);
					if(this.__q1)
					{
						this._Vq1.x=this._Tq1.x;
						this._Vq1.y=this._Tq1.y;
						this._Yq1.x=this._Tq1.x;
						this._Yq1.y=this._Tq1.y;
						this._Zq1.x=this._Uq1.x;
						this._Zq1.y=this._Uq1.y;
					}
					else 
					{
						this._Vq1.x=-this._Tq1.x;
						this._Vq1.y=-this._Tq1.y;
						this._Yq1.x=-this._Tq1.x;
						this._Yq1.y=-this._Tq1.y;
						this._Zq1.x=-this._Sq1.x;
						this._Zq1.y=-this._Sq1.y;
					}
				}
				else 
				{
					this.__q1=_8r1>=0.0&&_7r1>=0.0&&_9r1>=0.0;
					if(this.__q1)
					{
						this._Vq1.x=this._Tq1.x;
						this._Vq1.y=this._Tq1.y;
						this._Yq1.x=this._Tq1.x;
						this._Yq1.y=this._Tq1.y;
						this._Zq1.x=this._Tq1.x;
						this._Zq1.y=this._Tq1.y;
					}
					else 
					{
						this._Vq1.x=-this._Tq1.x;
						this._Vq1.y=-this._Tq1.y;
						this._Yq1.x=-this._Uq1.x;
						this._Yq1.y=-this._Uq1.y;
						this._Zq1.x=-this._Sq1.x;
						this._Zq1.y=-this._Sq1.y;
					}
				}
			}
			else if(_5r1)
			{
				if(_ar1)
				{
					this.__q1=_8r1>=0.0||_7r1>=0.0;
					if(this.__q1)
					{
						this._Vq1.x=this._Tq1.x;
						this._Vq1.y=this._Tq1.y;
						this._Yq1.x=this._Sq1.x;
						this._Yq1.y=this._Sq1.y;
						this._Zq1.x=-this._Tq1.x;
						this._Zq1.y=-this._Tq1.y;
					}
					else 
					{
						this._Vq1.x=-this._Tq1.x;
						this._Vq1.y=-this._Tq1.y;
						this._Yq1.x=this._Tq1.x;
						this._Yq1.y=this._Tq1.y;
						this._Zq1.x=-this._Tq1.x;
						this._Zq1.y=-this._Tq1.y;
					}
				}
				else 
				{
					this.__q1=_8r1>=0.0&&_7r1>=0.0;
					if(this.__q1)
					{
						this._Vq1.x=this._Tq1.x;
						this._Vq1.y=this._Tq1.y;
						this._Yq1.x=this._Tq1.x;
						this._Yq1.y=this._Tq1.y;
						this._Zq1.x=-this._Tq1.x;
						this._Zq1.y=-this._Tq1.y;
					}
					else 
					{
						this._Vq1.x=-this._Tq1.x;
						this._Vq1.y=-this._Tq1.y;
						this._Yq1.x=this._Tq1.x;
						this._Yq1.y=this._Tq1.y;
						this._Zq1.x=-this._Sq1.x;
						this._Zq1.y=-this._Sq1.y;
					}
				}
			}
			else if(_6r1)
			{
				if(_br1)
				{
					this.__q1=_7r1>=0.0||_9r1>=0.0;
					if(this.__q1)
					{
						this._Vq1.x=this._Tq1.x;
						this._Vq1.y=this._Tq1.y;
						this._Yq1.x=-this._Tq1.x;
						this._Yq1.y=-this._Tq1.y;
						this._Zq1.x=this._Uq1.x;
						this._Zq1.y=this._Uq1.y;
					}
					else 
					{
						this._Vq1.x=-this._Tq1.x;
						this._Vq1.y=-this._Tq1.y;
						this._Yq1.x=-this._Tq1.x;
						this._Yq1.y=-this._Tq1.y;
						this._Zq1.x=this._Tq1.x;
						this._Zq1.y=this._Tq1.y;
					}
				}
				else 
				{
					this.__q1=_7r1>=0.0&&_9r1>=0.0;
					if(this.__q1)
					{
						this._Vq1.x=this._Tq1.x;
						this._Vq1.y=this._Tq1.y;
						this._Yq1.x=-this._Tq1.x;
						this._Yq1.y=-this._Tq1.y;
						this._Zq1.x=this._Tq1.x;
						this._Zq1.y=this._Tq1.y;
					}
					else 
					{
						this._Vq1.x=-this._Tq1.x;
						this._Vq1.y=-this._Tq1.y;
						this._Yq1.x=-this._Uq1.x;
						this._Yq1.y=-this._Uq1.y;
						this._Zq1.x=this._Tq1.x;
						this._Zq1.y=this._Tq1.y;
					}
				}
			}
			else 
			{
				this.__q1=_7r1>=0.0;
				if(this.__q1)
				{
					this._Vq1.x=this._Tq1.x;
					this._Vq1.y=this._Tq1.y;
					this._Yq1.x=-this._Tq1.x;
					this._Yq1.y=-this._Tq1.y;
					this._Zq1.x=-this._Tq1.x;
					this._Zq1.y=-this._Tq1.y;
				}
				else 
				{
					this._Vq1.x=-this._Tq1.x;
					this._Vq1.y=-this._Tq1.y;
					this._Yq1.x=this._Tq1.x;
					this._Yq1.y=this._Tq1.y;
					this._Zq1.x=this._Tq1.x;
					this._Zq1.y=this._Tq1.y;
				}
			}
			this._Lq1._u7=_4r1._il1;
			for(var i=0;i<_4r1._il1;++i)
			{
				this._Lq1.vertices[i]=_Jj1(this._Mq1,_4r1._hl1[i]);
				this._Lq1._op1[i]=_Hj1(this._Mq1.q,_4r1._Al1[i]);
			}
			this._Ek1=2.0*_Th1;
			_so1._ro1=0;
			var _cr1=this._dr1();
			if(_cr1.type==_Cq1._Dq1)
			{
				return;
			}
			if(_cr1._np1>this._Ek1)
			{
				return;
			}
			var _er1=this._fr1();
			if(_er1.type!=_Cq1._Dq1&&_er1._np1>this._Ek1)
			{
				return;
			}
			var _gr1=0.98;
			var _hr1=0.001;
			var _ir1=new _Cq1();
			if(_er1.type==_Cq1._Dq1)
			{
				_ir1=_cr1;
			}
			else if(_er1._np1>_gr1*_cr1._np1+_hr1)
			{
				_ir1=_er1;
			}
			else 
			{
				_ir1=_cr1;
			}
			var _Gl1=new Array(2);
			var _jr1=new _Hq1();
			if(_ir1.type==_Cq1._Eq1)
			{
				_so1.type=_po1._uo1;
				var _Vm1=0;
				var _Wm1=this._Vq1.x*this._Lq1._op1[0].x+this._Vq1.y*this._Lq1._op1[0].y;
				for(var i=1;i<this._Lq1._u7;++i)
				{
					var value=this._Vq1.x*this._Lq1._op1[i].x+this._Vq1.y*this._Lq1._op1[i].y;
					if(value<_Wm1)
					{
						_Wm1=value;
						_Vm1=i;
					}
				}
				var _wl1=_Vm1;
				var _xl1=_wl1+1<this._Lq1._u7?_wl1+1:0;
				_Gl1[0]=new _Yo1();
				_Gl1[0]._Z3.x=this._Lq1.vertices[_wl1].x;
				_Gl1[0]._Z3.y=this._Lq1.vertices[_wl1].y;
				_Gl1[0].id._Zm1=0;
				_Gl1[0].id.__m1=_wl1;
				_Gl1[0].id._go1=_fo1._jo1;
				_Gl1[0].id._ho1=_fo1._io1;
				_Gl1[1]=new _Yo1();
				_Gl1[1]._Z3.x=this._Lq1.vertices[_xl1].x;
				_Gl1[1]._Z3.y=this._Lq1.vertices[_xl1].y;
				_Gl1[1].id._Zm1=0;
				_Gl1[1].id.__m1=_xl1;
				_Gl1[1].id._go1=_fo1._jo1;
				_Gl1[1].id._ho1=_fo1._io1;
				if(this.__q1)
				{
					_jr1._wl1=0;
					_jr1._xl1=1;
					_jr1._la.x=this._Pq1.x;
					_jr1._la.y=this._Pq1.y;
					_jr1._04.x=this._Qq1.x;
					_jr1._04.y=this._Qq1.y;
					_jr1._Pk1.x=this._Tq1.x;
					_jr1._Pk1.y=this._Tq1.y;
				}
				else 
				{
					_jr1._wl1=1;
					_jr1._xl1=0;
					_jr1._la.x=this._Qq1.x;
					_jr1._la.y=this._Qq1.y;
					_jr1._04.x=this._Pq1.x;
					_jr1._04.y=this._Pq1.y;
					_jr1._Pk1.x=-this._Tq1.x;
					_jr1._Pk1.y=-this._Tq1.y;
				}
			}
			else 
			{
				_so1.type=_po1._vo1;
				_Gl1[0]=new _Yo1();
				_Gl1[0]._Z3=this._Pq1;
				_Gl1[0].id._Zm1=0;
				_Gl1[0].id.__m1=_ir1.index;
				_Gl1[0].id._go1=_fo1._io1;
				_Gl1[0].id._ho1=_fo1._jo1;
				_Gl1[1]=new _Yo1();
				_Gl1[1]._Z3=this._Qq1;
				_Gl1[1].id._Zm1=0;
				_Gl1[1].id.__m1=_ir1.index;
				_Gl1[1].id._go1=_fo1._io1;
				_Gl1[1].id._ho1=_fo1._jo1;
				_jr1._wl1=_ir1.index;
				_jr1._xl1=_jr1._wl1+1<this._Lq1._u7?_jr1._wl1+1:0;
				_jr1._la.x=this._Lq1.vertices[_jr1._wl1].x;
				_jr1._la.y=this._Lq1.vertices[_jr1._wl1].y;
				_jr1._04.x=this._Lq1.vertices[_jr1._xl1].x;
				_jr1._04.y=this._Lq1.vertices[_jr1._xl1].y;
				_jr1._Pk1.x=this._Lq1._op1[_jr1._wl1].x;
				_jr1._Pk1.y=this._Lq1._op1[_jr1._wl1].y;
			}
			_jr1._Iq1.x=_jr1._Pk1.y;
			_jr1._Iq1.y=-_jr1._Pk1.x;
			_jr1._Jq1.x=-_jr1._Iq1.x;
			_jr1._Jq1.y=-_jr1._Iq1.y;
			_jr1._gq1=_jr1._Iq1.x*_jr1._la.x+_jr1._Iq1.y*_jr1._la.y;
			_jr1._hq1=_jr1._Jq1.x*_jr1._04.x+_jr1._Jq1.y*_jr1._04.y;
			var _iq1=new Array(2);
			var _jq1=new Array(2);
			var _kq1;
			_kq1=_lq1(_iq1,_Gl1,_jr1._Iq1.x,_jr1._Iq1.y,_jr1._gq1,_jr1._wl1);
			if(_kq1<_Nh1)
			{
				return;
			}
			_kq1=_lq1(_jq1,_iq1,_jr1._Jq1.x,_jr1._Jq1.y,_jr1._hq1,_jr1._xl1);
			if(_kq1<_Nh1)
			{
				return;
			}
			if(_ir1.type==_Cq1._Eq1)
			{
				_so1._qo1.x=_jr1._Pk1.x;
				_so1._qo1.y=_jr1._Pk1.y;
				_so1._lo1.x=_jr1._la.x;
				_so1._lo1.y=_jr1._la.y;
			}
			else 
			{
				_so1._qo1.x=_4r1._Al1[_jr1._wl1].x;
				_so1._qo1.y=_4r1._Al1[_jr1._wl1].y;
				_so1._lo1.x=_4r1._hl1[_jr1._wl1].x;
				_so1._lo1.y=_4r1._hl1[_jr1._wl1].y;
			}
			var _ro1=0;
			for(var i=0;i<_Nh1;++i)
			{
				var _np1=_jr1._Pk1.x*(_jq1[i]._Z3.x-_jr1._la.x)+_jr1._Pk1.y*(_jq1[i]._Z3.y-_jr1._la.y);
				if(_np1<=this._Ek1)
				{
					var _mq1=_so1.points[_ro1]=new _ko1();
					if(_ir1.type==_Cq1._Eq1)
					{
						_mq1._lo1._PG(_Lj1(this._Mq1,_jq1[i]._Z3));
						_mq1.id._PG(_jq1[i].id);
					}
					else 
					{
						_mq1._lo1.x=_jq1[i]._Z3.x;
						_mq1._lo1.y=_jq1[i]._Z3.y;
						_mq1.id._go1=_jq1[i].id._ho1;
						_mq1.id._ho1=_jq1[i].id._go1;
						_mq1.id._Zm1=_jq1[i].id.__m1;
						_mq1.id.__m1=_jq1[i].id._Zm1;
					}
					++_ro1;
				}
			}
			_so1._ro1=_ro1;
		}
		,_dr1:
function()
		{
			var _tn=new _Cq1();
			_tn.type=_Cq1._Eq1;
			_tn.index=this.__q1?0:1;
			_tn._np1=Number.MAX_VALUE;
			for(var i=0;i<this._Lq1._u7;++i)
			{
				var _hg=this._Vq1.x*(this._Lq1.vertices[i].x-this._Pq1.x)+this._Vq1.y*(this._Lq1.vertices[i].y-this._Pq1.y);
				if(_hg<_tn._np1)
				{
					_tn._np1=_hg;
				}
			}
			return _tn;
		}
		,_fr1:
function()
		{
			var _tn=new _Cq1();
			_tn.type=_Cq1._Dq1;
			_tn.index=-1;
			_tn._np1=-Number.MAX_VALUE;
			var _kr1=-this._Vq1.y;
			var _lr1=this._Vq1.x;
			for(var i=0;i<this._Lq1._u7;++i)
			{
				var _Hp1=-this._Lq1._op1[i].x;
				var _Ip1=-this._Lq1._op1[i].y;
				var _Zq=_Hp1*(this._Lq1.vertices[i].x-this._Pq1.x)+_Ip1*(this._Lq1.vertices[i].y-this._Pq1.y);
				var __q=_Hp1*(this._Lq1.vertices[i].x-this._Qq1.x)+_Ip1*(this._Lq1.vertices[i].y-this._Qq1.y);
				var _hg=_Uj1(_Zq,__q);
				if(_hg>this._Ek1)
				{
					_tn.type=_Cq1._Fq1;
					_tn.index=i;
					_tn._np1=_hg;
					return _tn;
				}
				if(_Hp1*_kr1+_Ip1*_lr1>=0.0)
				{
					if((_Hp1-this._Zq1.x)*this._Vq1.x+(_Ip1-this._Zq1.y)*this._Vq1.y<-_Sh1)
					{
						continue;
					}
				}
				else 
				{
					if((_Hp1-this._Yq1.x)*this._Vq1.x+(_Ip1-this._Yq1.y)*this._Vq1.y<-_Sh1)
					{
						continue;
					}
				}
				if(_hg>_tn._np1)
				{
					_tn.type=_Cq1._Fq1;
					_tn.index=i;
					_tn._np1=_hg;
				}
			}
			return _tn;
		}
	}
	;
	_Kq1._mr1=0;
	_Kq1._nr1=1;
	_Kq1._or1=2;

	function _pr1(_so1,_Yp1,_Do1,_4r1,_Fo1)
	{
		_pr1._qr1._3r1(_so1,_Yp1,_Do1,_4r1,_Fo1);
	}
	_pr1._qr1=new _Kq1();

	function _lq1(_rr1,_sr1,_dq1,_eq1,offset,_tr1)
	{
		var _ur1=0;
		var _vr1=(_dq1*_sr1[0]._Z3.x+_eq1*_sr1[0]._Z3.y)-offset;
		var _wr1=(_dq1*_sr1[1]._Z3.x+_eq1*_sr1[1]._Z3.y)-offset;
		if(_vr1<=0.0)_rr1[_ur1++]=_sr1[0];
		if(_wr1<=0.0)_rr1[_ur1++]=_sr1[1];
		if(_vr1*_wr1<0.0)
		{
			var _xr1=_vr1/(_vr1-_wr1);
			_rr1[_ur1]=new _Yo1();
			_rr1[_ur1]._Z3.x=_sr1[0]._Z3.x+(_xr1*(_sr1[1]._Z3.x-_sr1[0]._Z3.x));
			_rr1[_ur1]._Z3.y=_sr1[0]._Z3.y+(_xr1*(_sr1[1]._Z3.y-_sr1[0]._Z3.y));
			_rr1[_ur1].id._Zm1=_tr1;
			_rr1[_ur1].id.__m1=_sr1[0].id.__m1;
			_rr1[_ur1].id._go1=_fo1._io1;
			_rr1[_ur1].id._ho1=_fo1._jo1;
			++_ur1;
		}
		return _ur1;
	}

	function _yr1(_zr1,_Zm1,_Ar1,__m1,_Do1,_Fo1)
	{
		_yr1.input._1n1.Set(_zr1,_Zm1);
		_yr1.input._2n1.Set(_Ar1,__m1);
		_yr1.input._3n1=_Do1;
		_yr1.input._4n1=_Fo1;
		_yr1.input._5n1=true;
		_yr1._t7._u7=0;
		_Zn1(_yr1.output,_yr1._t7,_yr1.input);
		return _yr1.output._Ok1<10.0*_Lh1;
	}
	_yr1.input=new _0n1();
	_yr1._t7=new _Xm1();
	_yr1.output=new _6n1();

	function _zm1(_i3,_h3)
	{
		return !((_h3._Yk1.x-_i3._Zk1.x)>0.0||(_h3._Yk1.y-_i3._Zk1.y)>0.0||(_i3._Yk1.x-_h3._Zk1.x)>0.0||(_i3._Yk1.y-_h3._Zk1.y)>0.0);
	}
	var _Br1=-1;

	function _Cr1()
	{
		this._Kk1=new _0p1();
		this._nm1=null;
		this.parent=0;
		this._Dr1=this._Er1=this.height=0;
	}
	_Cr1.prototype=
	{
		_Fr1:
function()
		{
			return this._Dr1==_Br1;
		}
	}
	;

	function _fm1()
	{
		this._Gr1=_Br1;
		this._Hr1=16;
		this._Ir1=0;
		this._Jr1=new Array(this._Hr1);
		for(var i=0;i<this._Hr1-1;++i)
		{
			this._Jr1[i]=new _Cr1();
			this._Jr1[i].parent=i+1;
			this._Jr1[i].height=-1;
		}
		this._Jr1[this._Hr1-1]=new _Cr1();
		this._Jr1[this._Hr1-1].parent=_Br1;
		this._Jr1[this._Hr1-1].height=-1;
		this._Kr1=0;
		this._Lr1=0;
		this._Mr1=0;
	}
	_fm1._Nr1=new _wi1(_Ph1,_Ph1);
	_fm1.prototype=
	{
		_mm1:
function(_Kk1,_nm1)
		{
			var _om1=this._Or1();
			this._Jr1[_om1]._Kk1._Yk1._PG(_wi1._Di1(_Kk1._Yk1,_fm1._Nr1));
			this._Jr1[_om1]._Kk1._Zk1._PG(_wi1._ce(_Kk1._Zk1,_fm1._Nr1));
			this._Jr1[_om1]._nm1=_nm1;
			this._Jr1[_om1].height=0;
			this._Pr1(_om1);
			return _om1;
		}
		,_qm1:
function(_om1)
		{
			_Ih1(0<=_om1&&_om1<this._Hr1);
			_Ih1(this._Jr1[_om1]._Fr1());
			this._Qr1(_om1);
			this._Rr1(_om1);
		}
		,_sm1:
function(_om1,_Kk1,_tm1)
		{
			_Ih1(0<=_om1&&_om1<this._Hr1);
			_Ih1(this._Jr1[_om1]._Fr1());
			if(this._Jr1[_om1]._Kk1._8p1(_Kk1))
			{
				return false;
			}
			this._Qr1(_om1);
			this._Jr1[_om1]._Kk1._PG(_Kk1);
			this._Jr1[_om1]._Kk1._Yk1._Di1(_fm1._Nr1);
			this._Jr1[_om1]._Kk1._Zk1._ce(_fm1._Nr1);
			var _en=_wi1.Multiply(_Qh1,_tm1);
			if(_en.x<0.0)
			{
				this._Jr1[_om1]._Kk1._Yk1.x+=_en.x;
			}
			else 
			{
				this._Jr1[_om1]._Kk1._Zk1.x+=_en.x;
			}
			if(_en.y<0.0)
			{
				this._Jr1[_om1]._Kk1._Yk1.y+=_en.y;
			}
			else 
			{
				this._Jr1[_om1]._Kk1._Zk1.y+=_en.y;
			}
			this._Pr1(_om1);
			return true;
		}
		,_wm1:
function(_om1)
		{
			_Ih1(0<=_om1&&_om1<this._Hr1);
			return this._Jr1[_om1]._nm1;
		}
		,_vm1:
function(_om1)
		{
			_Ih1(0<=_om1&&_om1<this._Hr1);
			return this._Jr1[_om1]._Kk1;
		}
		,_Em1:
function(_Ae1,_Kk1)
		{
			var stack=[];
			stack.push(this._Gr1);
			while(stack.length>0) 
			{
				var _Sr1=stack.pop();
				if(_Sr1==_Br1)
				{
					continue;
				}
				var _Fj=this._Jr1[_Sr1];
				if(_zm1(_Fj._Kk1,_Kk1))
				{
					if(_Fj._Fr1())
					{
						var _Tr1=_Ae1._Rm1(_Sr1);
						if(_Tr1==false)
						{
							return;
						}
					}
					else 
					{
						stack.push(_Fj._Dr1);
						stack.push(_Fj._Er1);
					}
				}
			}
		}
		,_Hk1:
function(_Ae1,input)
		{
			var _sn=input._sn;
			var _ik1=input._ik1;
			var _f3=_wi1._Di1(_ik1,_sn);
			_Ih1(_f3._Ei1()>0.0);
			_f3._Fi1();
			var _Z3=_vj1(1.0,_f3);
			var _Ur1=_Sj1(_Z3);
			var _O_=input._O_;
			var _Vr1=new _0p1();

						{
				var _K5=_wi1._ce(_sn,_wi1.Multiply(_O_,_wi1._Di1(_ik1,_sn)));
				_Vr1._Yk1._PG(_Vj1(_sn,_K5));
				_Vr1._Zk1._PG(_Xj1(_sn,_K5));
			}
			var stack=[];
			stack.push(this._Gr1);
			while(stack.length>0) 
			{
				var _Sr1=stack.pop();
				if(_Sr1==_Br1)
				{
					continue;
				}
				var _Fj=this._Jr1[_Sr1];
				if(_zm1(_Fj._Kk1,_Vr1)==false)
				{
					continue;
				}
				var c=_Fj._Kk1._2p1();
				var h=_Fj._Kk1._3p1();
				var _np1=_Rj1(_sj1(_Z3,_wi1._Di1(_sn,c)))-_sj1(_Ur1,h);
				if(_np1>0.0)
				{
					continue;
				}
				if(_Fj._Fr1())
				{
					var _Wr1=new _Zo1();
					_Wr1._sn._PG(input._sn);
					_Wr1._ik1._PG(input._ik1);
					_Wr1._O_=_O_;
					var value=_Ae1._Xr1(_Wr1,_Sr1);
					if(value==0.0)
					{
						return;
					}
					if(value>0.0)
					{
						_O_=value;
						var _ep1=_wi1._ce(_sn,_wi1.Multiply(_O_,_wi1._Di1(_ik1,_sn)));
						_Vr1._Yk1._PG(_Vj1(_sn,_ep1));
						_Vr1._Zk1._PG(_Xj1(_sn,_ep1));
					}
				}
				else 
				{
					stack.push(_Fj._Dr1);
					stack.push(_Fj._Er1);
				}
			}
		}
		,_Yl1:
function()
		{
			this._Yr1(this._Gr1);
			this._Zr1(this._Gr1);
			var __r1=0;
			var _0s1=this._Kr1;
			while(_0s1!=_Br1) 
			{
				_Ih1(0<=_0s1&&_0s1<this._Hr1);
				_0s1=this._Jr1[_0s1].parent;
				++__r1;
			}
			_Ih1(this._HD()==this._1s1());
			_Ih1(this._Ir1+__r1==this._Hr1);
		}
		,_HD:
function()
		{
			if(this._Gr1==_Br1)
			{
				return 0;
			}
			return this._Jr1[this._Gr1].height;
		}
		,_Mm1:
function()
		{
			var _2s1=0;
			for(var i=0;i<this._Hr1;++i)
			{
				var _Fj=this._Jr1[i];
				if(_Fj.height<=1)
				{
					continue;
				}
				_Ih1(_Fj._Fr1()==false);
				var _Dr1=_Fj._Dr1;
				var _Er1=_Fj._Er1;
				var _3s1=_Rj1(this._Jr1[_Er1].height-this._Jr1[_Dr1].height);
				_2s1=_Wj1(_2s1,_3s1);
			}
			return _2s1;
		}
		,_Om1:
function()
		{
			if(this._Gr1==_Br1)
			{
				return 0.0;
			}
			var _x4=this._Jr1[this._Gr1];
			var _4s1=_x4._Kk1._4p1();
			var _5s1=0.0;
			for(var i=0;i<this._Hr1;++i)
			{
				var _Fj=this._Jr1[i];
				if(_Fj.height<0)
				{
					continue;
				}
				_5s1+=_Fj._Kk1._4p1();
			}
			return _5s1/_4s1;
		}
		,_6s1:
function()
		{
			var _7s1=new Array(this._Ir1);
			var _u7=0;
			for(var i=0;i<this._Hr1;++i)
			{
				if(this._Jr1[i].height<0)
				{
					continue;
				}
				if(this._Jr1[i]._Fr1())
				{
					this._Jr1[i].parent=_Br1;
					_7s1[_u7]=i;
					++_u7;
				}
				else 
				{
					this._Rr1(i);
				}
			}
			while(_u7>1) 
			{
				var _8s1=_Kh1;
				var _9s1=-1,_as1=-1;
				for(i=0;i<_u7;++i)
				{
					var _bs1=this._Jr1[_7s1[i]]._Kk1;
					for(var _05=i+1;_05<_u7;++_05)
					{
						var _cs1=this._Jr1[_7s1[_05]]._Kk1;
						var _h3=new _0p1();
						_h3._5p1(_bs1,_cs1);
						var _ds1=_h3._4p1();
						if(_ds1<_8s1)
						{
							_9s1=i;
							_as1=_05;
							_8s1=_ds1;
						}
					}
				}
				var _es1=_7s1[_9s1];
				var _fs1=_7s1[_as1];
				var _Dr1=this._Jr1[_es1];
				var _Er1=this._Jr1[_fs1];
				var _gs1=this._Or1();
				var parent=this._Jr1[_gs1];
				parent._Dr1=_es1;
				parent._Er1=_fs1;
				parent.height=1+_Wj1(_Dr1.height,_Er1.height);
				parent._Kk1._5p1(_Dr1._Kk1,_Er1._Kk1);
				parent.parent=_Br1;
				_Dr1.parent=_gs1;
				_Er1.parent=_gs1;
				_7s1[_as1]=_7s1[_u7-1];
				_7s1[_9s1]=_gs1;
				--_u7;
			}
			this._Gr1=_7s1[0];
			this._Yl1();
		}
		,_Pm1:
function(_Qm1)
		{
			for(var i=0;i<this._Hr1;++i)
			{
				this._Jr1[i]._Kk1._Yk1._Di1(_Qm1);
				this._Jr1[i]._Kk1._Zk1._Di1(_Qm1);
			}
		}
		,_Or1:
function()
		{
			if(this._Kr1==_Br1)
			{
				_Ih1(this._Ir1==this._Hr1);
				var _hs1=this._Jr1;
				this._Hr1*=2;
				this._Jr1=_hs1.concat(new Array(this._Hr1-this._Ir1));
				for(var i=this._Ir1;i<this._Hr1-1;++i)
				{
					this._Jr1[i]=new _Cr1();
					this._Jr1[i].parent=i+1;
					this._Jr1[i].height=-1;
				}
				this._Jr1[this._Hr1-1]=new _Cr1();
				this._Jr1[this._Hr1-1].parent=_Br1;
				this._Jr1[this._Hr1-1].height=-1;
				this._Kr1=this._Ir1;
			}
			var _Sr1=this._Kr1;
			this._Kr1=this._Jr1[_Sr1].parent;
			this._Jr1[_Sr1].parent=_Br1;
			this._Jr1[_Sr1]._Dr1=_Br1;
			this._Jr1[_Sr1]._Er1=_Br1;
			this._Jr1[_Sr1].height=0;
			this._Jr1[_Sr1]._nm1=null;
			++this._Ir1;
			return _Sr1;
		}
		,_Rr1:
function(_Sr1)
		{
			_Ih1(0<=_Sr1&&_Sr1<this._Hr1);
			_Ih1(0<this._Ir1);
			this._Jr1[_Sr1].parent=this._Kr1;
			this._Jr1[_Sr1].height=-1;
			this._Kr1=_Sr1;
			--this._Ir1;
		}
		,_Pr1:
function(_is1)
		{
			++this._Mr1;
			if(this._Gr1==_Br1)
			{
				this._Gr1=_is1;
				this._Jr1[this._Gr1].parent=_Br1;
				return;
			}
			var _js1=this._Jr1[_is1]._Kk1;
			var index=this._Gr1;
			while(this._Jr1[index]._Fr1()==false) 
			{
				var _Dr1=this._Jr1[index]._Dr1;
				var _Er1=this._Jr1[index]._Er1;
				var _Ml1=this._Jr1[index]._Kk1._4p1();
				var _ks1=new _0p1();
				_ks1._5p1(this._Jr1[index]._Kk1,_js1);
				var _ls1=_ks1._4p1();
				var _ds1=2.0*_ls1;
				var _ms1=2.0*(_ls1-_Ml1);
				var _ns1;
				var _Kk1;
				if(this._Jr1[_Dr1]._Fr1())
				{
					_Kk1=new _0p1();
					_Kk1._5p1(_js1,this._Jr1[_Dr1]._Kk1);
					_ns1=_Kk1._4p1()+_ms1;
				}
				else 
				{
					_Kk1=new _0p1();
					_Kk1._5p1(_js1,this._Jr1[_Dr1]._Kk1);
					var _os1=this._Jr1[_Dr1]._Kk1._4p1();
					var _ps1=_Kk1._4p1();
					_ns1=(_ps1-_os1)+_ms1;
				}
				var _qs1;
				if(this._Jr1[_Er1]._Fr1())
				{
					_Kk1=new _0p1();
					_Kk1._5p1(_js1,this._Jr1[_Er1]._Kk1);
					_qs1=_Kk1._4p1()+_ms1;
				}
				else 
				{
					_Kk1=new _0p1();
					_Kk1._5p1(_js1,this._Jr1[_Er1]._Kk1);
					var _os1=this._Jr1[_Er1]._Kk1._4p1();
					var _ps1=_Kk1._4p1();
					_qs1=_ps1-_os1+_ms1;
				}
				if(_ds1<_ns1&&_ds1<_qs1)
				{
					break;
				}
				if(_ns1<_qs1)
				{
					index=_Dr1;
				}
				else 
				{
					index=_Er1;
				}
			}
			var _rs1=index;
			var _ss1=this._Jr1[_rs1].parent;
			var _ts1=this._Or1();
			this._Jr1[_ts1].parent=_ss1;
			this._Jr1[_ts1]._nm1=null;
			this._Jr1[_ts1]._Kk1._5p1(_js1,this._Jr1[_rs1]._Kk1);
			this._Jr1[_ts1].height=this._Jr1[_rs1].height+1;
			if(_ss1!=_Br1)
			{
				if(this._Jr1[_ss1]._Dr1==_rs1)
				{
					this._Jr1[_ss1]._Dr1=_ts1;
				}
				else 
				{
					this._Jr1[_ss1]._Er1=_ts1;
				}
				this._Jr1[_ts1]._Dr1=_rs1;
				this._Jr1[_ts1]._Er1=_is1;
				this._Jr1[_rs1].parent=_ts1;
				this._Jr1[_is1].parent=_ts1;
			}
			else 
			{
				this._Jr1[_ts1]._Dr1=_rs1;
				this._Jr1[_ts1]._Er1=_is1;
				this._Jr1[_rs1].parent=_ts1;
				this._Jr1[_is1].parent=_ts1;
				this._Gr1=_ts1;
			}
			index=this._Jr1[_is1].parent;
			while(index!=_Br1) 
			{
				index=this._us1(index);
				var _Dr1=this._Jr1[index]._Dr1;
				var _Er1=this._Jr1[index]._Er1;
				_Ih1(_Dr1!=_Br1);
				_Ih1(_Er1!=_Br1);
				this._Jr1[index].height=1+_Wj1(this._Jr1[_Dr1].height,this._Jr1[_Er1].height);
				this._Jr1[index]._Kk1._5p1(this._Jr1[_Dr1]._Kk1,this._Jr1[_Er1]._Kk1);
				index=this._Jr1[index].parent;
			}
		}
		,_Qr1:
function(_is1)
		{
			if(_is1==this._Gr1)
			{
				this._Gr1=_Br1;
				return;
			}
			var parent=this._Jr1[_is1].parent;
			var _vs1=this._Jr1[parent].parent;
			var _rs1;
			if(this._Jr1[parent]._Dr1==_is1)
			{
				_rs1=this._Jr1[parent]._Er1;
			}
			else 
			{
				_rs1=this._Jr1[parent]._Dr1;
			}
			if(_vs1!=_Br1)
			{
				if(this._Jr1[_vs1]._Dr1==parent)
				{
					this._Jr1[_vs1]._Dr1=_rs1;
				}
				else 
				{
					this._Jr1[_vs1]._Er1=_rs1;
				}
				this._Jr1[_rs1].parent=_vs1;
				this._Rr1(parent);
				var index=_vs1;
				while(index!=_Br1) 
				{
					index=this._us1(index);
					var _Dr1=this._Jr1[index]._Dr1;
					var _Er1=this._Jr1[index]._Er1;
					this._Jr1[index]._Kk1._5p1(this._Jr1[_Dr1]._Kk1,this._Jr1[_Er1]._Kk1);
					this._Jr1[index].height=1+_Wj1(this._Jr1[_Dr1].height,this._Jr1[_Er1].height);
					index=this._Jr1[index].parent;
				}
			}
			else 
			{
				this._Gr1=_rs1;
				this._Jr1[_rs1].parent=_Br1;
				this._Rr1(parent);
			}
		}
		,_us1:
function(_ws1)
		{
			_Ih1(_ws1!=_Br1);
			var _Jh1=this._Jr1[_ws1];
			if(_Jh1._Fr1()||_Jh1.height<2)
			{
				return _ws1;
			}
			var _xs1=_Jh1._Dr1;
			var _ys1=_Jh1._Er1;
			_Ih1(0<=_xs1&&_xs1<this._Hr1);
			_Ih1(0<=_ys1&&_ys1<this._Hr1);
			var _Ti1=this._Jr1[_xs1];
			var _Nj1=this._Jr1[_ys1];
			var _3s1=_Nj1.height-_Ti1.height;
			if(_3s1>1)
			{
				var _zs1=_Nj1._Dr1;
				var _As1=_Nj1._Er1;
				var _Bs1=this._Jr1[_zs1];
				var _Cs1=this._Jr1[_As1];
				_Ih1(0<=_zs1&&_zs1<this._Hr1);
				_Ih1(0<=_As1&&_As1<this._Hr1);
				_Nj1._Dr1=_ws1;
				_Nj1.parent=_Jh1.parent;
				_Jh1.parent=_ys1;
				if(_Nj1.parent!=_Br1)
				{
					if(this._Jr1[_Nj1.parent]._Dr1==_ws1)
					{
						this._Jr1[_Nj1.parent]._Dr1=_ys1;
					}
					else 
					{
						_Ih1(this._Jr1[_Nj1.parent]._Er1==_ws1);
						this._Jr1[_Nj1.parent]._Er1=_ys1;
					}
				}
				else 
				{
					this._Gr1=_ys1;
				}
				if(_Bs1.height>_Cs1.height)
				{
					_Nj1._Er1=_zs1;
					_Jh1._Er1=_As1;
					_Cs1.parent=_ws1;
					_Jh1._Kk1._5p1(_Ti1._Kk1,_Cs1._Kk1);
					_Nj1._Kk1._5p1(_Jh1._Kk1,_Bs1._Kk1);
					_Jh1.height=1+_Wj1(_Ti1.height,_Cs1.height);
					_Nj1.height=1+_Wj1(_Jh1.height,_Bs1.height);
				}
				else 
				{
					_Nj1._Er1=_As1;
					_Jh1._Er1=_zs1;
					_Bs1.parent=_ws1;
					_Jh1._Kk1._5p1(_Ti1._Kk1,_Bs1._Kk1);
					_Nj1._Kk1._5p1(_Jh1._Kk1,_Cs1._Kk1);
					_Jh1.height=1+_Wj1(_Ti1.height,_Bs1.height);
					_Nj1.height=1+_Wj1(_Jh1.height,_Cs1.height);
				}
				return _ys1;
			}
			if(_3s1<-1)
			{
				var _Ds1=_Ti1._Dr1;
				var _Es1=_Ti1._Er1;
				var _Ql1=this._Jr1[_Ds1];
				var _Fs1=this._Jr1[_Es1];
				_Ih1(0<=_Ds1&&_Ds1<this._Hr1);
				_Ih1(0<=_Es1&&_Es1<this._Hr1);
				_Ti1._Dr1=_ws1;
				_Ti1.parent=_Jh1.parent;
				_Jh1.parent=_xs1;
				if(_Ti1.parent!=_Br1)
				{
					if(this._Jr1[_Ti1.parent]._Dr1==_ws1)
					{
						this._Jr1[_Ti1.parent]._Dr1=_xs1;
					}
					else 
					{
						_Ih1(this._Jr1[_Ti1.parent]._Er1==_ws1);
						this._Jr1[_Ti1.parent]._Er1=_xs1;
					}
				}
				else 
				{
					this._Gr1=_xs1;
				}
				if(_Ql1.height>_Fs1.height)
				{
					_Ti1._Er1=_Ds1;
					_Jh1._Dr1=_Es1;
					_Fs1.parent=_ws1;
					_Jh1._Kk1._5p1(_Nj1._Kk1,_Fs1._Kk1);
					_Ti1._Kk1._5p1(_Jh1._Kk1,_Ql1._Kk1);
					_Jh1.height=1+_Wj1(_Nj1.height,_Fs1.height);
					_Ti1.height=1+_Wj1(_Jh1.height,_Ql1.height);
				}
				else 
				{
					_Ti1._Er1=_Es1;
					_Jh1._Dr1=_Ds1;
					_Ql1.parent=_ws1;
					_Jh1._Kk1._5p1(_Nj1._Kk1,_Ql1._Kk1);
					_Ti1._Kk1._5p1(_Jh1._Kk1,_Fs1._Kk1);
					_Jh1.height=1+_Wj1(_Nj1.height,_Ql1.height);
					_Ti1.height=1+_Wj1(_Jh1.height,_Fs1.height);
				}
				return _xs1;
			}
			return _ws1;
		}
		,_1s1:
function(_Sr1)
		{
			if(typeof(_Sr1)==='undefined')_Sr1=this._Gr1;
			_Ih1(0<=_Sr1&&_Sr1<this._Hr1);
			var _Fj=this._Jr1[_Sr1];
			if(_Fj._Fr1())
			{
				return 0;
			}
			var _Gs1=this._1s1(_Fj._Dr1);
			var _Hs1=this._1s1(_Fj._Er1);
			return 1+_Wj1(_Gs1,_Hs1);
		}
		,_Yr1:
function(index)
		{
			if(index==_Br1)
			{
				return;
			}
			if(index==this._Gr1)
			{
				_Ih1(this._Jr1[index].parent==_Br1);
			}
			var _Fj=this._Jr1[index];
			var _Dr1=_Fj._Dr1;
			var _Er1=_Fj._Er1;
			if(_Fj._Fr1())
			{
				_Ih1(_Dr1==_Br1);
				_Ih1(_Er1==_Br1);
				_Ih1(_Fj.height==0);
				return;
			}
			_Ih1(0<=_Dr1&&_Dr1<this._Hr1);
			_Ih1(0<=_Er1&&_Er1<this._Hr1);
			_Ih1(this._Jr1[_Dr1].parent==index);
			_Ih1(this._Jr1[_Er1].parent==index);
			this._Yr1(_Dr1);
			this._Yr1(_Er1);
		}
		,_Zr1:
function(index)
		{
			if(index==_Br1)
			{
				return;
			}
			var _Fj=this._Jr1[index];
			var _Dr1=_Fj._Dr1;
			var _Er1=_Fj._Er1;
			if(_Fj._Fr1())
			{
				_Ih1(_Dr1==_Br1);
				_Ih1(_Er1==_Br1);
				_Ih1(_Fj.height==0);
				return;
			}
			_Ih1(0<=_Dr1&&_Dr1<this._Hr1);
			_Ih1(0<=_Er1&&_Er1<this._Hr1);
			var _Gs1=this._Jr1[_Dr1].height;
			var _Hs1=this._Jr1[_Er1].height;
			var height;
			height=1+_Wj1(_Gs1,_Hs1);
			_Ih1(_Fj.height==height);
			var _Kk1=new _0p1();
			_Kk1._5p1(this._Jr1[_Dr1]._Kk1,this._Jr1[_Er1]._Kk1);
			_Ih1(_wi1._Li1(_Kk1._Yk1,_Fj._Kk1._Yk1));
			_Ih1(_wi1._Li1(_Kk1._Zk1,_Fj._Kk1._Zk1));
			this._Zr1(_Dr1);
			this._Zr1(_Er1);
		}
	}
	;

	function _Is1()
	{
		this._1n1=new _Sm1();
		this._2n1=new _Sm1();
		this._Js1=new _ij1();
		this._Ks1=new _ij1();
		this._Ls1=0;
	}
	;

	function _Ms1()
	{
		this.state=0;
		this._K5=0;
	}
	;
	_Ms1._Dq1=0;
	_Ms1._Ns1=1;
	_Ms1._Os1=2;
	_Ms1._Ps1=3;
	_Ms1._Qs1=4;

	function _Rs1()
	{
		this._Ss1=null;
		this._Ts1=null;
		this._Us1=null;
		this._Vs1=null;
		this._yF=0;
		this._Ws1=new _wi1();
		this._Xs1=new _wi1();
	}
	var _Ys1=new _gj1();
	var _Zs1=new _gj1();
	_Rs1.prototype=
	{
		_Co1:
function(_t7,_1n1,_Js1,_2n1,_Ks1,_dp1)
		{
			this._Ss1=_1n1;
			this._Ts1=_2n1;
			var _u7=_t7._u7;
			_Ih1(0<_u7&&_u7<3);
			this._Us1=_Js1;
			this._Vs1=_Ks1;
			this._Us1._oj1(_Ys1,_dp1);
			this._Vs1._oj1(_Zs1,_dp1);
			if(_u7==1)
			{
				this._yF=_Rs1.__s1;
				var _0t1=this._Ss1._1l1(_t7._Zm1[0]);
				var _1t1=this._Ts1._1l1(_t7.__m1[0]);
				var _Ho1=(_Ys1.q.c*_0t1.x-_Ys1.q._hg*_0t1.y)+_Ys1._fx.x;
				var _Io1=(_Ys1.q._hg*_0t1.x+_Ys1.q.c*_0t1.y)+_Ys1._fx.y;
				var _Jo1=(_Zs1.q.c*_1t1.x-_Zs1.q._hg*_1t1.y)+_Zs1._fx.x;
				var _Ko1=(_Zs1.q._hg*_1t1.x+_Zs1.q.c*_1t1.y)+_Zs1._fx.y;
				this._Xs1.x=_Jo1-_Ho1;
				this._Xs1.y=_Ko1-_Io1;
				var _hg=this._Xs1._Fi1();
				return _hg;
			}
			else if(_t7._Zm1[0]==_t7._Zm1[1])
			{
				this._yF=_Rs1._vo1;
				var _2t1=_2n1._1l1(_t7.__m1[0]);
				var _3t1=_2n1._1l1(_t7.__m1[1]);
				this._Xs1.x=1.0*(_3t1.y-_2t1.y);
				this._Xs1.y=-1.0*(_3t1.x-_2t1.x);
				this._Xs1._Fi1();
				var _dq1=_Zs1.q.c*this._Xs1.x-_Zs1.q._hg*this._Xs1.y;
				var _eq1=_Zs1.q._hg*this._Xs1.x+_Zs1.q.c*this._Xs1.y;
				this._Ws1.x=0.5*(_2t1.x+_3t1.x);
				this._Ws1.y=0.5*(_2t1.y+_3t1.y);
				var _Jo1=(_Zs1.q.c*this._Ws1.x-_Zs1.q._hg*this._Ws1.y)+_Zs1._fx.x;
				var _Ko1=(_Zs1.q._hg*this._Ws1.x+_Zs1.q.c*this._Ws1.y)+_Zs1._fx.y;
				var _0t1=_1n1._1l1(_t7._Zm1[0]);
				var _Ho1=(_Ys1.q.c*_0t1.x-_Ys1.q._hg*_0t1.y)+_Ys1._fx.x;
				var _Io1=(_Ys1.q._hg*_0t1.x+_Ys1.q.c*_0t1.y)+_Ys1._fx.y;
				var _hg=(_Ho1-_Jo1)*_dq1+(_Io1-_Ko1)*_eq1;
				if(_hg<0.0)
				{
					this._Xs1.x=-this._Xs1.x;
					this._Xs1.y=-this._Xs1.y;
					_hg=-_hg;
				}
				return _hg;
			}
			else 
			{
				this._yF=_Rs1._uo1;
				var _4t1=this._Ss1._1l1(_t7._Zm1[0]);
				var _5t1=this._Ss1._1l1(_t7._Zm1[1]);
				this._Xs1.x=1.0*(_5t1.y-_4t1.y);
				this._Xs1.y=-1.0*(_5t1.x-_4t1.x);
				this._Xs1._Fi1();
				var _dq1=_Ys1.q.c*this._Xs1.x-_Ys1.q._hg*this._Xs1.y;
				var _eq1=_Ys1.q._hg*this._Xs1.x+_Ys1.q.c*this._Xs1.y;
				this._Ws1.x=0.5*(_4t1.x+_5t1.x);
				this._Ws1.y=0.5*(_4t1.y+_5t1.y);
				var _Ho1=(_Ys1.q.c*this._Ws1.x-_Ys1.q._hg*this._Ws1.y)+_Ys1._fx.x;
				var _Io1=(_Ys1.q._hg*this._Ws1.x+_Ys1.q.c*this._Ws1.y)+_Ys1._fx.y;
				var _1t1=this._Ts1._1l1(_t7.__m1[0]);
				var _Jo1=(_Zs1.q.c*_1t1.x-_Zs1.q._hg*_1t1.y)+_Zs1._fx.x;
				var _Ko1=(_Zs1.q._hg*_1t1.x+_Zs1.q.c*_1t1.y)+_Zs1._fx.y;
				var _hg=(_Jo1-_Ho1)*_dq1+(_Ko1-_Io1)*_eq1;
				if(_hg<0.0)
				{
					this._Xs1.x=-this._Xs1.x;
					this._Xs1.y=-this._Xs1.y;
					_hg=-_hg;
				}
				return _hg;
			}
		}
		,_6t1:
function(_G8,_K5)
		{
			this._Us1._oj1(_Ys1,_K5);
			this._Vs1._oj1(_Zs1,_K5);
			switch(this._yF)
			{
				case _Rs1.__s1:
				{
					var _7t1=_Ys1.q.c*this._Xs1.x+_Ys1.q._hg*this._Xs1.y;
					var _8t1=-_Ys1.q._hg*this._Xs1.x+_Ys1.q.c*this._Xs1.y;
					var _9t1=_Zs1.q.c*-this._Xs1.x+_Zs1.q._hg*-this._Xs1.y;
					var _at1=-_Zs1.q._hg*-this._Xs1.x+_Zs1.q.c*-this._Xs1.y;
					_G8[0]=this._Ss1.__k1(_7t1,_8t1);
					_G8[1]=this._Ts1.__k1(_9t1,_at1);
					var _0t1=this._Ss1._1l1(_G8[0]);
					var _1t1=this._Ts1._1l1(_G8[1]);
					var _Ho1=(_Ys1.q.c*_0t1.x-_Ys1.q._hg*_0t1.y)+_Ys1._fx.x;
					var _Io1=(_Ys1.q._hg*_0t1.x+_Ys1.q.c*_0t1.y)+_Ys1._fx.y;
					var _Jo1=(_Zs1.q.c*_1t1.x-_Zs1.q._hg*_1t1.y)+_Zs1._fx.x;
					var _Ko1=(_Zs1.q._hg*_1t1.x+_Zs1.q.c*_1t1.y)+_Zs1._fx.y;
					return(_Jo1-_Ho1)*this._Xs1.x+(_Ko1-_Io1)*this._Xs1.y;
				}
				case _Rs1._uo1:
				{
					var _dq1=_Ys1.q.c*this._Xs1.x-_Ys1.q._hg*this._Xs1.y;
					var _eq1=_Ys1.q._hg*this._Xs1.x+_Ys1.q.c*this._Xs1.y;
					var _Ho1=(_Ys1.q.c*this._Ws1.x-_Ys1.q._hg*this._Ws1.y)+_Ys1._fx.x;
					var _Io1=(_Ys1.q._hg*this._Ws1.x+_Ys1.q.c*this._Ws1.y)+_Ys1._fx.y;
					var _9t1=_Zs1.q.c*-_dq1+_Zs1.q._hg*-_eq1;
					var _at1=-_Zs1.q._hg*-_dq1+_Zs1.q.c*-_eq1;
					_G8[0]=-1;
					_G8[1]=this._Ts1.__k1(_9t1,_at1);
					var _1t1=this._Ts1._1l1(_G8[1]);
					var _Jo1=(_Zs1.q.c*_1t1.x-_Zs1.q._hg*_1t1.y)+_Zs1._fx.x;
					var _Ko1=(_Zs1.q._hg*_1t1.x+_Zs1.q.c*_1t1.y)+_Zs1._fx.y;
					return(_Jo1-_Ho1)*_dq1+(_Ko1-_Io1)*_eq1;
				}
				case _Rs1._vo1:
				{
					var _dq1=_Zs1.q.c*this._Xs1.x-_Zs1.q._hg*this._Xs1.y;
					var _eq1=_Zs1.q._hg*this._Xs1.x+_Zs1.q.c*this._Xs1.y;
					var _Jo1=(_Zs1.q.c*this._Ws1.x-_Zs1.q._hg*this._Ws1.y)+_Zs1._fx.x;
					var _Ko1=(_Zs1.q._hg*this._Ws1.x+_Zs1.q.c*this._Ws1.y)+_Zs1._fx.y;
					var _7t1=_Ys1.q.c*-_dq1+_Ys1.q._hg*-_eq1;
					var _at1=-_Ys1.q._hg*-_dq1+_Ys1.q.c*-_eq1;
					_G8[1]=-1;
					_G8[0]=this._Ss1.__k1(_7t1,_at1);
					var _0t1=this._Ss1._1l1(_G8[0]);
					var _Ho1=(_Ys1.q.c*_0t1.x-_Ys1.q._hg*_0t1.y)+_Ys1._fx.x;
					var _Io1=(_Ys1.q._hg*_0t1.x+_Ys1.q.c*_0t1.y)+_Ys1._fx.y;
					return(_Ho1-_Jo1)*_dq1+(_Io1-_Ko1)*_eq1;
				}
				default :_Ih1(false);
				_G8[0]=-1;
				_G8[1]=-1;
				return 0.0;
			}
		}
		,_7k:
function(_Zm1,__m1,_K5)
		{
			this._Us1._oj1(_Ys1,_K5);
			this._Vs1._oj1(_Zs1,_K5);
			switch(this._yF)
			{
				case _Rs1.__s1:
				{
					var _0t1=this._Ss1._1l1(_Zm1);
					var _1t1=this._Ts1._1l1(__m1);
					var _Ho1=(_Ys1.q.c*_0t1.x-_Ys1.q._hg*_0t1.y)+_Ys1._fx.x;
					var _Io1=(_Ys1.q._hg*_0t1.x+_Ys1.q.c*_0t1.y)+_Ys1._fx.y;
					var _Jo1=(_Zs1.q.c*_1t1.x-_Zs1.q._hg*_1t1.y)+_Zs1._fx.x;
					var _Ko1=(_Zs1.q._hg*_1t1.x+_Zs1.q.c*_1t1.y)+_Zs1._fx.y;
					var _np1=(_Jo1-_Ho1)*this._Xs1.x+(_Ko1-_Io1)*this._Xs1.y;
					return _np1;
				}
				case _Rs1._uo1:
				{
					var _dq1=_Ys1.q.c*this._Xs1.x-_Ys1.q._hg*this._Xs1.y;
					var _eq1=_Ys1.q._hg*this._Xs1.x+_Ys1.q.c*this._Xs1.y;
					var _Ho1=(_Ys1.q.c*this._Ws1.x-_Ys1.q._hg*this._Ws1.y)+_Ys1._fx.x;
					var _Io1=(_Ys1.q._hg*this._Ws1.x+_Ys1.q.c*this._Ws1.y)+_Ys1._fx.y;
					var _1t1=this._Ts1._1l1(__m1);
					var _Jo1=(_Zs1.q.c*_1t1.x-_Zs1.q._hg*_1t1.y)+_Zs1._fx.x;
					var _Ko1=(_Zs1.q._hg*_1t1.x+_Zs1.q.c*_1t1.y)+_Zs1._fx.y;
					var _np1=(_Jo1-_Ho1)*_dq1+(_Ko1-_Io1)*_eq1;
					return _np1;
				}
				case _Rs1._vo1:
				{
					var _dq1=_Zs1.q.c*this._Xs1.x-_Zs1.q._hg*this._Xs1.y;
					var _eq1=_Zs1.q._hg*this._Xs1.x+_Zs1.q.c*this._Xs1.y;
					var _Jo1=(_Zs1.q.c*this._Ws1.x-_Zs1.q._hg*this._Ws1.y)+_Zs1._fx.x;
					var _Ko1=(_Zs1.q._hg*this._Ws1.x+_Zs1.q.c*this._Ws1.y)+_Zs1._fx.y;
					var _0t1=this._Ss1._1l1(_Zm1);
					var _Ho1=(_Ys1.q.c*_0t1.x-_Ys1.q._hg*_0t1.y)+_Ys1._fx.x;
					var _Io1=(_Ys1.q._hg*_0t1.x+_Ys1.q.c*_0t1.y)+_Ys1._fx.y;
					var _np1=(_Ho1-_Jo1)*_dq1+(_Io1-_Ko1)*_eq1;
					return _np1;
				}
				default :_Ih1(false);
				return 0.0;
			}
		}
	}
	;
	_Rs1.__s1=0;
	_Rs1._uo1=1;
	_Rs1._vo1=2;
	var _bt1=_rh1._Bh1("toi","solveTOI");

	function _ct1(output,input)
	{
		_bt1.start();
		++_ct1._dt1;
		output.state=_Ms1._Dq1;
		output._K5=input._Ls1;
		var _1n1=input._1n1;
		var _2n1=input._2n1;
		_ct1._et1._PG(input._Js1);
		_ct1._ft1._PG(input._Ks1);
		_ct1._et1._Fi1();
		_ct1._ft1._Fi1();
		var _Ls1=input._Ls1;
		var _Xp1=_1n1._Ek1+_2n1._Ek1;
		var target=_Wj1(_Rh1,_Xp1-3.0*_Rh1);
		var _gt1=0.25*_Rh1;
		_Ih1(target>_gt1);
		var _dp1=0.0;
		var _ht1=20;
		var _Ba1=0;
		var _t7=new _Xm1();
		_t7._u7=0;
		var _it1=new _0n1();
		_it1._1n1._PG(input._1n1);
		_it1._2n1._PG(input._2n1);
		_it1._5n1=false;
		for(;;)
		{
			_ct1._et1._oj1(_it1._3n1,_dp1);
			_ct1._ft1._oj1(_it1._4n1,_dp1);
			var _jt1=new _6n1();
			_Zn1(_jt1,_t7,_it1);
			if(_jt1._Ok1<=0.0)
			{
				output.state=_Ms1._Os1;
				output._K5=0.0;
				break;
			}
			if(_jt1._Ok1<target+_gt1)
			{
				output.state=_Ms1._Ps1;
				output._K5=_dp1;
				break;
			}
			var _kt1=new _Rs1();
			_kt1._Co1(_t7,_1n1,_ct1._et1,_2n1,_ct1._ft1,_dp1);
			var _lt1=false;
			var _ep1=_Ls1;
			var _mt1=0;
			for(;;)
			{
				var _G8=[];
				var __q=_kt1._6t1(_G8,_ep1);
				if(__q>target+_gt1)
				{
					output.state=_Ms1._Qs1;
					output._K5=_Ls1;
					_lt1=true;
					break;
				}
				if(__q>target-_gt1)
				{
					_dp1=_ep1;
					break;
				}
				var _Zq=_kt1._7k(_G8[0],_G8[1],_dp1);
				if(_Zq<target-_gt1)
				{
					output.state=_Ms1._Ns1;
					output._K5=_dp1;
					_lt1=true;
					break;
				}
				if(_Zq<=target+_gt1)
				{
					output.state=_Ms1._Ps1;
					output._K5=_dp1;
					_lt1=true;
					break;
				}
				var _nt1=0;
				var _Lc1=_dp1,_Mc1=_ep1;
				for(;;)
				{
					var _K5;
					if(_nt1&1)
					{
						_K5=_Lc1+(target-_Zq)*(_Mc1-_Lc1)/(__q-_Zq);
					}
					else 
					{
						_K5=0.5*(_Lc1+_Mc1);
					}
					++_nt1;
					++_ct1._ot1;
					var _hg=_kt1._7k(_G8[0],_G8[1],_K5);
					if(_Rj1(_hg-target)<_gt1)
					{
						_ep1=_K5;
						break;
					}
					if(_hg>target)
					{
						_Lc1=_K5;
						_Zq=_hg;
					}
					else 
					{
						_Mc1=_K5;
						__q=_hg;
					}
					if(_nt1==50)
					{
						break;
					}
				}
				_ct1._pt1=_Wj1(_ct1._pt1,_nt1);
				++_mt1;
				if(_mt1==_Oh1)
				{
					break;
				}
			}
			++_Ba1;
			++_ct1._qt1;
			if(_lt1)
			{
				break;
			}
			if(_Ba1==_ht1)
			{
				output.state=_Ms1._Ns1;
				output._K5=_dp1;
				break;
			}
		}
		_ct1._rt1=_Wj1(_ct1._rt1,_Ba1);
		_bt1.stop();
		_ct1._st1=_Wj1(_ct1._st1,_bt1._vh1);
		_ct1._tt1+=_bt1._vh1;
	}
	_ct1._et1=new _ij1();
	_ct1._ft1=new _ij1();
	_ct1._tt1=0;
	_ct1._st1=0;
	_ct1._dt1=0;
	_ct1._qt1=0;
	_ct1._rt1=0;
	_ct1._ot1=0;
	_ct1._pt1=0;

	function _ut1()
	{
		this.type=_vt1._wt1;
		this.position=new _wi1(0.0,0.0);
		this.angle=0.0;
		this._xt1=new _wi1(0.0,0.0);
		this._yt1=0.0;
		this._zt1=0.0;
		this._At1=0.0;
		this._Bt1=true;
		this._Ct1=true;
		this._Dt1=false;
		this._Et1=false;
		this.active=true;
		this._nm1=null;
		this._Ft1=1.0;
		Object.seal(this);
	}
	_ut1.prototype=
	{
		_Ki1:
function(data)
		{
			this.type=data['type'];
			this.position._Ki1(data['position']);
			this.angle=data['angle'];
			this._xt1._Ki1(data['linearVelocity']);
			this._yt1=data['angularVelocity'];
			this._zt1=data['linearDamping'];
			this._At1=data['angularDamping'];
			this._Bt1=data['allowSleep'];
			this._Ct1=data['awake'];
			this._Dt1=data['fixedRotation'];
			this._Et1=data['bullet'];
			this.active=data['active'];
			this._Ft1=data['gravityScale'];
		}
	}
	;

	function _vt1(_Gt1,_Ht1)
	{
		_Ih1(_Gt1.position._Hi1());
		_Ih1(_Gt1._xt1._Hi1());
		_Ih1(_mi1(_Gt1.angle));
		_Ih1(_mi1(_Gt1._yt1));
		_Ih1(_mi1(_Gt1._At1)&&_Gt1._At1>=0.0);
		_Ih1(_mi1(_Gt1._zt1)&&_Gt1._zt1>=0.0);
		this._It1=0;
		this._Jt1=0;
		if(_Gt1._Et1)
		{
			this._Jt1|=_vt1._Kt1;
		}
		if(_Gt1._Dt1)
		{
			this._Jt1|=_vt1._Lt1;
		}
		if(_Gt1._Bt1)
		{
			this._Jt1|=_vt1._Mt1;
		}
		if(_Gt1._Ct1)
		{
			this._Jt1|=_vt1._Nt1;
		}
		if(_Gt1.active)
		{
			this._Jt1|=_vt1._Ot1;
		}
		this._Pt1=_Ht1;
		this._Mq1=new _gj1();
		this._Mq1._fx._PG(_Gt1.position);
		this._Mq1.q.Set(_Gt1.angle);
		this._Qt1=new _gj1();
		this._Qt1._PG(this._Mq1);
		this._Rt1=new _ij1();
		this._Rt1._jj1._xi1();
		this._Rt1._kj1._PG(this._Mq1._fx);
		this._Rt1.c._PG(this._Mq1._fx);
		this._Rt1._mj1=_Gt1.angle;
		this._Rt1._i3=_Gt1.angle;
		this._Rt1._nj1=0.0;
		this._St1=null;
		this._Tt1=null;
		this._Ut1=null;
		this._Vt1=null;
		this._Wt1=_Gt1._xt1._72();
		this._Xt1=_Gt1._yt1;
		this._Yt1=_Gt1._zt1;
		this._Zt1=_Gt1._At1;
		this.__t1=_Gt1._Ft1;
		this._0u1=new _wi1();
		this._1u1=0.0;
		this._2u1=0.0;
		this._yF=_Gt1.type;
		if(this._yF==_vt1._3u1)
		{
			this._4u1=1.0;
			this._5u1=1.0;
		}
		else 
		{
			this._4u1=0.0;
			this._5u1=0.0;
		}
		this._6u1=0.0;
		this._7u1=0.0;
		this._8u1=_Gt1._nm1;
		this._9u1=null;
		this._au1=0;
	}
	_vt1._wt1=0;
	_vt1._bu1=1;
	_vt1._3u1=2;
	_vt1._cu1=0x0001;
	_vt1._Nt1=0x0002;
	_vt1._Mt1=0x0004;
	_vt1._Kt1=0x0008;
	_vt1._Lt1=0x0010;
	_vt1._Ot1=0x0020;
	_vt1._du1=0x0040;
	_vt1._eu1=new _wi1();
	_vt1._fu1=new _gj1();
	_vt1.prototype=
	{
		_gu1:
function(_hu1,_j_)
		{
			if(typeof(_j_)!=='undefined')
			{
				var _iu1=new _ju1();
				_iu1.shape=_hu1;
				_iu1._j_=_j_;
				return this._gu1(_iu1);
			}
			_Ih1(this._Pt1._Ke1()==false);
			if(this._Pt1._Ke1()==true)
			{
				return null;
			}
			var _CX=new _ku1();
			_CX._981(this,_hu1);
			if(this._Jt1&_vt1._Ot1)
			{
				var _lu1=this._Pt1._mu1._nu1;
				_CX._ou1(_lu1,this._Mq1);
			}
			_CX._Vt1=this._9u1;
			this._9u1=_CX;
			++this._au1;
			_CX._pu1=this;
			if(_CX._qu1>0.0)
			{
				this._ru1();
			}
			this._Pt1._Jt1|=_su1._tu1;
			return _CX;
		}
		,_uu1:
function(_CX)
		{
			_Ih1(this._Pt1._Ke1()==false);
			if(this._Pt1._Ke1()==true)
			{
				return;
			}
			_Ih1(_CX._pu1==this);
			_Ih1(this._au1>0);
			var _Fj=this._9u1;
			var _0t=false;
			while(_Fj!=null) 
			{
				if(_Fj==_CX)
				{
					this._9u1=_Fj=_CX._Vt1;
					_0t=true;
					break;
				}
				_Fj=_Fj._Vt1;
			}
			_Ih1(_0t);
			var _vl1=this._Tt1;
			while(_vl1) 
			{
				var c=_vl1._vu1;
				_vl1=_vl1._gj;
				var _wu1=c._xu1();
				var _yu1=c._zu1();
				if(_CX==_wu1||_CX==_yu1)
				{
					this._Pt1._mu1._Ne1(c);
				}
			}
			if(this._Jt1&_vt1._Ot1)
			{
				var _lu1=this._Pt1._mu1._nu1;
				_CX._Au1(_lu1);
			}
			_CX._Ne1();
			_CX._pu1=null;
			_CX._Vt1=null;
			--this._au1;
			this._ru1();
		}
		,_Bu1:
function(position,angle)
		{
			_Ih1(this._Pt1._Ke1()==false);
			if(this._Pt1._Ke1()==true)
			{
				return;
			}
			this._Mq1.q.Set(angle);
			this._Mq1._fx._PG(position);
			this._Qt1._PG(this._Mq1);
			this._Rt1.c._PG(_Jj1(this._Mq1,this._Rt1._jj1));
			this._Rt1._i3=angle;
			this._Rt1._kj1._PG(this._Rt1.c);
			this._Rt1._mj1=angle;
			var _lu1=this._Pt1._mu1._nu1;
			for(var _At=this._9u1;_At;_At=_At._Vt1)
			{
				_At._Cu1(_lu1,this._Mq1,this._Mq1);
			}
		}
		,_oj1:
function()
		{
			return this._Mq1;
		}
		,_6X:
function()
		{
			return this._Mq1._fx;
		}
		,_dj1:
function()
		{
			return this._Rt1._i3;
		}
		,_Du1:
function()
		{
			return this._Rt1.c;
		}
		,_Eu1:
function()
		{
			return this._Rt1._jj1;
		}
		,_Fu1:
function(_Z3)
		{
			if(this._yF==_vt1._wt1)
			{
				return;
			}
			if(_sj1(_Z3,_Z3)>0.0)
			{
				this._SX(true);
			}
			this._Wt1=_Z3;
		}
		,_Gu1:
function()
		{
			return this._Wt1;
		}
		,_Hu1:
function(w)
		{
			if(this._yF==_vt1._wt1)
			{
				return;
			}
			if(w*w>0.0)
			{
				this._SX(true);
			}
			this._Xt1=w;
		}
		,_Iu1:
function()
		{
			return this._Xt1;
		}
		,_dZ:
function(_Ju1,_oo1,_Ku1)
		{
			if(this._yF!=_vt1._3u1)
			{
				return;
			}
			if(_Ku1&&(this._Jt1&_vt1._Nt1)==0)
			{
				this._SX(true);
			}
			if(this._Jt1&_vt1._Nt1)
			{
				this._0u1._ce(_Ju1);
				this._1u1+=_tj1(_wi1._Di1(_oo1,this._Rt1.c),_Ju1);
			}
		}
		,_Lu1:
function(_Ju1,_Ku1)
		{
			if(this._yF!=_vt1._3u1)
			{
				return;
			}
			if(_Ku1&&(this._Jt1&_vt1._Nt1)==0)
			{
				this._SX(true);
			}
			if(this._Jt1&_vt1._Nt1)
			{
				this._0u1._ce(_Ju1);
			}
		}
		,_uZ:
function(_Mu1,_Ku1)
		{
			if(this._yF!=_vt1._3u1)
			{
				return;
			}
			if(_Ku1&&(this._Jt1&_vt1._Nt1)==0)
			{
				this._SX(true);
			}
			if(this._Jt1&_vt1._Nt1)
			{
				this._1u1+=_Mu1;
			}
		}
		,_Nu1:
function(_Ou1,_oo1,_Ku1)
		{
			if(this._yF!=_vt1._3u1)
			{
				return;
			}
			if(_Ku1&&(this._Jt1&_vt1._Nt1)==0)
			{
				this._SX(true);
			}
			if(this._Jt1&_vt1._Nt1)
			{
				this._Wt1._ce(_wi1.Multiply(this._5u1,_Ou1));
				this._Xt1+=this._7u1*_tj1(_wi1._Di1(_oo1,this._Rt1.c),_Ou1);
			}
		}
		,_sZ:
function(_Ou1,_Ku1)
		{
			if(this._yF!=_vt1._3u1)
			{
				return;
			}
			if(_Ku1&&(this._Jt1&_vt1._Nt1)==0)
			{
				this._SX(true);
			}
			if(this._Jt1&_vt1._Nt1)
			{
				this._Xt1+=this._7u1*_Ou1;
			}
		}
		,_Pu1:
function()
		{
			return this._4u1;
		}
		,_Qu1:
function()
		{
			return this._6u1+this._4u1*_sj1(this._Rt1._jj1,this._Rt1._jj1);
		}
		,_Ru1:
function(data)
		{
			data._Bk1=this._4u1;
			data._Ck1=this._6u1+this._4u1*_sj1(this._Rt1._jj1,this._Rt1._jj1);
			data._fk1=this._Rt1._jj1;
		}
		,_Su1:
function(_Mk1)
		{
			_Ih1(this._Pt1._Ke1()==false);
			if(this._Pt1._Ke1()==true)
			{
				return;
			}
			if(this._yF!=_vt1._3u1)
			{
				return;
			}
			this._5u1=0.0;
			this._6u1=0.0;
			this._7u1=0.0;
			this._4u1=_Mk1._Bk1;
			if(this._4u1<=0.0)
			{
				this._4u1=1.0;
			}
			this._5u1=1.0/this._4u1;
			if(_Mk1._Ck1>0.0&&(this._Jt1&_vt1._Lt1)==0)
			{
				this._6u1=_Mk1._Ck1-this._4u1*_sj1(_Mk1._fk1,_Mk1._fk1);
				_Ih1(this._6u1>0.0);
				this._7u1=1.0/this._6u1;
			}
			_vt1._eu1._PG(this._Rt1.c);
			this._Rt1._jj1._PG(_Mk1._fk1);
			this._Rt1._kj1._PG(_Jj1(this._Mq1,this._Rt1._jj1));
			this._Rt1.c._PG(this._Rt1._kj1);
			this._Wt1._ce(_vj1(this._Xt1,_wi1._Di1(this._Rt1.c,_vt1._eu1)));
		}
		,_ru1:
function()
		{
			this._4u1=0.0;
			this._5u1=0.0;
			this._6u1=0.0;
			this._7u1=0.0;
			this._Rt1._jj1._xi1();
			if(this._yF==_vt1._wt1||this._yF==_vt1._bu1)
			{
				this._Rt1._kj1._PG(this._Mq1._fx);
				this._Rt1.c._PG(this._Mq1._fx);
				this._Rt1._mj1=this._Rt1._i3;
				return;
			}
			_Ih1(this._yF==_vt1._3u1);
			var _jj1=new _wi1(0,0);
			for(var _At=this._9u1;_At;_At=_At._Vt1)
			{
				if(_At._qu1==0.0)
				{
					continue;
				}
				var _Mk1=new _Ak1();
				_At._Ru1(_Mk1);
				this._4u1+=_Mk1._Bk1;
				_jj1._ce(_wi1.Multiply(_Mk1._Bk1,_Mk1._fk1));
				this._6u1+=_Mk1._Ck1;
			}
			if(this._4u1>0.0)
			{
				this._5u1=1.0/this._4u1;
				_jj1.Multiply(this._5u1);
			}
			else 
			{
				this._4u1=1.0;
				this._5u1=1.0;
			}
			if(this._6u1>0.0&&(this._Jt1&_vt1._Lt1)==0)
			{
				this._6u1-=this._4u1*_sj1(_jj1,_jj1);
				_Ih1(this._6u1>0.0);
				this._7u1=1.0/this._6u1;
			}
			else 
			{
				this._6u1=0.0;
				this._7u1=0.0;
			}
			_vt1._eu1._PG(this._Rt1.c);
			this._Rt1._jj1._PG(_jj1);
			this._Rt1._kj1._PG(_Jj1(this._Mq1,this._Rt1._jj1));
			this._Rt1.c._PG(this._Rt1._kj1);
			this._Wt1._ce(_vj1(this._Xt1,_wi1._Di1(this._Rt1.c,_vt1._eu1)));
		}
		,_Tu1:
function(_lo1)
		{
			return _Jj1(this._Mq1,_lo1);
		}
		,_Uu1:
function(_Vu1)
		{
			return _Hj1(this._Mq1.q,_Vu1);
		}
		,_Wu1:
function(_Xu1)
		{
			return _Lj1(this._Mq1,_Xu1);
		}
		,_Yu1:
function(_Zu1)
		{
			return _Ij1(this._Mq1.q,_Zu1);
		}
		,__u1:
function(_Xu1)
		{
			return _wi1._ce(this._Wt1,_vj1(this._Xt1,_wi1._Di1(_Xu1,this._Rt1.c)));
		}
		,_0v1:
function(_lo1)
		{
			return this.__u1(this._Tu1(_lo1));
		}
		,_1v1:
function()
		{
			return this._Yt1;
		}
		,_PX:
function(_zt1)
		{
			this._Yt1=_zt1;
		}
		,_2v1:
function()
		{
			return this._Zt1;
		}
		,_QX:
function(_At1)
		{
			this._Zt1=_At1;
		}
		,_3v1:
function()
		{
			return this.__t1;
		}
		,_4v1:
function(scale)
		{
			this.__t1=scale;
		}
		,_5v1:
function(type)
		{
			_Ih1(this._Pt1._Ke1()==false);
			if(this._Pt1._Ke1()==true)
			{
				return;
			}
			if(this._yF==type)
			{
				return;
			}
			this._yF=type;
			this._ru1();
			if(this._yF==_vt1._wt1)
			{
				this._Wt1._xi1();
				this._Xt1=0.0;
				this._Rt1._mj1=this._Rt1._i3;
				this._Rt1._kj1._PG(this._Rt1.c);
				this._6v1();
			}
			this._SX(true);
			this._0u1._xi1();
			this._1u1=0.0;
			var _7v1=this._Tt1;
			while(_7v1) 
			{
				var _8v1=_7v1;
				_7v1=_7v1._gj;
				this._Pt1._mu1._Ne1(_8v1._vu1);
			}
			this._Tt1=null;
			var _lu1=this._Pt1._mu1._nu1;
			for(var _At=this._9u1;_At;_At=_At._Vt1)
			{
				var _9v1=_At._hm1;
				for(var i=0;i<_9v1;++i)
				{
					_lu1._um1(_At._av1[i]._om1);
				}
			}
		}
		,_9e1:
function()
		{
			return this._yF;
		}
		,_bv1:
function(_cv1)
		{
			if(_cv1)
			{
				this._Jt1|=_vt1._Kt1;
			}
			else 
			{
				this._Jt1&=~_vt1._Kt1;
			}
		}
		,_dv1:
function()
		{
			return(this._Jt1&_vt1._Kt1)==_vt1._Kt1;
		}
		,_ev1:
function(_cv1)
		{
			if(_cv1)
			{
				this._Jt1|=_vt1._Mt1;
			}
			else 
			{
				this._Jt1&=~_vt1._Mt1;
				this._SX(true);
			}
		}
		,_fv1:
function()
		{
			return(this._Jt1&_vt1._Mt1)==_vt1._Mt1;
		}
		,_SX:
function(_cv1)
		{
			if(_cv1)
			{
				if((this._Jt1&_vt1._Nt1)==0)
				{
					this._Jt1|=_vt1._Nt1;
					this._2u1=0.0;
				}
			}
			else 
			{
				this._Jt1&=~_vt1._Nt1;
				this._2u1=0.0;
				this._Wt1._xi1();
				this._Xt1=0.0;
				this._0u1._xi1();
				this._1u1=0.0;
			}
		}
		,_gv1:
function()
		{
			return(this._Jt1&_vt1._Nt1)==_vt1._Nt1;
		}
		,_hv1:
function(_cv1)
		{
			_Ih1(this._Pt1._Ke1()==false);
			if(_cv1==this._iv1())
			{
				return;
			}
			if(_cv1)
			{
				this._Jt1|=_vt1._Ot1;
				var _lu1=this._Pt1._mu1._nu1;
				for(var _At=this._9u1;_At;_At=_At._Vt1)
				{
					_At._ou1(_lu1,this._Mq1);
				}
			}
			else 
			{
				this._Jt1&=~_vt1._Ot1;
				var _lu1=this._Pt1._mu1._nu1;
				for(var _At=this._9u1;_At;_At=_At._Vt1)
				{
					_At._Au1(_lu1);
				}
				var _7v1=this._Tt1;
				while(_7v1) 
				{
					var _8v1=_7v1;
					_7v1=_7v1._gj;
					this._Pt1._mu1._Ne1(_8v1._vu1);
				}
				this._Tt1=null;
			}
		}
		,_iv1:
function()
		{
			return(this._Jt1&_vt1._Ot1)==_vt1._Ot1;
		}
		,_jv1:
function(_cv1)
		{
			var status=(this._Jt1&_vt1._Lt1)==_vt1._Lt1;
			if(status==_cv1)
			{
				return;
			}
			if(_cv1)
			{
				this._Jt1|=_vt1._Lt1;
			}
			else 
			{
				this._Jt1&=~_vt1._Lt1;
			}
			this._Xt1=0.0;
			this._ru1();
		}
		,_kv1:
function()
		{
			return(this._Jt1&_vt1._Lt1)==_vt1._Lt1;
		}
		,_lv1:
function()
		{
			return this._9u1;
		}
		,_mv1:
function()
		{
			return this._St1;
		}
		,_nv1:
function()
		{
			return this._Tt1;
		}
		,_ov1:
function()
		{
			return this._Vt1;
		}
		,_wm1:
function()
		{
			return this._8u1;
		}
		,_pv1:
function(data)
		{
			this._8u1=data;
		}
		,_qv1:
function()
		{
			return this._Pt1;
		}
		,_6v1:
function()
		{
			_vt1._fu1.q.Set(this._Rt1._mj1);
			_vt1._fu1._fx._PG(_wi1._Di1(this._Rt1._kj1,_Hj1(_vt1._fu1.q,this._Rt1._jj1)));
			var _lu1=this._Pt1._mu1._nu1;
			for(var _At=this._9u1;_At;_At=_At._Vt1)
			{
				_At._Cu1(_lu1,_vt1._fu1,this._Mq1);
			}
		}
		,_rv1:
function()
		{
			this._Mq1.q.Set(this._Rt1._i3);
			this._Mq1._fx._PG(_wi1._Di1(this._Rt1.c,_Hj1(this._Mq1.q,this._Rt1._jj1)));
		}
		,_sv1:
function(other)
		{
			if(this._yF!=_vt1._3u1&&other._yF!=_vt1._3u1)
			{
				return false;
			}
			for(var _tv1=this._St1;_tv1;_tv1=_tv1._gj)
			{
				if(_tv1.other==other)
				{
					if(_tv1._jY._uv1==false)
					{
						return false;
					}
				}
			}
			return true;
		}
		,_qj1:
function(alpha)
		{
			this._Rt1._qj1(alpha);
			this._Rt1.c._PG(this._Rt1._kj1);
			this._Rt1._i3=this._Rt1._mj1;
			this._Mq1.q.Set(this._Rt1._i3);
			this._Mq1._fx._PG(_wi1._Di1(this._Rt1.c,_Hj1(this._Mq1.q,this._Rt1._jj1)));
		}
		,_Ji1:
function(out)
		{
			var __i=out||
			{
			}
			;
			__i['fixtures']=null;
			__i['type']=this._yF;
			__i['position']=this._6X()._Ji1();
			__i['angle']=this._dj1();
			__i['linearVelocity']=this._Gu1()._Ji1();
			__i['angularVelocity']=this._Iu1();
			__i['linearDamping']=this._1v1();
			__i['angularDamping']=this._2v1();
			__i['allowSleep']=this._fv1();
			__i['awake']=this._gv1();
			__i['fixedRotation']=this._kv1();
			__i['bullet']=this._dv1();
			__i['active']=this._iv1();
			__i['gravityScale']=this._3v1();
			return __i;
		}
	}
	;

	function _vv1()
	{
		this._wv1=0x0001;
		this._xv1=0xFFFF;
		this._yv1=0;
	}
	_vv1.prototype=
	{
		_72:
function()
		{
			var filter=new _vv1();
			filter._wv1=this._wv1;
			filter._xv1=this._xv1;
			filter._yv1=this._yv1;
			return filter;
		}
		,_PG:
function(filter)
		{
			this._wv1=filter._wv1;
			this._xv1=filter._xv1;
			this._yv1=filter._yv1;
		}
		,_Ji1:
function(out)
		{
			var __i=out||
			{
			}
			;
			__i['categoryBits']=this._wv1;
			__i['maskBits']=this._xv1;
			__i['groupIndex']=this._yv1;
			return __i;
		}
		,_Ki1:
function(data)
		{
			this._wv1=data['categoryBits'];
			this._xv1=data['maskBits'];
			this._yv1=data['groupIndex'];
		}
	}
	;

	function _ju1()
	{
		this.shape=null;
		this._nm1=null;
		this.friction=0.2;
		this._zv1=0.0;
		this._j_=0.0;
		this._Av1=false;
		this.filter=new _vv1();
		Object.seal(this);
	}
	_ju1.prototype=
	{
		_Ki1:
function(data)
		{
			this.friction=data['friction'];
			this._zv1=data['restitution'];
			this._j_=data['density'];
			this._Av1=data['isSensor'];
			this.filter._Ki1(data['filter']);
		}
	}
	;

	function _Bv1()
	{
		this._Kk1=new _0p1();
		this._CX=null;
		this._Ik1=0;
		this._om1=0;
	}
	;

	function _ku1()
	{
		this._8u1=null;
		this._pu1=null;
		this._Vt1=null;
		this._av1=null;
		this._hm1=0;
		this._Cv1=null;
		this._qu1=0.0;
		this._Dv1=new _vv1();
		this._Ev1=false;
		this._Fv1=0;
		this._Gv1=0;
	}
	_ku1.prototype=
	{
		_9e1:
function()
		{
			return this._Cv1._9e1();
		}
		,_Hv1:
function()
		{
			return this._Cv1;
		}
		,_NX:
function(_Iv1)
		{
			if(_Iv1!=this._Ev1)
			{
				this._pu1._SX(true);
				this._Ev1=_Iv1;
			}
		}
		,_Jv1:
function()
		{
			return this._Ev1;
		}
		,_Kv1:
function(filter)
		{
			this._Dv1=filter;
			this._Lv1();
		}
		,_Mv1:
function()
		{
			return this._Dv1;
		}
		,_Lv1:
function()
		{
			if(this._pu1==null)
			{
				return;
			}
			var _vl1=this._pu1._nv1();
			while(_vl1) 
			{
				var _vu1=_vl1._vu1;
				var _wu1=_vu1._xu1();
				var _yu1=_vu1._zu1();
				if(_wu1==this||_yu1==this)
				{
					_vu1._Nv1();
				}
				_vl1=_vl1._gj;
			}
			var _Ht1=this._pu1._qv1();
			if(_Ht1==null)
			{
				return;
			}
			var _lu1=_Ht1._mu1._nu1;
			for(var i=0;i<this._hm1;++i)
			{
				_lu1._um1(this._av1[i]._om1);
			}
		}
		,_Ov1:
function()
		{
			return this._pu1;
		}
		,_ov1:
function()
		{
			return this._Vt1;
		}
		,_wm1:
function()
		{
			return this._8u1;
		}
		,_pv1:
function(data)
		{
			this._8u1=data;
		}
		,_Gk1:
function(_fx)
		{
			return this._Cv1._Gk1(this._pu1._oj1(),_fx);
		}
		,_Hk1:
function(output,input,_Ik1)
		{
			return this._Cv1._Hk1(output,input,this._pu1._oj1(),_Ik1);
		}
		,_Ru1:
function(_Mk1)
		{
			this._Cv1._Lk1(_Mk1,this._qu1);
		}
		,_FX:
function(_j_)
		{
			_Ih1(_mi1(_j_)&&_j_>=0.0);
			this._qu1=_j_;
		}
		,_EZ:
function()
		{
			return this._qu1;
		}
		,_DZ:
function()
		{
			return this._Fv1;
		}
		,_JX:
function(friction)
		{
			this._Fv1=friction;
		}
		,_FZ:
function()
		{
			return this._Gv1;
		}
		,_HX:
function(_zv1)
		{
			this._Gv1=_zv1;
		}
		,_Pv1:
function(_Ik1)
		{
			_Ih1(0<=_Ik1&&_Ik1<this._hm1);
			return this._av1[_Ik1]._Kk1;
		}
		,_981:
function(body,_hu1)
		{
			this._8u1=_hu1._nm1;
			this._Fv1=_hu1.friction;
			this._Gv1=_hu1._zv1;
			this._pu1=body;
			this._Vt1=null;
			this._Dv1._PG(_hu1.filter);
			this._Ev1=_hu1._Av1;
			this._Cv1=_hu1.shape._72();
			var _Qv1=this._Cv1._Fk1();
			this._av1=new Array(_Qv1);
			for(var i=0;i<_Qv1;++i)
			{
				this._av1[i]=new _Bv1();
				this._av1[i]._CX=null;
				this._av1[i]._om1=_dm1._Cm1;
			}
			this._hm1=0;
			this._qu1=_hu1._j_;
		}
		,_Ne1:
function()
		{
			_Ih1(this._hm1==0);
			this._av1=null;
			this._Cv1=null;
		}
		,_ou1:
function(_lu1,_hj1)
		{
			_Ih1(this._hm1==0);
			this._hm1=this._Cv1._Fk1();
			for(var i=0;i<this._hm1;++i)
			{
				var _Rv1=this._av1[i];
				this._Cv1._Jk1(_Rv1._Kk1,_hj1,i);
				_Rv1._om1=_lu1._mm1(_Rv1._Kk1,_Rv1);
				_Rv1._CX=this;
				_Rv1._Ik1=i;
			}
		}
		,_Au1:
function(_lu1)
		{
			for(var i=0;i<this._hm1;++i)
			{
				var _Rv1=this._av1[i];
				_lu1._qm1(_Rv1._om1);
				_Rv1._om1=_dm1._Cm1;
			}
			this._hm1=0;
		}
		,_Cu1:
function(_lu1,_Sv1,_Tv1)
		{
			if(this._hm1==0)
			{
				return;
			}
			for(var i=0;i<this._hm1;++i)
			{
				var _Rv1=this._av1[i];
				var _6p1=new _0p1(),_7p1=new _0p1();
				this._Cv1._Jk1(_6p1,_Sv1,_Rv1._Ik1);
				this._Cv1._Jk1(_7p1,_Tv1,_Rv1._Ik1);
				_Rv1._Kk1._5p1(_6p1,_7p1);
				var _tm1=_wi1._Di1(_Tv1._fx,_Sv1._fx);
				_lu1._sm1(_Rv1._om1,_Rv1._Kk1,_tm1);
			}
		}
		,_Nk1:
function(_fx,_en,_u5,_Ik1)
		{
			this._Cv1._Nk1(this._pu1._oj1(),_fx,_en,_u5,_Ik1);
		}
		,_Ji1:
function(out)
		{
			var __i=out||
			{
			}
			;
			__i['shape']=null;
			__i['friction']=this._Fv1;
			__i['restitution']=this._Gv1;
			__i['density']=this._qu1;
			__i['isSensor']=this._Ev1;
			__i['filter']=this._Dv1._Ji1();
			return __i;
		}
	}
	;

	function _Uv1()
	{
	}
	_Uv1.prototype=
	{
		_Vv1:
function(_jY)
		{
		}
		,_Wv1:
function(_CX)
		{
		}
		,_Xv1:
function(_v_)
		{
		}
		,_Yv1:
function(index)
		{
		}
	}
	;

	function _Zv1()
	{
	}
	_Zv1.prototype=
	{
		_sv1:
function(_wu1,_yu1)
		{
			var __v1=_wu1._Mv1();
			var _0w1=_yu1._Mv1();
			if(__v1._yv1==_0w1._yv1&&__v1._yv1!=0)
			{
				return __v1._yv1>0;
			}
			var _1w1=(__v1._xv1&_0w1._wv1)!=0&&(__v1._wv1&_0w1._xv1)!=0;
			return _1w1;
		}
	}
	;

	function _2w1()
	{
		this._3w1=new Array(_Nh1);
		this._4w1=new Array(_Nh1);
		this._u7=0;
	}

	function _5w1()
	{
	}
	_5w1.prototype=
	{
		_6w1:
function(_vu1)
		{
		}
		,_7w1:
function(_vu1)
		{
		}
		,_8w1:
function(_vu1,_9w1)
		{
		}
		,_aw1:
function(_vu1,_Ou1)
		{
		}
	}
	;

	function _bw1()
	{
	}
	_bw1.prototype=
	{
		_cw1:
function(_CX)
		{
			return false;
		}
		,_dw1:
function(index)
		{
			return false;
		}
	}
	;

	function _ew1()
	{
	}
	_ew1.prototype=
	{
		_cw1:
function(_CX,_oo1,_Pk1,_T_)
		{
		}
		,_dw1:
function(index,_oo1,_Pk1,_T_)
		{
			return 0;
		}
	}
	;

	function _fw1()
	{
		this._wt=0;
		this._gw1=0;
		this._hw1=0;
		this._iw1=0;
		this._jw1=0;
		this._kw1=false;
	}

	function _lw1()
	{
		this.c=new _wi1();
		this._i3=0;
	}

	function _mw1()
	{
		this._Z3=new _wi1();
		this.w=0;
	}

	function _nw1()
	{
		this.step=new _fw1();
		this._ow1=null;
		this._pw1=null;
	}
	var _qw1=_rh1._Bh1("step");
	var _rw1=_rh1._Bh1("collide","step");
	var _sw1=_rh1._Bh1("solve","step");
	var _tw1=_rh1._Bh1("solveTOI","step");
	var _uw1=_rh1._Bh1("broadphase","step");

	function _su1(gravity)
	{
		this._mu1=new _vw1();
		this._ww1=null;
		this._xw1=null;
		this._yw1=null;
		this._St1=null;
		this._zw1=0;
		this._Aw1=0;
		this._Bw1=true;
		this._Cw1=true;
		this._Dw1=false;
		this._Ew1=true;
		this._Fw1=true;
		this._Gw1=gravity;
		this._Jt1=_su1._Hw1;
		this._Iw1=0.0;
		this._Jw1=new _fw1();
		this._Kw1=new _Lw1();
		this._Mw1=new _Nw1();
		this._Mw1._Pt1=this;
	}

	function _Ow1()
	{
		this._lu1=null;
		this._Ae1=null;
	}
	_Ow1.prototype=
	{
		_Rm1:
function(_om1)
		{
			var _Rv1=this._lu1._wm1(_om1);
			return this._Ae1._cw1(_Rv1._CX);
		}
	}
	;

	function _Pw1()
	{
		this._lu1=null;
		this._Ae1=null;
	}
	_Pw1.prototype=
	{
		_Xr1:
function(input,_om1)
		{
			var _nm1=this._lu1._wm1(_om1);
			var _Rv1=_nm1;
			var _CX=_Rv1._CX;
			var index=_Rv1._Ik1;
			var output=new __o1();
			var _B5=_CX._Hk1(output,input,index);
			if(_B5)
			{
				var _T_=output._T_;
				var _oo1=_wi1._ce(_wi1.Multiply((1.0-_T_),input._sn),_wi1.Multiply(_T_,input._ik1));
				return this._Ae1._cw1(_CX,_oo1,output._Pk1,_T_);
			}
			return input._O_;
		}
	}
	;
	_su1._Qw1=new _ij1();
	_su1._Rw1=new _ij1();
	_su1._Sw1=new _ij1();
	_su1.prototype=
	{
		_Ne1:
function()
		{
			var _h3=this._yw1;
			while(_h3) 
			{
				var _Tw1=_h3._Vt1;
				var _At=_h3._9u1;
				while(_At) 
				{
					var _Uw1=_At._Vt1;
					_At._hm1=0;
					_At._Ne1();
					_At=_Uw1;
				}
				_h3=_Tw1;
			}
		}
		,_Vw1:
function(listener)
		{
			this._ww1=listener;
		}
		,_Ww1:
function(filter)
		{
			this._mu1._Xw1=filter;
		}
		,_Yw1:
function(listener)
		{
			this._mu1._Zw1=listener;
		}
		,__w1:
function(_0x1)
		{
			this._xw1=_0x1;
		}
		,_6Y:
function(_hu1)
		{
			_Ih1(this._Ke1()==false);
			if(this._Ke1())
			{
				return null;
			}
			var _h3=new _vt1(_hu1,this);
			_h3._Ut1=null;
			_h3._Vt1=this._yw1;
			if(this._yw1)
			{
				this._yw1._Ut1=_h3;
			}
			this._yw1=_h3;
			++this._zw1;
			return _h3;
		}
		,_1x1:
function(_h3)
		{
			_Ih1(this._zw1>0);
			_Ih1(this._Ke1()==false);
			if(this._Ke1())
			{
				return;
			}
			var _2x1=_h3._St1;
			while(_2x1) 
			{
				var _3x1=_2x1;
				_2x1=_2x1._gj;
				if(this._ww1)
				{
					this._ww1._Vv1(_3x1._jY);
				}
				this._8Z(_3x1._jY);
				_h3._St1=_2x1;
			}
			_h3._St1=null;
			var _7v1=_h3._Tt1;
			while(_7v1) 
			{
				var _8v1=_7v1;
				_7v1=_7v1._gj;
				this._mu1._Ne1(_8v1._vu1);
			}
			_h3._Tt1=null;
			var _At=_h3._9u1;
			while(_At) 
			{
				var _4x1=_At;
				_At=_At._Vt1;
				if(this._ww1)
				{
					this._ww1._Wv1(_4x1);
				}
				_4x1._Au1(this._mu1._nu1);
				_4x1._Ne1();
				_h3._9u1=_At;
				_h3._au1-=1;
			}
			_h3._9u1=null;
			_h3._au1=0;
			if(_h3._Ut1)
			{
				_h3._Ut1._Vt1=_h3._Vt1;
			}
			if(_h3._Vt1)
			{
				_h3._Vt1._Ut1=_h3._Ut1;
			}
			if(_h3==this._yw1)
			{
				this._yw1=_h3._Vt1;
			}
			_h3._5x1=true;
			--this._zw1;
		}
		,_6x1:
function(_hu1)
		{
			_Ih1(this._Ke1()==false);
			if(this._Ke1())
			{
				return null;
			}
			var _05=_7x1._981(_hu1);
			_05._Ut1=null;
			_05._Vt1=this._St1;
			if(this._St1)
			{
				this._St1._Ut1=_05;
			}
			this._St1=_05;
			++this._Aw1;
			_05._8x1._jY=_05;
			_05._8x1.other=_05._9x1;
			_05._8x1._ej=null;
			_05._8x1._gj=_05._ax1._St1;
			if(_05._ax1._St1)_05._ax1._St1._ej=_05._8x1;
			_05._ax1._St1=_05._8x1;
			_05._bx1._jY=_05;
			_05._bx1.other=_05._ax1;
			_05._bx1._ej=null;
			_05._bx1._gj=_05._9x1._St1;
			if(_05._9x1._St1)_05._9x1._St1._ej=_05._bx1;
			_05._9x1._St1=_05._bx1;
			var _cx1=_hu1._cx1;
			var _dx1=_hu1._dx1;
			if(_hu1._ex1==false)
			{
				var _vl1=_dx1._nv1();
				while(_vl1) 
				{
					if(_vl1.other==_cx1)
					{
						_vl1._vu1._Nv1();
					}
					_vl1=_vl1._gj;
				}
			}
			return _05;
		}
		,_8Z:
function(_05)
		{
			_Ih1(this._Ke1()==false);
			if(this._Ke1())
			{
				return;
			}
			var _ex1=_05._uv1;
			if(_05._Ut1)
			{
				_05._Ut1._Vt1=_05._Vt1;
			}
			if(_05._Vt1)
			{
				_05._Vt1._Ut1=_05._Ut1;
			}
			if(_05==this._St1)
			{
				this._St1=_05._Vt1;
			}
			var _cx1=_05._ax1;
			var _dx1=_05._9x1;
			_cx1._SX(true);
			_dx1._SX(true);
			if(_05._8x1._ej)
			{
				_05._8x1._ej._gj=_05._8x1._gj;
			}
			if(_05._8x1._gj)
			{
				_05._8x1._gj._ej=_05._8x1._ej;
			}
			if(_05._8x1==_cx1._St1)
			{
				_cx1._St1=_05._8x1._gj;
			}
			_05._8x1._ej=null;
			_05._8x1._gj=null;
			if(_05._bx1._ej)
			{
				_05._bx1._ej._gj=_05._bx1._gj;
			}
			if(_05._bx1._gj)
			{
				_05._bx1._gj._ej=_05._bx1._ej;
			}
			if(_05._bx1==_dx1._St1)
			{
				_dx1._St1=_05._bx1._gj;
			}
			_05._bx1._ej=null;
			_05._bx1._gj=null;
			_7x1._Ne1(_05);
			_Ih1(this._Aw1>0);
			--this._Aw1;
			if(_ex1==false)
			{
				var _vl1=_dx1._nv1();
				while(_vl1) 
				{
					if(_vl1.other==_cx1)
					{
						_vl1._vu1._Nv1();
					}
					_vl1=_vl1._gj;
				}
			}
		}
		,_fx1:
function(_wt,_iw1,_jw1)
		{
			_qw1.start();
			if(this._Jt1&_su1._tu1)
			{
				this._mu1._gx1();
				this._Jt1&=~_su1._tu1;
			}
			this._Jt1|=_su1._hx1;
			this._Jw1._wt=_wt;
			this._Jw1._iw1=_iw1;
			this._Jw1._jw1=_jw1;
			if(_wt>0.0)
			{
				this._Jw1._gw1=1.0/_wt;
			}
			else 
			{
				this._Jw1._gw1=0.0;
			}
			this._Jw1._hw1=this._Iw1*_wt;
			this._Jw1._kw1=this._Bw1;

						{
				_rw1.start();
				this._mu1._3r1();
				_rw1.stop();
			}
			if(this._Ew1&&this._Jw1._wt>0.0)
			{
				_sw1.start();
				this._Mw1._Vi1(this._Jw1);
				this._Vi1(this._Jw1);
				_sw1.stop();
			}
			if(this._Cw1&&this._Jw1._wt>0.0)
			{
				_tw1.start();
				this._ix1(this._Jw1);
				_tw1.stop();
			}
			if(this._Jw1._wt>0.0)
			{
				this._Iw1=this._Jw1._gw1;
			}
			if(this._Jt1&_su1._Hw1)
			{
				this._jx1();
			}
			this._Jt1&=~_su1._hx1;
			_qw1.stop();
		}
		,_jx1:
function()
		{
			for(var body=this._yw1;body;body=body._ov1())
			{
				body._0u1.x=body._0u1.y=0;
				body._1u1=0.0;
			}
		}
		,_kx1:
function()
		{
			if(this._xw1==null)
			{
				return;
			}
			var _Bg1=this._xw1._8k1();
			if(_Bg1&_5k1._mk1)
			{
				for(var _h3=this._yw1;_h3;_h3=_h3._ov1())
				{
					var _hj1=_h3._oj1();
					for(var _At=_h3._lv1();_At;_At=_At._ov1())
					{
						if(_h3._iv1()==false)
						{
							this._lx1(_At,_hj1,new _4k1(0.5,0.5,0.3));
						}
						else if(_h3._9e1()==_vt1._wt1)
						{
							this._lx1(_At,_hj1,new _4k1(0.5,0.9,0.5));
						}
						else if(_h3._9e1()==_vt1._bu1)
						{
							this._lx1(_At,_hj1,new _4k1(0.5,0.5,0.9));
						}
						else if(_h3._gv1()==false)
						{
							this._lx1(_At,_hj1,new _4k1(0.6,0.6,0.6));
						}
						else 
						{
							this._lx1(_At,_hj1,new _4k1(0.9,0.7,0.7));
						}
					}
				}
				this._mx1(this._Mw1);
			}
			if(_Bg1&_5k1._nk1)
			{
				for(var _05=this._St1;_05;_05=_05._ov1())
				{
					this._nx1(_05);
				}
			}
			if(_Bg1&_5k1._wk1)
			{
				var color=new _4k1(0.3,0.9,0.9);
				for(var c=this._mu1._Tt1;c;c=c._ov1())
				{
					var _wu1=c._xu1();
					var _yu1=c._zu1();
					var _ox1=_wu1._Pv1(c._px1())._2p1();
					var _qx1=_yu1._Pv1(c._rx1())._2p1();
					this._xw1._hk1(_ox1,_qx1,color);
				}
			}
			if(_Bg1&_5k1._ok1)
			{
				var color=new _4k1(0.9,0.3,0.9);
				var _sx1=new _4k1(0.3,0.3,0.9);
				var _tx1=this._mu1._nu1;
				for(var _h3=this._yw1;_h3;_h3=_h3._ov1())
				{
					if(_h3._iv1()==false)
					{
						continue;
					}
					for(var _At=_h3._lv1();_At;_At=_At._ov1())
					{
						for(var i=0;i<_At._hm1;++i)
						{
							var _Rv1=_At._av1[i];
							var _Kk1=_tx1._vm1(_Rv1._om1);
							var _3m1=[];
							_3m1[0]=new _wi1(_Kk1._Yk1.x,_Kk1._Yk1.y);
							_3m1[1]=new _wi1(_Kk1._Zk1.x,_Kk1._Yk1.y);
							_3m1[2]=new _wi1(_Kk1._Zk1.x,_Kk1._Zk1.y);
							_3m1[3]=new _wi1(_Kk1._Yk1.x,_Kk1._Zk1.y);
							this._xw1._ck1(_3m1,4,color);
							var _ux1=new _0p1();
							_At._Hv1()._Jk1(_ux1,_h3._oj1(),0);
							_3m1[0]=new _wi1(_ux1._Yk1.x,_ux1._Yk1.y);
							_3m1[1]=new _wi1(_ux1._Zk1.x,_ux1._Yk1.y);
							_3m1[2]=new _wi1(_ux1._Zk1.x,_ux1._Zk1.y);
							_3m1[3]=new _wi1(_ux1._Yk1.x,_ux1._Zk1.y);
							this._xw1._ck1(_3m1,4,_sx1);
						}
					}
				}
			}
			if(_Bg1&_5k1._pk1)
			{
				for(var _h3=this._yw1;_h3;_h3=_h3._ov1())
				{
					var _hj1=_h3._oj1()._72();
					_hj1._fx=_h3._Du1();
					this._xw1._jk1(_hj1);
				}
			}
		}
		,_vx1:
function(_Ae1,_Kk1)
		{
			var _wx1=new _Ow1();
			_wx1._lu1=this._mu1._nu1;
			_wx1._Ae1=_Ae1;
			this._mu1._nu1._Em1(_wx1,_Kk1);
			this._Mw1._vx1(_Ae1,_Kk1);
		}
		,_Hk1:
function(_Ae1,_xx1,_yx1)
		{
			var _wx1=new _Pw1();
			_wx1._lu1=this._mu1._nu1;
			_wx1._Ae1=_Ae1;
			var input=new _Zo1();
			input._O_=1.0;
			input._sn=_xx1;
			input._ik1=_yx1;
			this._mu1._nu1._Hk1(_wx1,input);
			this._Mw1._Hk1(_Ae1,_xx1,_yx1);
		}
		,/*@returns {b2Body} the head of the world body list. */_zx1:
function()
		{
			return this._yw1;
		}
		,_mv1:
function()
		{
			return this._St1;
		}
		,_nv1:
function()
		{
			return this._mu1._Tt1;
		}
		,_Ax1:
function(_cv1)
		{
			if(_cv1==this._Fw1)
			{
				return;
			}
			this._Fw1=_cv1;
			if(this._Fw1==false)
			{
				for(var _h3=this._yw1;_h3;_h3=_h3._Vt1)
				{
					_h3._SX(true);
				}
			}
		}
		,_Bx1:
function()
		{
			return this._Fw1;
		}
		,_Cx1:
function(_cv1)
		{
			this._Bw1=_cv1;
		}
		,_Dx1:
function()
		{
			return this._Bw1;
		}
		,_Ex1:
function(_cv1)
		{
			this._Cw1=_cv1;
		}
		,_Fx1:
function()
		{
			return this._Cw1;
		}
		,_Gx1:
function(_cv1)
		{
			this._Dw1=_cv1;
		}
		,_Hx1:
function()
		{
			return this._Dw1;
		}
		,_Am1:
function()
		{
			return this._mu1._nu1._Am1();
		}
		,_Ix1:
function()
		{
			return this._zw1;
		}
		,_Jx1:
function()
		{
			return this._Aw1;
		}
		,_Kx1:
function()
		{
			return this._mu1._Lx1;
		}
		,_Km1:
function()
		{
			return this._mu1._nu1._Km1();
		}
		,_Lm1:
function()
		{
			return this._mu1._nu1._Lm1();
		}
		,_Nm1:
function()
		{
			return this._mu1._nu1._Nm1();
		}
		,_vX:
function(gravity)
		{
			this._Gw1=gravity;
		}
		,_Mx1:
function()
		{
			return this._Gw1;
		}
		,_Ke1:
function()
		{
			return(this._Jt1&_su1._hx1)==_su1._hx1;
		}
		,_Nx1:
function(_cv1)
		{
			if(_cv1)
			{
				this._Jt1|=_su1._Hw1;
			}
			else 
			{
				this._Jt1&=~_su1._Hw1;
			}
		}
		,_Ox1:
function()
		{
			return(this._Jt1&_su1._Hw1)==_su1._Hw1;
		}
		,_Pm1:
function(_Qm1)
		{
			_Ih1((this._Jt1&_su1._hx1)==0);
			if((this._Jt1&_su1._hx1)==_su1._hx1)
			{
				return;
			}
			for(var _h3=this._yw1;_h3;_h3=_h3._Vt1)
			{
				_h3._Mq1._fx._Di1(_Qm1);
				_h3._Rt1._kj1._Di1(_Qm1);
				_h3._Rt1.c._Di1(_Qm1);
			}
			for(var _05=this._St1;
_05;_05=_05._Vt1)
			{
				_05._Pm1(_Qm1);
			}
			this._mu1._nu1._Pm1(_Qm1);
		}
		,_Px1:
function()
		{
			return this._mu1;
		}
		,_Vi1:
function(step)
		{
			for(var _h3=this._yw1;_h3;_h3=_h3._Vt1)
			{
				_h3._Qt1._PG(_h3._Mq1);
			}
			this._Kw1._Co1(this._zw1,this._mu1._Lx1,this._Aw1,this._mu1._Zw1);
			for(var _h3=this._yw1;_h3;_h3=_h3._Vt1)
			{
				_h3._Jt1&=~_vt1._cu1;
			}
			for(var c=this._mu1._Tt1;c;c=c._Vt1)
			{
				c._Jt1&=~_Qx1._cu1;
			}
			for(var _05=this._St1;_05;_05=_05._Vt1)
			{
				_05._Rx1=false;
			}
			var _Sx1=this._zw1;
			var stack=new Array(_Sx1);
			for(var _Tx1=this._yw1;_Tx1;_Tx1=_Tx1._Vt1)
			{
				if(_Tx1._Jt1&_vt1._cu1)
				{
					continue;
				}
				if(_Tx1._gv1()==false||_Tx1._iv1()==false)
				{
					continue;
				}
				if(_Tx1._9e1()==_vt1._wt1)
				{
					continue;
				}
				this._Kw1._se();
				var _Ux1=0;
				stack[_Ux1++]=_Tx1;
				_Tx1._Jt1|=_vt1._cu1;
				while(_Ux1>0) 
				{
					var _h3=stack[--_Ux1];
					_Ih1(_h3._iv1()==true);
					this._Kw1._Vx1(_h3);
					_h3._SX(true);
					if(_h3._9e1()==_vt1._wt1)
					{
						continue;
					}
					for(var _7v1=_h3._Tt1;_7v1;_7v1=_7v1._gj)
					{
						var _vu1=_7v1._vu1;
						if(_vu1._Jt1&_Qx1._cu1)
						{
							continue;
						}
						if(_vu1._Wx1()==false||_vu1._Xx1()==false)
						{
							continue;
						}
						var _Yx1=_vu1._Zx1._Ev1;
						var __x1=_vu1._0y1._Ev1;
						if(_Yx1||__x1)
						{
							continue;
						}
						this._Kw1._1y1(_vu1);
						_vu1._Jt1|=_Qx1._cu1;
						var other=_7v1.other;
						if(other._Jt1&_vt1._cu1)
						{
							continue;
						}
						_Ih1(_Ux1<_Sx1);
						stack[_Ux1++]=other;
						other._Jt1|=_vt1._cu1;
					}
					for(var _2x1=_h3._St1;_2x1;_2x1=_2x1._gj)
					{
						if(_2x1._jY._Rx1==true)
						{
							continue;
						}
						var other=_2x1.other;
						if(other._iv1()==false)
						{
							continue;
						}
						this._Kw1._2y1(_2x1._jY);
						_2x1._jY._Rx1=true;
						if(other._Jt1&_vt1._cu1)
						{
							continue;
						}
						_Ih1(_Ux1<_Sx1);
						stack[_Ux1++]=other;
						other._Jt1|=_vt1._cu1;
					}
				}
				this._Kw1._Vi1(step,this._Gw1,this._Fw1);
				for(var i=0;
i<this._Kw1._zw1;++i)
				{
					var _h3=this._Kw1._3y1[i];
					if(_h3._9e1()==_vt1._wt1)
					{
						_h3._Jt1&=~_vt1._cu1;
					}
				}
			}

						{
				_uw1.start();
				for(var _h3=this._yw1;_h3;_h3=_h3._ov1())
				{
					if((_h3._Jt1&_vt1._cu1)==0)
					{
						continue;
					}
					if(_h3._9e1()==_vt1._wt1)
					{
						continue;
					}
					_h3._6v1();
				}
				this._mu1._gx1();
				_uw1.stop();
			}
		}
		,_ix1:
function(step)
		{
			this._Kw1._Co1(2*_Vh1,_Vh1,0,this._mu1._Zw1);
			if(this._Ew1)
			{
				for(var _h3=this._yw1;_h3;_h3=_h3._Vt1)
				{
					_h3._Jt1&=~_vt1._cu1;
					_h3._Rt1._nj1=0.0;
				}
				for(var c=this._mu1._Tt1;c;c=c._Vt1)
				{
					c._Jt1&=~(_Qx1._du1|_Qx1._cu1);
					c._4y1=0;
					c._5y1=1.0;
				}
			}
			for(;;)
			{
				var _6y1=null;
				var _7y1=1.0;
				for(var c=this._mu1._Tt1;c;c=c._Vt1)
				{
					if(c._Wx1()==false)
					{
						continue;
					}
					if(c._4y1>_Uh1)
					{
						continue;
					}
					var alpha=1.0;
					if(c._Jt1&_Qx1._du1)
					{
						alpha=c._5y1;
					}
					else 
					{
						var _8y1=c._xu1();
						var _9y1=c._zu1();
						if(_8y1._Jv1()||_9y1._Jv1())
						{
							continue;
						}
						var _ay1=_8y1._Ov1();
						var _by1=_9y1._Ov1();
						var _go1=_ay1._yF;
						var _ho1=_by1._yF;
						_Ih1(_go1==_vt1._3u1||_ho1==_vt1._3u1);
						var _cy1=_ay1._gv1()&&_go1!=_vt1._wt1;
						var _dy1=_by1._gv1()&&_ho1!=_vt1._wt1;
						if(_cy1==false&&_dy1==false)
						{
							continue;
						}
						var _ey1=_ay1._dv1()||_go1!=_vt1._3u1;
						var _fy1=_by1._dv1()||_ho1!=_vt1._3u1;
						if(_ey1==false&&_fy1==false)
						{
							continue;
						}
						var _nj1=_ay1._Rt1._nj1;
						if(_ay1._Rt1._nj1<_by1._Rt1._nj1)
						{
							_nj1=_by1._Rt1._nj1;
							_ay1._Rt1._qj1(_nj1);
						}
						else if(_by1._Rt1._nj1<_ay1._Rt1._nj1)
						{
							_nj1=_ay1._Rt1._nj1;
							_by1._Rt1._qj1(_nj1);
						}
						_Ih1(_nj1<1.0);
						var _Zm1=c._px1();
						var __m1=c._rx1();
						var input=new _Is1();
						input._1n1.Set(_8y1._Hv1(),_Zm1);
						input._2n1.Set(_9y1._Hv1(),__m1);
						input._Js1._PG(_ay1._Rt1);
						input._Ks1._PG(_by1._Rt1);
						input._Ls1=1.0;
						var output=new _Ms1();
						_ct1(output,input);
						var _pj1=output._K5;
						if(output.state==_Ms1._Ps1)
						{
							alpha=_Uj1(_nj1+(1.0-_nj1)*_pj1,1.0);
						}
						else 
						{
							alpha=1.0;
						}
						c._5y1=alpha;
						c._Jt1|=_Qx1._du1;
					}
					if(alpha<_7y1)
					{
						_6y1=c;
						_7y1=alpha;
					}
				}
				if(_6y1==null||1.0-10.0*_Lh1<_7y1)
				{
					this._Ew1=true;
					break;
				}
				var _8y1=_6y1._xu1();
				var _9y1=_6y1._zu1();
				var _ay1=_8y1._Ov1();
				var _by1=_9y1._Ov1();
				_su1._Qw1._PG(_ay1._Rt1);
				_su1._Rw1._PG(_by1._Rt1);
				_ay1._qj1(_7y1);
				_by1._qj1(_7y1);
				_6y1._te(this._mu1._Zw1);
				_6y1._Jt1&=~_Qx1._du1;
				++_6y1._4y1;
				if(_6y1._Wx1()==false||_6y1._Xx1()==false)
				{
					_6y1._gy1(false);
					_ay1._Rt1._PG(_su1._Qw1);
					_by1._Rt1._PG(_su1._Rw1);
					_ay1._rv1();
					_by1._rv1();
					continue;
				}
				_ay1._SX(true);
				_by1._SX(true);
				this._Kw1._se();
				this._Kw1._Vx1(_ay1);
				this._Kw1._Vx1(_by1);
				this._Kw1._1y1(_6y1);
				_ay1._Jt1|=_vt1._cu1;
				_by1._Jt1|=_vt1._cu1;
				_6y1._Jt1|=_Qx1._cu1;
				var _hy1=[_ay1,_by1];
				for(var i=0;i<2;++i)
				{
					var body=_hy1[i];
					if(body._yF==_vt1._3u1)
					{
						for(var _7v1=body._Tt1;_7v1;_7v1=_7v1._gj)
						{
							if(this._Kw1._zw1==this._Kw1._iy1)
							{
								break;
							}
							if(this._Kw1._Lx1==this._Kw1._jy1)
							{
								break;
							}
							var _vu1=_7v1._vu1;
							if(_vu1._Jt1&_Qx1._cu1)
							{
								continue;
							}
							var other=_7v1.other;
							if(other._yF==_vt1._3u1&&body._dv1()==false&&other._dv1()==false)
							{
								continue;
							}
							var _Yx1=_vu1._Zx1._Ev1;
							var __x1=_vu1._0y1._Ev1;
							if(_Yx1||__x1)
							{
								continue;
							}
							_su1._Sw1._PG(other._Rt1);
							if((other._Jt1&_vt1._cu1)==0)
							{
								other._qj1(_7y1);
							}
							_vu1._te(this._mu1._Zw1);
							if(_vu1._Wx1()==false)
							{
								other._Rt1._PG(_su1._Sw1);
								other._rv1();
								continue;
							}
							if(_vu1._Xx1()==false)
							{
								other._Rt1._PG(_su1._Sw1);
								other._rv1();
								continue;
							}
							_vu1._Jt1|=_Qx1._cu1;
							this._Kw1._1y1(_vu1);
							if(other._Jt1&_vt1._cu1)
							{
								continue;
							}
							other._Jt1|=_vt1._cu1;
							if(other._yF!=_vt1._wt1)
							{
								other._SX(true);
							}
							this._Kw1._Vx1(other);
						}
					}
				}
				var _ky1=new _fw1();
				_ky1._wt=(1.0-_7y1)*step._wt;
				_ky1._gw1=1.0/_ky1._wt;
				_ky1._hw1=1.0;
				_ky1._jw1=20;
				_ky1._iw1=step._iw1;
				_ky1._kw1=false;
				this._Kw1._ix1(_ky1,_ay1._It1,_by1._It1);
				for(var i=0;i<this._Kw1._zw1;++i)
				{
					var body=this._Kw1._3y1[i];
					body._Jt1&=~_vt1._cu1;
					if(body._yF!=_vt1._3u1)
					{
						continue;
					}
					body._6v1();
					for(var _7v1=body._Tt1;_7v1;_7v1=_7v1._gj)
					{
						_7v1._vu1._Jt1&=~(_Qx1._du1|_Qx1._cu1);
					}
				}
				this._mu1._gx1();
				if(this._Dw1)
				{
					this._Ew1=false;
					break;
				}
			}
		}
		,_nx1:
function(_jY)
		{
			var _cx1=_jY._ly1();
			var _dx1=_jY._my1();
			var _yp1=_cx1._oj1();
			var _Ap1=_dx1._oj1();
			var _x5=_yp1._fx;
			var _z5=_Ap1._fx;
			var _sn=_jY._ny1();
			var _ik1=_jY._oy1();
			var color=new _4k1(0.5,0.8,0.8);
			switch(_jY._9e1())
			{
				case _7x1._py1:this._xw1._hk1(_sn,_ik1,color);
				break;
				case _7x1._qy1:
				{
					var _ry1=_jY;
					var _Zq=_ry1._sy1();
					var __q=_ry1._ty1();
					this._xw1._hk1(_Zq,_sn,color);
					this._xw1._hk1(__q,_ik1,color);
					this._xw1._hk1(_Zq,__q,color);
				}
				break;
				case _7x1._uy1:break;
				case _7x1._vy1:this._xw1._wy1(_jY._xy1(),5.0,color);
				default :this._xw1._hk1(_x5,_sn,color);
				this._xw1._hk1(_sn,_ik1,color);
				this._xw1._hk1(_z5,_ik1,color);
			}
		}
		,_lx1:
function(_CX,_hj1,color)
		{
			switch(_CX._9e1())
			{
				case _Dk1._Qk1:
				{
					var _Tm1=_CX._Hv1();
					var _fk1=_Jj1(_hj1,_Tm1._Wk1);
					var _MZ=_Tm1._Ek1;
					var _tn=_Hj1(_hj1.q,new _wi1(1.0,0.0));
					this._xw1._gk1(_fk1,_MZ,_tn,color);
				}
				break;
				case _Dk1._Rk1:
				{
					var _vl1=_CX._Hv1();
					var _la=_Jj1(_hj1,_vl1._4l1);
					var _04=_Jj1(_hj1,_vl1._5l1);
					this._xw1._hk1(_la,_04,color);
				}
				break;
				case _Dk1._Tk1:
				{
					var _Um1=_CX._Hv1();
					var _u7=_Um1._il1;
					var vertices=_Um1._hl1;
					var _la=_Jj1(_hj1,vertices[0]);
					for(var i=1;i<_u7;++i)
					{
						var _04=_Jj1(_hj1,vertices[i]);
						this._xw1._hk1(_la,_04,color);
						_la=_04;
					}
				}
				break;
				case _Dk1._Sk1:
				{
					var __4=_CX._Hv1();
					var vertexCount=__4._il1;
					_Ih1(vertexCount<=_Oh1);
					var vertices=new Array(_Oh1);
					for(var i=0;i<vertexCount;++i)
					{
						vertices[i]=_Jj1(_hj1,__4._hl1[i]);
					}
					this._xw1._dk1(vertices,vertexCount,color);
				}
				break;
				default :break;
			}
		}
		,_c_:
function()
		{
			return this._Mw1._c_();
		}
		,_h_:
function(_u7)
		{
			this._Mw1._h_(_u7);
		}
		,_k_:
function(_j_)
		{
			this._Mw1._k_(_j_);
		}
		,_e_:
function()
		{
			return this._Mw1._e_();
		}
		,_n_:
function(_Ft1)
		{
			this._Mw1._n_(_Ft1);
		}
		,_g_:
function()
		{
			return this._Mw1._g_();
		}
		,_m_:
function(_l_)
		{
			this._Mw1._m_(_l_);
		}
		,_f_:
function()
		{
			return this._Mw1._f_();
		}
		,_i_:
function(_MZ)
		{
			this._Mw1._i_(_MZ);
		}
		,_d_:
function()
		{
			return this._Mw1._d_();
		}
		,_KZ:
function(_hu1)
		{
			_Ih1(this._Ke1()==false);
			if(this._Ke1())
			{
				return 0;
			}
			var _fx=this._Mw1._KZ(_hu1);
			return _fx;
		}
		,_yy1:
function(index,_zy1)
		{
			this._Mw1._yy1(index,_zy1);
		}
		,_Ay1:
function(shape,_hj1,_zy1)
		{
			_Ih1(this._Ke1()==false);
			if(this._Ke1())
			{
				return 0;
			}
			return this._Mw1._Ay1(shape,_hj1,_zy1);
		}
		,_By1:
function(_hu1)
		{
			_Ih1(this._Ke1()==false);
			if(this._Ke1())
			{
				return null;
			}
			var _g3=this._Mw1._By1(_hu1);
			return _g3;
		}
		,_Cy1:
function(_Dy1,_Ey1)
		{
			_Ih1(this._Ke1()==false);
			if(this._Ke1())
			{
				return;
			}
			this._Mw1._Cy1(_Dy1,_Ey1);
		}
		,_Fy1:
function(_v_,_zy1)
		{
			_Ih1(this._Ke1()==false);
			if(this._Ke1())
			{
				return;
			}
			this._Mw1._Fy1(_v_,_zy1);
		}
		,_Gy1:
function()
		{
			return this._Mw1._Gy1();
		}
		,_Hy1:
function()
		{
			return this._Mw1._Hy1();
		}
		,_Iy1:
function()
		{
			return this._Mw1._Iy1();
		}
		,_Jy1:
function()
		{
			return this._Mw1._Jy1();
		}
		,_Ky1:
function()
		{
			return this._Mw1._Ky1();
		}
		,_Ly1:
function()
		{
			return this._Mw1._Ly1();
		}
		,_My1:
function(buffer,_Ny1)
		{
			this._Mw1._My1(buffer,_Ny1);
		}
		,_Oy1:
function(buffer,_Ny1)
		{
			this._Mw1._Oy1(buffer,_Ny1);
		}
		,_Py1:
function(buffer,_Ny1)
		{
			this._Mw1._Py1(buffer,_Ny1);
		}
		,_Qy1:
function(buffer,_Ny1)
		{
			this._Mw1._Qy1(buffer,_Ny1);
		}
		,_Ry1:
function(buffer,_Ny1)
		{
			this._Mw1._Ry1(buffer,_Ny1);
		}
		,_Sy1:
function()
		{
			return this._Mw1._Ty1;
		}
		,_Uy1:
function()
		{
			return this._Mw1._Lx1;
		}
		,_Vy1:
function()
		{
			return this._Mw1._Wy1;
		}
		,_Xy1:
function()
		{
			return this._Mw1._Yy1;
		}
		,_Zy1:
function()
		{
			return this._Mw1._Zy1();
		}
		,__y1:
function()
		{
			return this._Mw1.__y1();
		}
		,_w_:
function()
		{
			return this._Mw1._w_();
		}
		,_9_:
function()
		{
			return this._Mw1._9_();
		}
		,_mx1:
function(_0z1)
		{
			var _1z1=_0z1._9_();
			if(_1z1)
			{
				var _2z1=_0z1._d_();
				var _3z1=_0z1._Hy1();
				if(_0z1._4z1.data)
				{
					var _5z1=_0z1._Jy1();
					this._xw1._7_(_3z1,_2z1,_5z1,_1z1);
				}
				else 
				{
					this._xw1._7_(_3z1,_2z1,null,_1z1);
				}
			}
		}
	}
	;
	_su1._tu1=0x0001;
	_su1._hx1=0x0002;
	_su1._Hw1=0x0004;

	function _6z1(_Ny1)
	{
		this._7z1=new Array(_Ny1);
		this.__q1=0;
		this._8z1=0;
		this._9z1=_Ny1;
	}
	_6z1.prototype=
	{
		_TQ:
function(_fj)
		{
			if(this._8z1>=this._9z1)return;
			this._7z1[this._8z1++]=_fj;
		}
		,_VQ:
function()
		{
			_Ih1(this.__q1<this._8z1);
			this.__q1++;
		}
		,_az1:
function()
		{
			return this.__q1>=this._8z1;
		}
		,_bz1:
function()
		{
			return this._7z1[this.__q1];
		}
	}
	;

	function _cz1(_dz1)
	{
		this._ez1=new Array(_dz1);
		this._fz1=0;
		this._gz1=0;
		this._hz1=0;
		this._iz1=null;
	}
	_cz1._jz1=
function()
	{
		this._fk1=new _wi1();
		this._3g=0;
	}
	;
	_cz1._kz1=
function(x,y,i,_g3)
	{
		this._KF=x;
		this._MF=y;
		this._lz1=i;
		this._mz1=_g3;
	}
	;
	_cz1.prototype=
	{
		_nz1:
function(_fk1,_3g)
		{
			var _g3=(this._ez1[this._fz1++]=new _cz1._jz1());
			_g3._fk1._PG(_fk1);
			_g3._3g=_3g;
		}
		,_oz1:
function(_MZ)
		{
			_Ih1(this._iz1==null);
			var _pz1=1/_MZ;
			var _1P=new _wi1(+_Kh1,+_Kh1);
			var _Ll1=new _wi1(-_Kh1,-_Kh1);
			for(var _ij=0;_ij<this._fz1;_ij++)
			{
				var _g3=this._ez1[_ij];
				_1P._PG(_Vj1(_1P,_g3._fk1));
				_Ll1._PG(_Xj1(_Ll1,_g3._fk1));
			}
			this._gz1=1+((_pz1*(_Ll1.x-_1P.x))>>>0);
			this._hz1=1+((_pz1*(_Ll1.y-_1P.y))>>>0);
			this._iz1=new Array(this._gz1*this._hz1);
			for(var i=0;i<this._gz1*this._hz1;i++)this._iz1[i]=null;
			var _Mj=new _6z1(this._gz1*this._gz1);
			for(var _ij=0;_ij<this._fz1;_ij++)
			{
				var _g3=this._ez1[_ij];
				_g3._fk1._PG(_wi1.Multiply(_pz1,_wi1._Di1(_g3._fk1,_1P)));
				var x=_Wj1(0,_Uj1(Math.floor(_g3._fk1.x),this._gz1-1));
				var y=_Wj1(0,_Uj1(Math.floor(_g3._fk1.y),this._hz1-1));
				_Mj._TQ(new _cz1._kz1(x,y,x+y*this._gz1,_g3));
			}
			while(!_Mj._az1()) 
			{
				var x=_Mj._bz1()._KF;
				var y=_Mj._bz1()._MF;
				var i=_Mj._bz1()._lz1;
				var _g3=_Mj._bz1()._mz1;
				_Mj._VQ();
				if(!this._iz1[i])
				{
					this._iz1[i]=_g3;
					if(x>0)
					{
						_Mj._TQ(new _cz1._kz1(x-1,y,i-1,_g3));
					}
					if(y>0)
					{
						_Mj._TQ(new _cz1._kz1(x,y-1,i-this._gz1,_g3));
					}
					if(x<this._gz1-1)
					{
						_Mj._TQ(new _cz1._kz1(x+1,y,i+1,_g3));
					}
					if(y<this._hz1-1)
					{
						_Mj._TQ(new _cz1._kz1(x,y+1,i+this._gz1,_g3));
					}
				}
			}
			var _qz1=this._gz1+this._hz1;
			for(var _rz1=0;_rz1<_qz1;_rz1++)
			{
				for(var y=0;y<this._hz1;y++)
				{
					for(var x=0;x<this._gz1-1;x++)
					{
						var i=x+y*this._gz1;
						var _i3=this._iz1[i];
						var _h3=this._iz1[i+1];
						if(_i3!=_h3)
						{
							_Mj._TQ(new _cz1._kz1(x,y,i,_h3));
							_Mj._TQ(new _cz1._kz1(x+1,y,i+1,_i3));
						}
					}
				}
				for(var y=0;y<this._hz1-1;y++)
				{
					for(var x=0;x<this._gz1;x++)
					{
						var i=x+y*this._gz1;
						var _i3=this._iz1[i];
						var _h3=this._iz1[i+this._gz1];
						if(_i3!=_h3)
						{
							_Mj._TQ(new _cz1._kz1(x,y,i,_h3));
							_Mj._TQ(new _cz1._kz1(x,y+1,i+this._gz1,_i3));
						}
					}
				}
				var _sz1=false;
				while(!_Mj._az1()) 
				{
					var x=_Mj._bz1()._KF;
					var y=_Mj._bz1()._MF;
					var i=_Mj._bz1()._lz1;
					var _ij=_Mj._bz1()._mz1;
					_Mj._VQ();
					var _i3=this._iz1[i];
					var _h3=_ij;
					if(_i3!=_h3)
					{
						var ax=_i3._fk1.x-x;
						var ay=_i3._fk1.y-y;
						var _tz1=_h3._fk1.x-x;
						var _uz1=_h3._fk1.y-y;
						var _Mc1=ax*ax+ay*ay;
						var _Pf=_tz1*_tz1+_uz1*_uz1;
						if(_Mc1>_Pf)
						{
							this._iz1[i]=_h3;
							if(x>0)
							{
								_Mj._TQ(new _cz1._kz1(x-1,y,i-1,_h3));
							}
							if(y>0)
							{
								_Mj._TQ(new _cz1._kz1(x,y-1,i-this._gz1,_h3));
							}
							if(x<this._gz1-1)
							{
								_Mj._TQ(new _cz1._kz1(x+1,y,i+1,_h3));
							}
							if(y<this._hz1-1)
							{
								_Mj._TQ(new _cz1._kz1(x,y+1,i+this._gz1,_h3));
							}
							_sz1=true;
						}
					}
				}
				if(!_sz1)
				{
					break;
				}
			}
		}
		,_vz1:
function(_Ae1)
		{
			for(var y=0;y<this._hz1-1;y++)
			{
				for(var x=0;x<this._gz1-1;x++)
				{
					var i=x+y*this._gz1;
					var _i3=this._iz1[i];
					var _h3=this._iz1[i+1];
					var c=this._iz1[i+this._gz1];
					var _en=this._iz1[i+1+this._gz1];
					if(_h3!=c)
					{
						if(_i3!=_h3&&_i3!=c)
						{
							_Ae1(_i3._3g,_h3._3g,c._3g);
						}
						if(_en!=_h3&&_en!=c)
						{
							_Ae1(_h3._3g,_en._3g,c._3g);
						}
					}
				}
			}
		}
	}
	;

	function _wz1(_f3,_g3,_h3,_i3)
	{
		if(_f3 instanceof _4k1)
		{
			this._f3=(255*_f3._f3);
			this._g3=(255*_f3._g3);
			this._h3=(255*_f3._h3);
			this._i3=255;
		}
		else if(typeof(_f3)!=='undefined')
		{
			this._f3=_f3;
			this._g3=_g3;
			this._h3=_h3;
			this._i3=_i3;
		}
		else this._f3=this._g3=this._h3=this._i3=0;
	}
	_wz1.prototype=
	{
		_xz1:
function()
		{
			return !this._f3&&!this._g3&&!this._h3&&!this._i3;
		}
		,_yz1:
function()
		{
			return new _4k1(1.0/255*this._f3,1.0/255*this._g3,1.0/255*this._h3);
		}
		,Set:
function(_zz1,_Az1,_Bz1,_Cz1)
		{
			if(_zz1 instanceof _4k1)
			{
				this._f3=(255*_zz1._f3);
				this._g3=(255*_zz1._g3);
				this._h3=(255*_zz1._h3);
				this._i3=255;
			}
			else 
			{
				this._f3=_zz1;
				this._g3=_Az1;
				this._h3=_Bz1;
				this._i3=_Cz1;
			}
		}
		,_PG:
function(_Dz1)
		{
			this._f3=_Dz1._f3;
			this._g3=_Dz1._g3;
			this._h3=_Dz1._h3;
			this._i3=_Dz1._i3;
		}
		,_72:
function()
		{
			return new _wz1(this._f3,this._g3,this._h3,this._i3);
		}
	}
	;
	_wz1._If=new _wz1();

	function _Ez1()
	{
		this._Bg1=0;
		this.position=new _wi1();
		this._a31=new _wi1();
		this.color=new _wz1();
		this._nm1=null;
	}
	_Ez1._Fz1=0;
	_Ez1._Gz1=1<<1;
	_Ez1._Hz1=1<<2;
	_Ez1._Iz1=1<<3;
	_Ez1._Jz1=1<<4;
	_Ez1._Kz1=1<<5;
	_Ez1._Lz1=1<<6;
	_Ez1._Mz1=1<<7;
	_Ez1._Nz1=1<<8;
	_Ez1._Oz1=1<<9;

	function _Pz1()
	{
		this._Bg1=0;
		this._Qz1=0;
		this.position=new _wi1();
		this.angle=0;
		this._xt1=new _wi1();
		this._yt1=0;
		this.color=new _wz1();
		this._WZ=1;
		this.shape=null;
		this._Rz1=true;
		this._nm1=null;
	}

	function _Sz1()
	{
		this._Tz1=null;
		this._Uz1=0;
		this._Vz1=0;
		this._Wz1=0;
		this._Xz1=1.0;
		this._Ut1=null;
		this._Vt1=null;
		this._Yz1=-1;
		this._4u1=0;
		this._Zz1=0;
		this.__z1=new _wi1();
		this._Wt1=new _wi1();
		this._Xt1=0;
		this._0A1=new _gj1();
		this._0A1._Ri1();
		this._1A1=true;
		this._2A1=false;
		this._3A1=false;
		this._8u1=null;
	}
	_Sz1.prototype=
	{
		_ov1:
function()
		{
			return this._Vt1;
		}
		,_9_:
function()
		{
			return this._Vz1-this._Uz1;
		}
		,_4A1:
function()
		{
			return this._Uz1;
		}
		,_t_:
function()
		{
			return this._Wz1;
		}
		,_s_:
function(_Bg1)
		{
			this._Wz1=_Bg1;
		}
		,_Pu1:
function()
		{
			this._5A1();
			return this._4u1;
		}
		,_Qu1:
function()
		{
			this._5A1();
			return this._Zz1;
		}
		,_2p1:
function()
		{
			this._5A1();
			return this.__z1;
		}
		,_Gu1:
function()
		{
			this._5A1();
			return this._Wt1;
		}
		,_Iu1:
function()
		{
			this._5A1();
			return this._Xt1;
		}
		,_oj1:
function()
		{
			return this._0A1;
		}
		,_6X:
function()
		{
			return this._0A1._fx;
		}
		,_dj1:
function()
		{
			return this._0A1.q._dj1();
		}
		,_wm1:
function()
		{
			return this._8u1;
		}
		,_pv1:
function(data)
		{
			this._8u1=data;
		}
		,_5A1:
function()
		{
			if(this._Yz1!=this._Tz1._Yz1)
			{
				var _w5=this._Tz1._6A1();
				this._4u1=0;
				this.__z1._xi1();
				this._Wt1._xi1();
				for(var i=this._Uz1;i<this._Vz1;i++)
				{
					this._4u1+=_w5;
					this.__z1._ce(_wi1.Multiply(_w5,this._Tz1._7A1.data[i]));
					this._Wt1._ce(_wi1.Multiply(_w5,this._Tz1._8A1.data[i]));
				}
				if(this._4u1>0)
				{
					this.__z1.Multiply(1/this._4u1);
					this._Wt1.Multiply(1/this._4u1);
				}
				this._Zz1=0;
				this._Xt1=0;
				for(var i=this._Uz1;i<this._Vz1;i++)
				{
					var _fx=_wi1._Di1(this._Tz1._7A1.data[i],this.__z1);
					var _Z3=_wi1._Di1(this._Tz1._8A1.data[i],this._Wt1);
					this._Zz1+=_w5*_sj1(_fx,_fx);
					this._Xt1+=_w5*_tj1(_fx,_Z3);
				}
				if(this._Zz1>0)
				{
					this._Xt1*=1/this._Zz1;
				}
				this._Yz1=this._Tz1._Yz1;
			}
		}
	}
	;
	_Sz1._9A1=1<<0;
	_Sz1._aA1=1<<1;

	function _bA1()
	{
		this._Zm1=this.__m1=0;
		this._Bg1=0;
		this._cA1=0.0;
		this._Pk1=new _wi1();
	}
	;

	function _dA1()
	{
		this.index=0;
		this.body=null;
		this._cA1=0.0;
		this._Pk1=new _wi1();
		this._Bk1=0.0;
	}
	;

	function _Nw1()
	{
		this._Yz1=0;
		this._eA1=0;
		this._fA1=0;
		this._qu1=1;
		this._gA1=1;
		this.__t1=1;
		this._hA1=1;
		this._iA1=1;
		this._jA1=1;
		this._il1=0;
		this._kA1=0;
		this._lA1=0;
		this._mA1=new _Nw1._nA1();
		this._7A1=new _Nw1._nA1();
		this._8A1=new _Nw1._nA1();
		this._oA1=null;
		this._pA1=null;
		this._qA1=null;
		this._4z1=new _Nw1._nA1();
		this._rA1=null;
		this._sA1=new _Nw1._nA1();
		this._hm1=0;
		this._tA1=0;
		this._uA1=null;
		this._Lx1=0;
		this._jy1=0;
		this._Ty1=null;
		this._Yy1=0;
		this._vA1=0;
		this._Wy1=null;
		this._im1=0;
		this._wA1=0;
		this._jm1=null;
		this._xA1=0;
		this._yA1=0;
		this._zA1=null;
		this._AA1=0;
		this._BA1=null;
		this._CA1=0.05;
		this._DA1=1.0;
		this._EA1=0.25;
		this._FA1=0.25;
		this._GA1=0.25;
		this._HA1=0.1;
		this._IA1=0.2;
		this._JA1=0.5;
		this._KA1=0.5;
		this._LA1=0.5;
		this._Pt1=null;
	}
	_Nw1._nA1=
function()
	{
		this.data=null;
		this._MA1=0;
	}
	;
	_Nw1.Proxy=
function()
	{
		this.index=0;
		this._3g=0;
	}
	;
	_Nw1.Proxy._NA1=
function(_i3,_h3)
	{
		return _i3._3g<_h3._3g;
	}
	;
	_Nw1.Proxy._OA1=
function(_i3,_h3)
	{
		return _i3<_h3._3g;
	}
	;
	_Nw1.Proxy._PA1=
function(_i3,_h3)
	{
		return _i3._3g<_h3;
	}
	;
	_Nw1._QA1=
function()
	{
		this._Zm1=this.__m1=0;
		this._Bg1=0;
		this._WZ=0.0;
		this._Ok1=0.0;
	}
	;
	_Nw1._RA1=
function()
	{
		this._Zm1=this.__m1=this._SA1=0;
		this._Bg1=0;
		this._WZ=0.0;
		this._TA1=new _wi1(),this._UA1=new _wi1(),this._Dz1=new _wi1();
		this._VA1=0.0,this._WA1=0.0,this._XA1=0.0,this._hg=0.0;
	}
	;
	_Nw1._YA1=_Ez1._Iz1;
	_Nw1._ZA1=_Ez1._Jz1;
	_Nw1.__A1=_Ez1._Lz1;
	_Nw1._0B1=12;
	_Nw1._1B1=12;
	_Nw1._2B1=8*4;
	_Nw1._3B1=1<<(_Nw1._1B1-1);
	_Nw1._4B1=_Nw1._2B1-_Nw1._1B1;
	_Nw1._5B1=_Nw1._2B1-_Nw1._1B1-_Nw1._0B1;
	_Nw1._6B1=1<<_Nw1._5B1;
	_Nw1._7B1=_Nw1._6B1*(1<<(_Nw1._0B1-1));
	_Nw1._8B1=(1<<_Nw1._0B1)-1;
	_Nw1._9B1=(1<<_Nw1._1B1)-1;

	function _aB1(x,y)
	{
		return((y+_Nw1._3B1)<<_Nw1._4B1)+(_Nw1._6B1*x+_Nw1._7B1)>>>0;
	}

	function _bB1(_3g,x,y)
	{
		return _3g+(y<<_Nw1._4B1)+(x<<_Nw1._5B1);
	}

	function _cB1(_Ny1,_dB1)
	{
		return _dB1&&_Ny1>_dB1?_dB1:_Ny1;
	}

	function _eB1(_vu1)
	{
		return(_vu1._Bg1&_Ez1._Gz1)==_Ez1._Gz1;
	}
	_Nw1.prototype=
	{
		_fB1:
function(_gB1,_hB1,_iB1)
		{
			_Ih1(_iB1>_hB1);
			var _jB1=(_gB1)?_gB1.slice():[];
			_jB1.length=_iB1;
			return _jB1;
		}
		,_kB1:
function(buffer,_MA1,_hB1,_iB1,_lB1)
		{
			_Ih1(_iB1>_hB1);
			_Ih1(!_MA1||_iB1<=_MA1);
			if((!_lB1||buffer)&&!_MA1)
			{
				buffer=this._fB1(buffer,_hB1,_iB1);
			}
			return buffer;
		}
		,_mB1:
function(buffer,_hB1,_iB1,_lB1)
		{
			_Ih1(_iB1>_hB1);
			return this._kB1(buffer.data,buffer._MA1,_hB1,_iB1,_lB1);
		}
		,_nB1:
function(buffer)
		{
			if(!buffer)
			{
				buffer=new Array(this._kA1);
				for(var i=0;i<this._kA1;i++)
				{
					buffer[i]=0;
				}
			}
			return buffer;
		}
		,_KZ:
function(_hu1)
		{
			if(this._il1>=this._kA1)
			{
				var _Ny1=this._il1?2*this._il1:_di1;
				_Ny1=_cB1(_Ny1,this._lA1);
				_Ny1=_cB1(_Ny1,this._mA1._MA1);
				_Ny1=_cB1(_Ny1,this._7A1._MA1);
				_Ny1=_cB1(_Ny1,this._8A1._MA1);
				_Ny1=_cB1(_Ny1,this._4z1._MA1);
				_Ny1=_cB1(_Ny1,this._sA1._MA1);
				if(this._kA1<_Ny1)
				{
					this._mA1.data=this._mB1(this._mA1,this._kA1,_Ny1,false);
					this._7A1.data=this._mB1(this._7A1,this._kA1,_Ny1,false);
					this._8A1.data=this._mB1(this._8A1,this._kA1,_Ny1,false);
					this._oA1=this._kB1(this._oA1,0,this._kA1,_Ny1,false);
					this._pA1=this._kB1(this._pA1,0,this._kA1,_Ny1,true);
					this._qA1=this._kB1(this._qA1,0,this._kA1,_Ny1,true);
					this._4z1.data=this._mB1(this._4z1,this._kA1,_Ny1,true);
					this._rA1=this._kB1(this._rA1,0,this._kA1,_Ny1,false);
					this._sA1.data=this._mB1(this._sA1,this._kA1,_Ny1,true);
					this._kA1=_Ny1;
				}
			}
			if(this._il1>=this._kA1)
			{
				return _7i1;
			}
			var index=this._il1++;
			this._mA1.data[index]=_hu1._Bg1;
			this._7A1.data[index]=_hu1.position._72();
			this._8A1.data[index]=_hu1._a31._72();
			this._rA1[index]=null;
			if(this._qA1)
			{
				this._qA1[index]=0;
			}
			if(this._4z1.data||!_hu1.color._xz1())
			{
				this._4z1.data=this._nB1(this._4z1.data);
				this._4z1.data[index]=_hu1.color._72();
			}
			if(this._sA1.data||_hu1._nm1)
			{
				this._sA1.data=this._nB1(this._sA1.data);
				this._sA1.data[index]=_hu1._nm1;
			}
			if(this._hm1>=this._tA1)
			{
				var _hB1=this._tA1;
				var _iB1=this._hm1?2*this._hm1:_di1;
				this._uA1=this._fB1(this._uA1,_hB1,_iB1);
				this._tA1=_iB1;
			}
			this._uA1[this._hm1]=new _Nw1.Proxy();
			this._uA1[this._hm1++].index=index;
			return index;
		}
		,_yy1:
function(index,_zy1)
		{
			var _Bg1=_Ez1._Gz1;
			if(_zy1)
			{
				_Bg1|=_Ez1._Oz1;
			}
			this._mA1.data[index]|=_Bg1;
		}
		,_Ay1:
function(shape,_hj1,_zy1)
		{

			function _oB1(_0z1,shape,_hj1,_zy1)
			{
				this._Tz1=_0z1;
				this._Cv1=shape;
				this._Mq1=_hj1;
				this._pB1=_zy1;
				this._5x1=0;
			}
			_oB1.prototype=
			{
				_cw1:
function(_CX)
				{
					return false;
				}
				,_dw1:
function(index)
				{
					_Ih1(index>=0&&index<this._Tz1._il1);
					if(this._Cv1._Gk1(this._Mq1,this._Tz1._7A1.data[index]))
					{
						this._Tz1._yy1(index,this._pB1);
						this._5x1++;
					}
					return true;
				}
				,_qB1:
function()
				{
					return this._5x1;
				}
			}
			;
			var _Ae1=new _oB1(this,shape,_hj1,_zy1);
			var _Kk1=new _0p1();
			shape._Jk1(_Kk1,_hj1,0);
			this._Pt1._vx1(_Ae1,_Kk1);
			return _Ae1._qB1();
		}
		,_Fy1:
function(_v_,_zy1)
		{
			for(var i=_v_._Uz1;i<_v_._Vz1;i++)
			{
				this._yy1(i,_zy1);
			}
		}
		,_By1:
function(_rB1)
		{
			var _K9=this._sB1();
			var identity=new _gj1();
			identity._Ri1();
			var transform=identity._72();
			var _tB1=this._il1;
			if(_rB1.shape)
			{
				var _uB1=new _Ez1();
				_uB1._Bg1=_rB1._Bg1;
				_uB1.color=_rB1.color;
				_uB1._nm1=_rB1._nm1;
				var shape=_rB1.shape;
				transform.Set(_rB1.position,_rB1.angle);
				var _Kk1=new _0p1();
				var _Qv1=shape._Fk1();
				for(var _Ik1=0;_Ik1<_Qv1;_Ik1++)
				{
					if(_Ik1==0)
					{
						shape._Jk1(_Kk1,identity,_Ik1);
					}
					else 
					{
						var _vB1=new _0p1();
						shape._Jk1(_vB1,identity,_Ik1);
						_Kk1._5p1(_vB1);
					}
				}
				for(var y=Math.floor(_Kk1._Yk1.y/_K9)*_K9;y<_Kk1._Zk1.y;y+=_K9)
				{
					for(var x=Math.floor(_Kk1._Yk1.x/_K9)*_K9;x<_Kk1._Zk1.x;x+=_K9)
					{
						var _fx=new _wi1(x,y);
						if(shape._Gk1(identity,_fx))
						{
							_fx=_Jj1(transform,_fx);
							_uB1.position._PG(_fx);
							_uB1._a31._PG(_wi1._ce(_rB1._xt1,_vj1(_rB1._yt1,_wi1._Di1(_fx,_rB1.position))));
							this._KZ(_uB1);
						}
					}
				}
			}
			var lastIndex=this._il1;
			var _v_=new _Sz1();
			_v_._Tz1=this;
			_v_._Uz1=_tB1;
			_v_._Vz1=lastIndex;
			_v_._Wz1=_rB1._Qz1;
			_v_._Xz1=_rB1._WZ;
			_v_._8u1=_rB1._nm1;
			_v_._0A1=transform;
			_v_._1A1=_rB1._Rz1;
			_v_._Ut1=null;
			_v_._Vt1=this._BA1;
			if(this._BA1)
			{
				this._BA1._Ut1=_v_;
			}
			this._BA1=_v_;
			++this._AA1;
			for(var i=_tB1;i<lastIndex;i++)
			{
				this._rA1[i]=_v_;
			}
			this._wB1(true);
			if(_rB1._Bg1&_Nw1._YA1)
			{
				for(var _ij=0;_ij<this._Lx1;_ij++)
				{
					var _vu1=this._Ty1[_ij];
					var _i3=_vu1._Zm1;
					var _h3=_vu1.__m1;
					if(_i3>_h3)
					{
						var _xB1=_i3;
						_i3=_h3;
						_h3=_xB1;
					}
					if(_tB1<=_i3&&_h3<lastIndex)
					{
						if(this._im1>=this._wA1)
						{
							var _hB1=this._wA1;
							var _iB1=this._im1?2*this._im1:_di1;
							this._jm1=this._fB1(this._jm1,_hB1,_iB1);
							this._wA1=_iB1;
						}
						var _Jm1=this._jm1[this._im1]=new _Nw1._QA1();
						_Jm1._Zm1=_i3;
						_Jm1.__m1=_h3;
						_Jm1._Bg1=_vu1._Bg1;
						_Jm1._WZ=_rB1._WZ;
						_Jm1._Ok1=_yj1(this._7A1.data[_i3],this._7A1.data[_h3]);
						this._im1++;
					}
				}
			}
			if(_rB1._Bg1&_Nw1._ZA1)
			{
				var _yB1=new _cz1(lastIndex-_tB1);
				for(var i=_tB1;i<lastIndex;i++)
				{
					_yB1._nz1(this._7A1.data[i],i);
				}
				_yB1._oz1(_K9/2);
				var _Ae1=
function _zB1(_i3,_h3,c)
				{
					var _TA1=this._7A1.data[_i3];
					var _UA1=this._7A1.data[_h3];
					var _Dz1=this._7A1.data[c];
					var _AB1=_wi1._Di1(_TA1,_UA1);
					var _BB1=_wi1._Di1(_UA1,_Dz1);
					var _CB1=_wi1._Di1(_Dz1,_TA1);
					var _DB1=_ci1*this._jA1;
					if(_sj1(_AB1,_AB1)<_DB1&&_sj1(_BB1,_BB1)<_DB1&&_sj1(_CB1,_CB1)<_DB1)
					{
						if(this._xA1>=this._yA1)
						{
							var _hB1=this._yA1;
							var _iB1=this._xA1?2*this._xA1:_di1;
							this._zA1=this._fB1(this._zA1,_hB1,_iB1);
							this._yA1=_iB1;
						}
						var _EB1=this._zA1[this._xA1];
						_EB1._Zm1=_i3;
						_EB1.__m1=_h3;
						_EB1._SA1=c;
						_EB1._Bg1=this._mA1.data[_i3]|this._mA1.data[_h3]|this._mA1.data[c];
						_EB1._WZ=_rB1._WZ;
						var _FB1=_wi1.Multiply(1.0/3.0,_wi1._ce(_TA1,_wi1._ce(_UA1,_Dz1)));
						_EB1._TA1=_wi1._Di1(_TA1,_FB1);
						_EB1._UA1=_wi1._Di1(_UA1,_FB1);
						_EB1._Dz1=_wi1._Di1(_Dz1,_FB1);
						_EB1._VA1=-_sj1(_CB1,_AB1);
						_EB1._WA1=-_sj1(_AB1,_BB1);
						_EB1._XA1=-_sj1(_BB1,_CB1);
						_EB1._hg=_tj1(_TA1,_UA1)+_tj1(_UA1,_Dz1)+_tj1(_Dz1,_TA1);
						this._xA1++;
					}
				}
				;
				_yB1._vz1(_Ae1);
			}
			if(_rB1._Qz1&_Ez1._9A1)
			{
				this._GB1(_v_);
			}
			return _v_;
		}
		,_Cy1:
function(_Dy1,_Ey1)
		{
			_Ih1(_Dy1!=_Ey1);
			this._HB1(_Ey1._Uz1,_Ey1._Vz1,this._il1);
			_Ih1(_Ey1._Vz1==this._il1);
			this._HB1(_Dy1._Uz1,_Dy1._Vz1,_Ey1._Uz1);
			this._Ih1(_Dy1._Vz1==_Ey1._Uz1);
			var _IB1=0;
			for(var i=_Dy1._Uz1;i<_Ey1._Vz1;i++)
			{
				_IB1|=this._mA1.data[i];
			}
			this._wB1(true);
			if(_IB1&_Nw1._YA1)
			{
				for(var _ij=0;_ij<this._Lx1;_ij++)
				{
					var _vu1=this._Ty1[_ij];
					var _i3=_vu1._Zm1;
					var _h3=_vu1.__m1;
					if(_i3>_h3)
					{
						var _xB1=_i3;
						_i3=_h3;
						_h3=_xB1;
					}
					if(_Dy1._Uz1<=_i3&&_i3<_Dy1._Vz1&&_Ey1._Uz1<=_h3&&_h3<_Ey1._Vz1)
					{
						if(this._im1>=this._wA1)
						{
							var _hB1=this._wA1;
							var _iB1=this._im1?2*this._im1:_di1;
							this._jm1=this._fB1(this._jm1,_hB1,_iB1);
							this._wA1=_iB1;
						}
						var _Jm1=this._jm1[this._im1]=new _Nw1._QA1();
						_Jm1._Zm1=_i3;
						_Jm1.__m1=_h3;
						_Jm1._Bg1=_vu1._Bg1;
						_Jm1._WZ=_Uj1(_Dy1._Xz1,_Ey1._Xz1);
						_Jm1._Ok1=_yj1(this._7A1.data[_i3],this._7A1.data[_h3]);
						this._im1++;
					}
				}
			}
			if(_IB1&_Nw1._ZA1)
			{
			}
			for(var i=_Ey1._Uz1;i<_Ey1._Vz1;i++)
			{
				this._rA1[i]=_Dy1;
			}
			var _Qz1=_Dy1._Wz1|_Ey1._Wz1;
			_Dy1._Wz1=_Qz1;
			_Dy1._Vz1=_Ey1._Vz1;
			_Ey1._Uz1=_Ey1._Vz1;
			this._JB1(_Ey1);
			if(_Qz1&_Ez1._9A1)
			{
				this._GB1(_Dy1);
			}
		}
		,_JB1:
function(_v_)
		{
			_Ih1(this._AA1>0);
			_Ih1(_v_);
			if(this._Pt1._ww1)
			{
				this._Pt1._ww1._KB1(_v_);
			}
			for(var i=_v_._Uz1;i<_v_._Vz1;i++)
			{
				this._rA1[i]=null;
			}
			if(_v_._Ut1)
			{
				_v_._Ut1._Vt1=_v_._Vt1;
			}
			if(_v_._Vt1)
			{
				_v_._Vt1._Ut1=_v_._Ut1;
			}
			if(_v_==this._BA1)
			{
				this._BA1=_v_._Vt1;
			}
			--this._AA1;
		}
		,_GB1:
function(_v_)
		{
			for(var i=_v_._Uz1;i<_v_._Vz1;i++)
			{
				this._oA1[i]=0;
			}
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				var _i3=_vu1._Zm1;
				var _h3=_vu1.__m1;
				if(_i3>=_v_._Uz1&&_i3<_v_._Vz1&&_h3>=_v_._Uz1&&_h3<_v_._Vz1)
				{
					var w=_vu1._cA1;
					this._oA1[_i3]+=w;
					this._oA1[_h3]+=w;
				}
			}
			this._qA1=this._nB1(this._qA1);
			for(var i=_v_._Uz1;i<_v_._Vz1;i++)
			{
				var w=this._oA1[i];
				this._qA1[i]=w<0.8?0:_Kh1;
			}
			var _LB1=_v_._9_();
			for(var _K5=0;_K5<_LB1;_K5++)
			{
				var _sz1=false;
				for(var _ij=0;_ij<this._Lx1;_ij++)
				{
					var _vu1=this._Ty1[_ij];
					var _i3=_vu1._Zm1;
					var _h3=_vu1.__m1;
					if(_i3>=_v_._Uz1&&_i3<_v_._Vz1&&_h3>=_v_._Uz1&&_h3<_v_._Vz1)
					{
						var _f3=1-_vu1._cA1;
						var _MB1=this._qA1[_i3];
						var _NB1=this._qA1[_h3];
						var _OB1=_NB1+_f3;
						var _PB1=_MB1+_f3;
						if(_MB1>_OB1)
						{
							_MB1=_OB1;
							_sz1=true;
						}
						if(_NB1>_PB1)
						{
							_NB1=_PB1;
							_sz1=true;
						}
						this._qA1[_i3]=_MB1;
						this._qA1[_h3]=_NB1;
					}
				}
				if(!_sz1)
				{
					break;
				}
			}
			for(var i=_v_._Uz1;i<_v_._Vz1;i++)
			{
				var _fx=this._qA1[i];
				if(_fx<_Kh1)
				{
					_fx*=this._hA1;
				}
				else 
				{
					_fx=0;
				}
				this._qA1[i]=_fx;
			}
		}
		,_1y1:
function(_i3,_h3)
		{
			var _en=_wi1._Di1(this._7A1.data[_h3],this._7A1.data[_i3]);
			var _Xt=_sj1(_en,_en);
			if(_Xt<this._jA1)
			{
				if(this._Lx1>=this._jy1)
				{
					var _hB1=this._jy1;
					var _iB1=this._Lx1?2*this._Lx1:_di1;
					this._Ty1=this._fB1(this._Ty1,_hB1,_iB1);
					this._jy1=_iB1;
				}
				var _QB1=_vi1(_Xt);
				var _vu1=this._Ty1[this._Lx1]=new _bA1();
				_vu1._Zm1=_i3;
				_vu1.__m1=_h3;
				_vu1._Bg1=this._mA1.data[_i3]|this._mA1.data[_h3];
				_vu1._cA1=1-_Xt*_QB1*this._iA1;
				_vu1._Pk1._PG(_wi1.Multiply(_QB1,_en));
				this._Lx1++;
			}
		}
		,_wB1:
function(_RB1)
		{
			var _SB1=0;
			var _TB1=this._hm1;
			for(var _UB1=_SB1;_UB1<_TB1;++_UB1)
			{
				var _Rv1=this._uA1[_UB1];
				var i=_Rv1.index;
				var _fx=this._7A1.data[i];
				_Rv1._3g=_aB1(this._iA1*_fx.x,this._iA1*_fx.y);
			}
			this._uA1._hh1(_SB1,_TB1,
function(_i3,_h3)
			{
				return _Nw1.Proxy._NA1(_i3,_h3);
			}
			);
			this._Lx1=0;
			for(var _i3=_SB1,c=_SB1;_i3<_TB1;_i3++)
			{
				var _VB1=_bB1(this._uA1[_i3]._3g,1,0);
				for(var _h3=_i3+1;_h3<_TB1;_h3++)
				{
					if(_VB1<this._uA1[_h3]._3g)break;
					this._1y1(this._uA1[_i3].index,this._uA1[_h3].index);
				}
				var _WB1=_bB1(this._uA1[_i3]._3g,-1,1);
				for(;c<_TB1;c++)
				{
					if(_WB1<=this._uA1[c]._3g)break;
				}
				var _XB1=_bB1(this._uA1[_i3]._3g,1,1);
				for(var _h3=c;_h3<_TB1;_h3++)
				{
					if(_XB1<this._uA1[_h3]._3g)break;
					this._1y1(this._uA1[_i3].index,this._uA1[_h3].index);
				}
			}
			if(_RB1)
			{
				this._Lx1=this._Ty1._kh1(_eB1,this._Lx1);
			}
		}
		,_YB1:
function()
		{
			var _Kk1=new _0p1();
			_Kk1._Yk1.x=+_Kh1;
			_Kk1._Yk1.y=+_Kh1;
			_Kk1._Zk1.x=-_Kh1;
			_Kk1._Zk1.y=-_Kh1;
			for(var i=0;i<this._il1;i++)
			{
				var _fx=this._7A1.data[i];
				_Kk1._Yk1._PG(_Vj1(_Kk1._Yk1,_fx));
				_Kk1._Zk1._PG(_Xj1(_Kk1._Zk1,_fx));
			}
			_Kk1._Yk1.x-=this._hA1;
			_Kk1._Yk1.y-=this._hA1;
			_Kk1._Zk1.x+=this._hA1;
			_Kk1._Zk1.y+=this._hA1;
			this._Yy1=0;

			function _ZB1(_0z1)
			{
				this._Tz1=_0z1;
			}
			_ZB1.prototype=
			{
				_cw1:
function(_CX)
				{
					if(_CX._Jv1())
					{
						return true;
					}
					var shape=_CX._Hv1();
					var _h3=_CX._Ov1();
					var _tx1=_h3._Du1();
					var __B1=_h3._Pu1();
					var _0C1=_h3._Qu1()-__B1*_h3._Eu1()._Ei1();
					var _1C1=__B1>0?1/__B1:0;
					var _2C1=_0C1>0?1/_0C1:0;
					var _Qv1=shape._Fk1();
					for(var _Ik1=0;_Ik1<_Qv1;_Ik1++)
					{
						var _Kk1=_CX._Pv1(_Ik1)._72();
						_Kk1._Yk1.x-=this._Tz1._hA1;
						_Kk1._Yk1.y-=this._Tz1._hA1;
						_Kk1._Zk1.x+=this._Tz1._hA1;
						_Kk1._Zk1.y+=this._Tz1._hA1;
						var _SB1=0;
						var _TB1=this._Tz1._hm1;
						var _3C1=this._Tz1._uA1._mh1(_SB1,_TB1,_aB1(this._Tz1._iA1*_Kk1._Yk1.x,this._Tz1._iA1*_Kk1._Yk1.y),
function(_i3,_h3)
						{
							return _Nw1.Proxy._PA1(_i3,_h3);
						}
						);
						var _4C1=this._Tz1._uA1._oh1(_3C1,_TB1,_aB1(this._Tz1._iA1*_Kk1._Zk1.x,this._Tz1._iA1*_Kk1._Zk1.y),
function(_i3,_h3)
						{
							return _Nw1.Proxy._OA1(_i3,_h3);
						}
						);
						for(var _Rv1=_3C1;_Rv1!=_4C1;++_Rv1)
						{
							var _5C1=this._Tz1._uA1[_Rv1];
							var _i3=_5C1.index;
							var _6C1=this._Tz1._7A1.data[_i3];
							if(_Kk1._Yk1.x<=_6C1.x&&_6C1.x<=_Kk1._Zk1.x&&_Kk1._Yk1.y<=_6C1.y&&_6C1.y<=_Kk1._Zk1.y)
							{
								var _en=[0];
								var _u5=new _wi1();
								_CX._Nk1(_6C1,_en,_u5,_Ik1);
								if(_en[0]<this._Tz1._hA1)
								{
									var _7C1=this._Tz1._mA1.data[_i3]&_Ez1._Hz1?0:this._Tz1._8C1();
									var _9C1=_wi1._Di1(_6C1,_tx1);
									var _aC1=_tj1(_9C1,_u5);
									if(this._Tz1._Yy1>=this._Tz1._vA1)
									{
										var _hB1=this._Tz1._vA1;
										var _iB1=this._Tz1._Yy1?2*this._Tz1._Yy1:_di1;
										this._Tz1._Wy1=this._Tz1._fB1(this._Tz1._Wy1,_hB1,_iB1);
										this._Tz1._vA1=_iB1;
									}
									var _vu1=this._Tz1._Wy1[this._Tz1._Yy1]=new _dA1();
									_vu1.index=_i3;
									_vu1.body=_h3;
									_vu1._cA1=1-_en[0]*this._Tz1._iA1;
									_vu1._Pk1._PG(_u5._Ai1());
									_vu1._Bk1=1/(_7C1+_1C1+_2C1*_aC1*_aC1);
									this._Tz1._Yy1++;
								}
							}
						}
					}
					return true;
				}
				,_dw1:
function(i)
				{
					return false;
				}
			}
			;
			var _Ae1=new _ZB1(this);
			this._Pt1._vx1(_Ae1,_Kk1);
		}
		,_Vi1:
function(step)
		{
			++this._Yz1;
			if(this._il1==0)
			{
				return;
			}
			this._eA1=0;
			for(var i=0;i<this._il1;i++)
			{
				this._eA1|=this._mA1.data[i];
			}
			if(this._eA1&_Ez1._Gz1)
			{
				this._bC1();
			}
			this._fA1=0;
			for(var _v_=this._BA1;_v_;_v_=_v_._ov1())
			{
				this._fA1|=_v_._Wz1;
			}
			var gravity=_wi1.Multiply(step._wt*this.__t1,this._Pt1._Mx1());
			var _cC1=this._dC1(step);
			for(var i=0;i<this._il1;i++)
			{
				var _Z3=this._8A1.data[i];
				_Z3._ce(gravity);
				var _04=_sj1(_Z3,_Z3);
				if(_04>_cC1)
				{
					_Z3.Multiply(_ti1(_cC1/_04));
				}
			}
			this._eC1(step);
			if(this._fA1&_Sz1._aA1)
			{
				this._fC1(step);
			}
			if(this._eA1&_Ez1._Hz1)
			{
				this._gC1(step);
			}
			for(var i=0;i<this._il1;i++)
			{
				this._7A1.data[i]._ce(_wi1.Multiply(step._wt,this._8A1.data[i]));
			}
			this._YB1();
			this._wB1(false);
			if(this._eA1&_Ez1._Kz1)
			{
				this._hC1(step);
			}
			if(this._eA1&_Ez1._Lz1)
			{
				this._iC1(step);
			}
			if(this._eA1&_Ez1._Mz1)
			{
				this._jC1(step);
			}
			if(this._eA1&_Ez1._Jz1)
			{
				this._kC1(step);
			}
			if(this._eA1&_Ez1._Iz1)
			{
				this._lC1(step);
			}
			if(this._fA1&_Sz1._9A1)
			{
				this._mC1(step);
			}
			if(this._eA1&_Ez1._Nz1)
			{
				this._nC1(step);
			}
			this._oC1(step);
			this._pC1(step);
		}
		,_eC1:
function(step)
		{
			var _Kk1=new _0p1();
			_Kk1._Yk1.x=+_Kh1;
			_Kk1._Yk1.y=+_Kh1;
			_Kk1._Zk1.x=-_Kh1;
			_Kk1._Zk1.y=-_Kh1;
			for(var i=0;i<this._il1;i++)
			{
				var _Z3=this._8A1.data[i];
				var _sn=this._7A1.data[i];
				var _ik1=_wi1._ce(_sn,_wi1.Multiply(step._wt,_Z3));
				_Kk1._Yk1=_Vj1(_Kk1._Yk1,_Vj1(_sn,_ik1));
				_Kk1._Zk1=_Xj1(_Kk1._Zk1,_Xj1(_sn,_ik1));
			}

			function _qC1(_0z1,step)
			{
				this._Tz1=_0z1;
				this._rC1=step;
			}
			_qC1.prototype=
			{
				_cw1:
function(_CX)
				{
					if(_CX._Jv1())
					{
						return true;
					}
					var shape=_CX._Hv1();
					var body=_CX._Ov1();
					var _SB1=0;
					var _TB1=this._Tz1._hm1;
					var _Qv1=shape._Fk1();
					for(var _Ik1=0;_Ik1<_Qv1;_Ik1++)
					{
						var _Kk1=_CX._Pv1(_Ik1)._72();
						_Kk1._Yk1.x-=this._Tz1._hA1;
						_Kk1._Yk1.y-=this._Tz1._hA1;
						_Kk1._Zk1.x+=this._Tz1._hA1;
						_Kk1._Zk1.y+=this._Tz1._hA1;
						var _3C1=this._Tz1._uA1._mh1(_SB1,_TB1,_aB1(this._Tz1._iA1*_Kk1._Yk1.x,this._Tz1._iA1*_Kk1._Yk1.y),
function(_i3,_h3)
						{
							return _Nw1.Proxy._PA1(_i3,_h3);
						}
						);
						var _4C1=this._Tz1._uA1._oh1(_3C1,_TB1,_aB1(this._Tz1._iA1*_Kk1._Zk1.x,this._Tz1._iA1*_Kk1._Zk1.y),
function(_i3,_h3)
						{
							return _Nw1.Proxy._OA1(_i3,_h3);
						}
						);
						for(var _Rv1=_3C1;_Rv1!=_4C1;++_Rv1)
						{
							var _5C1=this._Tz1._uA1[_Rv1];
							var _i3=_5C1.index;
							var _6C1=this._Tz1._7A1.data[_i3];
							if(_Kk1._Yk1.x<=_6C1.x&&_6C1.x<=_Kk1._Zk1.x&&_Kk1._Yk1.y<=_6C1.y&&_6C1.y<=_Kk1._Zk1.y)
							{
								var _sC1=this._Tz1._8A1.data[_i3];
								var output=new __o1();
								var input=new _Zo1();
								input._sn=_Jj1(body._Mq1,_Lj1(body._Qt1,_6C1));
								input._ik1=_wi1._ce(_6C1,_wi1.Multiply(this._rC1._wt,_sC1));
								input._O_=1;
								if(_CX._Hk1(output,input,_Ik1))
								{
									var _fx=_wi1._ce(_wi1._ce(_wi1.Multiply((1-output._T_),input._sn),_wi1.Multiply(output._T_,input._ik1)),_wi1.Multiply(_Rh1,output._Pk1));
									var _Z3=_wi1.Multiply(this._rC1._gw1,_wi1._Di1(_fx,_6C1));
									this._Tz1._8A1.data[_i3]._PG(_Z3);
									var _At=_wi1.Multiply(this._Tz1._6A1(),_wi1._Di1(_sC1,_Z3));
									_At=_wi1.Multiply(_sj1(_At,output._Pk1),output._Pk1);
									body._Nu1(_At,_fx,true);
								}
							}
						}
					}
					return true;
				}
				,_dw1:
function(i)
				{
					return false;
				}
			}
			;
			var _Ae1=new _qC1(this,step);
			this._Pt1._vx1(_Ae1,_Kk1);
		}
		,_oC1:
function(step)
		{
			for(var i=0;i<this._il1;i++)
			{
				this._oA1[i]=0;
			}
			for(var _ij=0;_ij<this._Yy1;_ij++)
			{
				var _vu1=this._Wy1[_ij];
				var _i3=_vu1.index;
				var w=_vu1._cA1;
				this._oA1[_i3]+=w;
			}
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				var _i3=_vu1._Zm1;
				var _h3=_vu1.__m1;
				var w=_vu1._cA1;
				this._oA1[_i3]+=w;
				this._oA1[_h3]+=w;
			}
			if(this._eA1&_Nw1.__A1)
			{
				for(var i=0;i<this._il1;i++)
				{
					if(this._mA1.data[i]&_Nw1.__A1)
					{
						this._oA1[i]=0;
					}
				}
			}
			var _tC1=this._CA1*this._uC1(step);
			for(var i=0;i<this._il1;i++)
			{
				var w=this._oA1[i];
				var h=_tC1*_Wj1(0.0,_Uj1(w,_ai1)-_9i1);
				this._oA1[i]=h;
			}
			var _vC1=step._wt/(this._qu1*this._hA1);
			for(var _ij=0;_ij<this._Yy1;_ij++)
			{
				var _vu1=this._Wy1[_ij];
				var _i3=_vu1.index;
				var _h3=_vu1.body;
				var w=_vu1._cA1;
				var _w5=_vu1._Bk1;
				var _u5=_vu1._Pk1;
				var _fx=this._7A1.data[_i3];
				var h=this._oA1[_i3]+_tC1*w;
				var _At=_wi1.Multiply(_vC1*w*_w5*h,_u5);
				this._8A1.data[_i3]._Di1(_wi1.Multiply(this._8C1(),_At));
				_h3._Nu1(_At,_fx,true);
			}
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				var _i3=_vu1._Zm1;
				var _h3=_vu1.__m1;
				var w=_vu1._cA1;
				var _u5=_vu1._Pk1;
				var h=this._oA1[_i3]+this._oA1[_h3];
				var _At=_wi1.Multiply(_vC1*w*h,_u5);
				this._8A1.data[_i3]._Di1(_At);
				this._8A1.data[_h3]._ce(_At);
			}
		}
		,_pC1:
function(step)
		{
			var _l_=this._DA1;
			for(var _ij=0;_ij<this._Yy1;_ij++)
			{
				var _vu1=this._Wy1[_ij];
				var _i3=_vu1.index;
				var _h3=_vu1.body;
				var w=_vu1._cA1;
				var _w5=_vu1._Bk1;
				var _u5=_vu1._Pk1;
				var _fx=this._7A1.data[_i3];
				var _Z3=_wi1._Di1(_h3.__u1(_fx),this._8A1.data[_i3]);
				var _wC1=_sj1(_Z3,_u5);
				if(_wC1<0)
				{
					var _At=_wi1.Multiply(_l_*w*_w5*_wC1,_u5);
					this._8A1.data[_i3]._ce(_wi1.Multiply(this._8C1(),_At));
					_h3._Nu1(_At._Ai1(),_fx,true);
				}
			}
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				var _i3=_vu1._Zm1;
				var _h3=_vu1.__m1;
				var w=_vu1._cA1;
				var _u5=_vu1._Pk1;
				var _Z3=_wi1._Di1(this._8A1.data[_h3],this._8A1.data[_i3]);
				var _wC1=_sj1(_Z3,_u5);
				if(_wC1<0)
				{
					var _At=_wi1.Multiply(_l_*w*_wC1,_u5);
					this._8A1.data[_i3]._ce(_At);
					this._8A1.data[_h3]._Di1(_At);
				}
			}
		}
		,_gC1:
function(step)
		{
			for(var i=0;i<this._il1;i++)
			{
				if(this._mA1.data[i]&_Ez1._Hz1)
				{
					this._8A1.data[i]._xi1();
				}
			}
		}
		,_fC1:
function(step)
		{
			for(var _v_=this._BA1;_v_;_v_=_v_._ov1())
			{
				if(_v_._Wz1&_Sz1._aA1)
				{
					_v_._5A1();
					var rotation=new _cj1(step._wt*_v_._Xt1);
					var transform=new _gj1(_wi1._ce(_v_.__z1,_wi1._Di1(_wi1.Multiply(step._wt,_v_._Wt1),_Hj1(rotation,_v_.__z1))),rotation);
					_v_._0A1=_Mj1(transform,_v_._0A1);
					var _xC1=new _gj1();
					_xC1._fx.x=step._gw1*transform._fx.x;
					_xC1._fx.y=step._gw1*transform._fx.y;
					_xC1.q._hg=step._gw1*transform.q._hg;
					_xC1.q.c=step._gw1*(transform.q.c-1);
					for(var i=_v_._Uz1;i<_v_._Vz1;i++)
					{
						this._8A1.data[i]._PG(_Jj1(_xC1,this._7A1.data[i]));
					}
				}
			}
		}
		,_kC1:
function(step)
		{
			var _yC1=step._gw1*this._EA1;
			for(var _ij=0;_ij<this._xA1;_ij++)
			{
				var _EB1=this._zA1[_ij];
				if(_EB1._Bg1&_Ez1._Jz1)
				{
					var _i3=_EB1._Zm1;
					var _h3=_EB1.__m1;
					var c=_EB1._SA1;
					var _xB1=_EB1._TA1;
					var _zC1=_EB1._UA1;
					var _AC1=_EB1._Dz1;
					var _TA1=this._7A1.data[_i3];
					var _UA1=this._7A1.data[_h3];
					var _Dz1=this._7A1.data[c];
					var _fx=_wi1.Multiply(1/3,_wi1._ce(_TA1,_wi1._ce(_UA1,_Dz1)));
					var _f3=new _cj1();
					_f3._hg=_tj1(_xB1,_TA1)+_tj1(_zC1,_UA1)+_tj1(_AC1,_Dz1);
					_f3.c=_sj1(_xB1,_TA1)+_sj1(_zC1,_UA1)+_sj1(_AC1,_Dz1);
					var _my=_f3._hg*_f3._hg+_f3.c*_f3.c;
					var _BC1=_vi1(_my);
					_f3._hg*=_BC1;
					_f3.c*=_BC1;
					var _WZ=_yC1*_EB1._WZ;
					this._8A1.data[_i3]._ce(_wi1.Multiply(_WZ,(_wi1._Di1(_wi1.Multiply(_xB1,_f3),(_wi1._Di1(_TA1,_fx))))));
					this._8A1.data[_h3]._ce(_wi1.Multiply(_WZ,(_wi1._Di1(_wi1.Multiply(_zC1,_f3),(_wi1._Di1(_UA1,_fx))))));
					this._8A1.data[c]._ce(_wi1.Multiply(_WZ,(_wi1._Di1(_wi1.Multiply(_AC1,_f3),(_wi1._Di1(_Dz1,_fx))))));
				}
			}
		}
		,_lC1:
function(step)
		{
			var _CC1=step._gw1*this._FA1;
			for(var _ij=0;_ij<this._im1;_ij++)
			{
				var _Jm1=this._jm1[_ij];
				if(_Jm1._Bg1&_Ez1._Iz1)
				{
					var _i3=_Jm1._Zm1;
					var _h3=_Jm1.__m1;
					var _en=_wi1._Di1(this._7A1.data[_h3],this._7A1.data[_i3]);
					var _DC1=_Jm1._Ok1;
					var _ly=_en.Length();
					var _WZ=_CC1*_Jm1._WZ;
					var _At=_wi1.Multiply(_WZ*(_DC1-_ly)/_ly,_en);
					this._8A1.data[_i3]._Di1(_At);
					this._8A1.data[_h3]._ce(_At);
				}
			}
		}
		,_jC1:
function(step)
		{
			this._pA1=this._nB1(this._pA1);
			for(var i=0;i<this._il1;i++)
			{
				this._oA1[i]=0;
				this._pA1[i]=new _wi1();
			}
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				if(_vu1._Bg1&_Ez1._Mz1)
				{
					var _i3=_vu1._Zm1;
					var _h3=_vu1.__m1;
					var w=_vu1._cA1;
					var _u5=_vu1._Pk1;
					this._oA1[_i3]+=w;
					this._oA1[_h3]+=w;
					this._pA1[_i3]._Di1(_wi1.Multiply((1-w)*w,_u5));
					this._pA1[_h3]._ce(_wi1.Multiply((1-w)*w,_u5));
				}
			}
			var _EC1=this._HA1*this._FC1(step);
			var _GC1=this._IA1*this._FC1(step);
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				if(_vu1._Bg1&_Ez1._Mz1)
				{
					var _i3=_vu1._Zm1;
					var _h3=_vu1.__m1;
					var w=_vu1._cA1;
					var _u5=_vu1._Pk1;
					var h=this._oA1[_i3]+this._oA1[_h3];
					var _hg=_wi1._Di1(this._pA1[_h3],this._pA1[_i3]);
					var _HC1=(_EC1*(h-2)+_GC1*_sj1(_hg,_u5))*w;
					var _At=_wi1.Multiply(_HC1,_u5);
					this._8A1.data[_i3]._Di1(_At);
					this._8A1.data[_h3]._ce(_At);
				}
			}
		}
		,_hC1:
function(step)
		{
			var _IC1=this._GA1;
			for(var _ij=0;_ij<this._Yy1;_ij++)
			{
				var _vu1=this._Wy1[_ij];
				var _i3=_vu1.index;
				if(this._mA1.data[_i3]&_Ez1._Kz1)
				{
					var _h3=_vu1.body;
					var w=_vu1._cA1;
					var _w5=_vu1._Bk1;
					var _fx=this._7A1.data[_i3];
					var _Z3=_wi1._Di1(_h3.__u1(_fx),this._8A1.data[_i3]);
					var _At=_wi1.Multiply(_IC1*_w5*w,_Z3);
					this._8A1.data[_i3]._ce(_wi1.Multiply(this._8C1(),_At));
					_h3._Nu1(_At._Ai1(),_fx,true);
				}
			}
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				if(_vu1._Bg1&_Ez1._Kz1)
				{
					var _i3=_vu1._Zm1;
					var _h3=_vu1.__m1;
					var w=_vu1._cA1;
					var _Z3=_wi1._Di1(this._8A1.data[_h3],this._8A1.data[_i3]);
					var _At=_wi1.Multiply(_IC1*w,_Z3);
					this._8A1.data[_i3]._ce(_At);
					this._8A1.data[_h3]._Di1(_At);
				}
			}
		}
		,_iC1:
function(step)
		{
			var _JC1=this._JA1*this._FC1(step);
			var _KC1=1.0-_8i1;
			for(var _ij=0;_ij<this._Yy1;_ij++)
			{
				var _vu1=this._Wy1[_ij];
				var _i3=_vu1.index;
				if(this._mA1.data[_i3]&_Ez1._Lz1)
				{
					var w=_vu1._cA1;
					if(w>_KC1)
					{
						var _h3=_vu1.body;
						var _w5=_vu1._Bk1;
						var _fx=this._7A1.data[_i3];
						var _u5=_vu1._Pk1;
						var _At=_wi1.Multiply(_JC1*_w5*(w-_KC1),_u5);
						this._8A1.data[_i3]._Di1(_wi1.Multiply(this._8C1(),_At));
						_h3._Nu1(_At,_fx,true);
					}
				}
			}
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				if(_vu1._Bg1&_Ez1._Lz1)
				{
					var w=_vu1._cA1;
					if(w>_KC1)
					{
						var _i3=_vu1._Zm1;
						var _h3=_vu1.__m1;
						var _u5=_vu1._Pk1;
						var _At=_wi1.Multiply(_JC1*(w-_KC1),_u5);
						this._8A1.data[_i3]._Di1(_At);
						this._8A1.data[_h3]._ce(_At);
					}
				}
			}
		}
		,_mC1:
function(step)
		{
			this._qA1=this._nB1(this._qA1);
			var _LC1=step._gw1*this._KA1;
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				var _i3=_vu1._Zm1;
				var _h3=_vu1.__m1;
				if(this._rA1[_i3]!=this._rA1[_h3])
				{
					var w=_vu1._cA1;
					var _u5=_vu1._Pk1;
					var h=this._qA1[_i3]+this._qA1[_h3];
					var _At=_wi1.Multiply(_LC1*h*w,_u5);
					this._8A1.data[_i3]._Di1(_At);
					this._8A1.data[_h3]._ce(_At);
				}
			}
		}
		,_nC1:
function(step)
		{
			this._4z1.data=this._nB1(this._4z1.data);
			var _MC1=Math.floor(256*this._LA1);
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				var _i3=_vu1._Zm1;
				var _h3=_vu1.__m1;
				if(this._mA1.data[_i3]&this._mA1.data[_h3]&_Ez1._Nz1)
				{
					var _NC1=this._4z1.data[_i3];
					var _OC1=this._4z1.data[_h3];
					var _PC1=(_MC1*(_OC1._f3-_NC1._f3))>>8;
					var _QC1=(_MC1*(_OC1._g3-_NC1._g3))>>8;
					var _RC1=(_MC1*(_OC1._h3-_NC1._h3))>>8;
					var _SC1=(_MC1*(_OC1._i3-_NC1._i3))>>8;
					_NC1._f3+=_PC1;
					_NC1._g3+=_QC1;
					_NC1._h3+=_RC1;
					_NC1._i3+=_SC1;
					_OC1._f3-=_PC1;
					_OC1._g3-=_QC1;
					_OC1._h3-=_RC1;
					_OC1._i3-=_SC1;
				}
			}
		}
		,_bC1:
function()
		{
			var _Ja1=0;
			var _TC1=new Array(this._il1);
			for(var i=0;i<this._il1;i++)
			{
				var _Bg1=this._mA1.data[i];
				if(_Bg1&_Ez1._Gz1)
				{
					var _UC1=this._Pt1._ww1;
					if((_Bg1&_Ez1._Oz1)&&_UC1)
					{
						_UC1._Yv1(i);
					}
					_TC1[i]=_7i1;
				}
				else 
				{
					_TC1[i]=_Ja1;
					if(i!=_Ja1)
					{
						this._mA1.data[_Ja1]=this._mA1.data[i];
						this._7A1.data[_Ja1]=this._7A1.data[i];
						this._8A1.data[_Ja1]=this._8A1.data[i];
						this._rA1[_Ja1]=this._rA1[i];
						if(this._qA1)
						{
							this._qA1[_Ja1]=this._qA1[i];
						}
						if(this._4z1.data)
						{
							this._4z1.data[_Ja1]=this._4z1.data[i];
						}
						if(this._sA1.data)
						{
							this._sA1.data[_Ja1]=this._sA1.data[i];
						}
					}
					_Ja1++;
				}
			}
			var _VC1=
			{
				_WC1:
function(_Rv1)
				{
					return _Rv1.index<0;
				}
				,_XC1:
function(_vu1)
				{
					return _vu1._Zm1<0||_vu1.__m1<0;
				}
				,_YC1:
function(_vu1)
				{
					return _vu1.index<0;
				}
				,_ZC1:
function(_Jm1)
				{
					return _Jm1._Zm1<0||_Jm1.__m1<0;
				}
				,__C1:
function(_EB1)
				{
					return _EB1._Zm1<0||_EB1.__m1<0||_EB1._SA1<0;
				}
			}
			;
			for(var _ij=0;_ij<this._hm1;_ij++)
			{
				var _Rv1=this._uA1[_ij];
				_Rv1.index=_TC1[_Rv1.index];
			}
			if(this._uA1)
			{
				this._hm1=this._uA1._kh1(_VC1._WC1,this._hm1);
			}
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				_vu1._Zm1=_TC1[_vu1._Zm1];
				_vu1.__m1=_TC1[_vu1.__m1];
			}
			if(this._Ty1)
			{
				this._Lx1=this._Ty1._kh1(_VC1._XC1,this._Lx1);
			}
			for(var _ij=0;_ij<this._Yy1;_ij++)
			{
				var _vu1=this._Wy1[_ij];
				_vu1.index=_TC1[_vu1.index];
			}
			if(this._Wy1)
			{
				this._Yy1=this._Wy1._kh1(_VC1._YC1,this._Yy1);
			}
			for(var _ij=0;_ij<this._im1;_ij++)
			{
				var _Jm1=this._jm1[_ij];
				_Jm1._Zm1=_TC1[_Jm1._Zm1];
				_Jm1.__m1=_TC1[_Jm1.__m1];
			}
			if(this._jm1)
			{
				this._im1=this._jm1._kh1(_VC1._ZC1,this._im1);
			}
			for(var _ij=0;_ij<this._xA1;_ij++)
			{
				var _EB1=this._zA1[_ij];
				_EB1._Zm1=_TC1[_EB1._Zm1];
				_EB1.__m1=_TC1[_EB1.__m1];
				_EB1._SA1=_TC1[_EB1._SA1];
			}
			if(this._zA1)
			{
				this._xA1=this._zA1._kh1(_VC1.__C1,this._xA1);
			}
			for(var _v_=this._BA1;_v_;_v_=_v_._ov1())
			{
				var _tB1=_Ja1;
				var lastIndex=0;
				var _0D1=false;
				for(var i=_v_._Uz1;i<_v_._Vz1;i++)
				{
					var _05=_TC1[i];
					if(_05>=0)
					{
						_tB1=_Uj1(_tB1,_05);
						lastIndex=_Wj1(lastIndex,_05+1);
					}
					else 
					{
						_0D1=true;
					}
				}
				if(_tB1<lastIndex)
				{
					_v_._Uz1=_tB1;
					_v_._Vz1=lastIndex;
					if(_0D1)
					{
						if(_v_._Wz1&_Sz1._aA1)
						{
							_v_._3A1=true;
						}
					}
				}
				else 
				{
					_v_._Uz1=0;
					_v_._Vz1=0;
					if(_v_._1A1)
					{
						_v_._2A1=true;
					}
				}
			}
			this._il1=_Ja1;
			for(var _v_=this._BA1;_v_;)
			{
				var _gj=_v_._ov1();
				if(_v_._2A1)
				{
					this._JB1(_v_);
				}
				_v_=_gj;
			}
		}
		,_HB1:
function(start,_Tg,end)
		{
			if(start==_Tg||_Tg==end)
			{
				return;
			}

			function _TC1(i)
			{
				if(i<start)
				{
					return i;
				}
				else if(i<_Tg)
				{
					return i+end-_Tg;
				}
				else if(i<end)
				{
					return i+start-_Tg;
				}
				else 
				{
					return i;
				}
			}
			this._mA1.data.rotate(start,_Tg,end);
			this._7A1.data.rotate(start,_Tg,end);
			this._8A1.data.rotate(start,_Tg,end);
			this._rA1.rotate(start,_Tg,end);
			if(this._qA1)
			{
				this._qA1.rotate(start,_Tg,end);
			}
			if(this._4z1.data)
			{
				this._4z1.data.rotate(start,_Tg,end);
			}
			if(this._sA1.data)
			{
				this._sA1.data.rotate(start,_Tg,end);
			}
			for(var _ij=0;_ij<this._hm1;_ij++)
			{
				var _Rv1=this._uA1[_ij];
				_Rv1.index=_TC1(_Rv1.index);
			}
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				_vu1._Zm1=_TC1(_vu1._Zm1);
				_vu1.__m1=_TC1(_vu1.__m1);
			}
			for(var _ij=0;_ij<this._Yy1;_ij++)
			{
				var _vu1=this._Wy1[_ij];
				_vu1.index=_TC1(_vu1.index);
			}
			for(var _ij=0;_ij<this._im1;_ij++)
			{
				var _Jm1=this._jm1[_ij];
				_Jm1._Zm1=_TC1(_Jm1._Zm1);
				_Jm1.__m1=_TC1(_Jm1.__m1);
			}
			for(var _ij=0;_ij<this._xA1;_ij++)
			{
				var _EB1=this._zA1[_ij];
				_EB1._Zm1=_TC1(_EB1._Zm1);
				_EB1.__m1=_TC1(_EB1.__m1);
				_EB1._SA1=_TC1(_EB1._SA1);
			}
			for(var _v_=this._BA1;_v_;_v_=_v_._ov1())
			{
				_v_._Uz1=_TC1(_v_._Uz1);
				_v_._Vz1=_TC1(_v_._Vz1-1)+1;
			}
		}
		,_i_:
function(_MZ)
		{
			this._hA1=2*_MZ;
			this._jA1=this._hA1*this._hA1;
			this._iA1=1/this._hA1;
		}
		,_k_:
function(_j_)
		{
			this._qu1=_j_;
			this._gA1=1/this._qu1;
		}
		,_e_:
function()
		{
			return this._qu1;
		}
		,_n_:
function(_Ft1)
		{
			this.__t1=_Ft1;
		}
		,_g_:
function()
		{
			return this.__t1;
		}
		,_m_:
function(_l_)
		{
			this._DA1=_l_;
		}
		,_f_:
function()
		{
			return this._DA1;
		}
		,_d_:
function()
		{
			return this._hA1/2;
		}
		,_FC1:
function(step)
		{
			return this._hA1*step._gw1;
		}
		,_dC1:
function(step)
		{
			var _a31=this._FC1(step);
			return _a31*_a31;
		}
		,_uC1:
function(step)
		{
			return this._qu1*this._dC1(step);
		}
		,_sB1:
function()
		{
			return _8i1*this._hA1;
		}
		,_6A1:
function()
		{
			var _K9=this._sB1();
			return this._qu1*_K9*_K9;
		}
		,_8C1:
function()
		{
			return 1.777777*this._gA1*this._iA1*this._iA1;
		}
		,_Gy1:
function()
		{
			return this._mA1.data;
		}
		,_Hy1:
function()
		{
			return this._7A1.data;
		}
		,_Iy1:
function()
		{
			return this._8A1.data;
		}
		,_Jy1:
function()
		{
			this._4z1.data=this._nB1(this._4z1.data);
			return this._4z1.data;
		}
		,_Ky1:
function()
		{
			this._sA1.data=this._nB1(this._sA1.data);
			return this._sA1.data;
		}
		,_c_:
function()
		{
			return this._lA1;
		}
		,_h_:
function(_u7)
		{
			_Ih1(this._il1<=_u7);
			this._lA1=_u7;
		}
		,_Ly1:
function()
		{
			return this._rA1;
		}
		,_1D1:
function(buffer,_2D1,_iB1)
		{
			_Ih1((_2D1&&_iB1)||(!_2D1&&!_iB1));
			buffer.data=_2D1;
			buffer._MA1=_iB1;
		}
		,_My1:
function(buffer,_Ny1)
		{
			this._1D1(this._mA1,buffer,_Ny1);
		}
		,_Oy1:
function(buffer,_Ny1)
		{
			this._1D1(this._7A1,buffer,_Ny1);
		}
		,_Py1:
function(buffer,_Ny1)
		{
			this._1D1(this._8A1,buffer,_Ny1);
		}
		,_Qy1:
function(buffer,_Ny1)
		{
			this._1D1(this._4z1,buffer,_Ny1);
		}
		,_Ry1:
function(buffer,_Ny1)
		{
			this._1D1(this._sA1,buffer,_Ny1);
		}
		,_vx1:
function(_Ae1,_Kk1)
		{
			if(this._hm1==0)
			{
				return;
			}
			var _SB1=0;
			var _TB1=this._hm1;
			var _3C1=this._uA1._mh1(_SB1,_TB1,_aB1(this._iA1*_Kk1._Yk1.x,this._iA1*_Kk1._Yk1.y),
function(_i3,_h3)
			{
				return _Nw1.Proxy._PA1(_i3,_h3);
			}
			);
			var _4C1=this._uA1._oh1(_3C1,_TB1,_aB1(this._iA1*_Kk1._Zk1.x,this._iA1*_Kk1._Zk1.y),
function(_i3,_h3)
			{
				return _Nw1.Proxy._OA1(_i3,_h3);
			}
			);
			for(var _Rv1=_3C1;_Rv1<_4C1;
++_Rv1)
			{
				var _5C1=this._uA1[_Rv1];
				var i=_5C1.index;
				var _fx=this._7A1.data[i];
				if(_Kk1._Yk1.x<_fx.x&&_fx.x<_Kk1._Zk1.x&&_Kk1._Yk1.y<_fx.y&&_fx.y<_Kk1._Zk1.y)
				{
					if(!_Ae1._dw1(i))
					{
						break;
					}
				}
			}
		}
		,_Hk1:
function(_Ae1,_xx1,_yx1)
		{
			if(this._hm1==0)
			{
				return;
			}
			var _SB1=0;
			var _TB1=this._hm1;
			var _3C1=this._uA1._mh1(_SB1,_TB1,_aB1(this._iA1*_Uj1(_xx1.x,_yx1.x)-1,this._iA1*_Uj1(_xx1.y,_yx1.y)-1),
function(_i3,_h3)
			{
				return _Nw1.Proxy._PA1(_i3,_h3);
			}
			);
			var _4C1=this._uA1._oh1(_SB1,_TB1,_aB1(this._iA1*_Wj1(_xx1.x,_yx1.x)+1,this._iA1*_Wj1(_xx1.y,_yx1.y)+1),
function(_i3,_h3)
			{
				return _Nw1.Proxy._OA1(_i3,_h3);
			}
			);
			var _T_=1;
			var _Z3=_wi1._Di1(_yx1,_xx1);
			var _04=_sj1(_Z3,_Z3);
			for(var _Rv1=_3C1;_Rv1<_4C1;++_Rv1)
			{
				var _5C1=this._uA1[_Rv1];
				var i=_5C1.index;
				var _fx=_wi1._Di1(_xx1,this._7A1.data[i]);
				var _3D1=_sj1(_fx,_Z3);
				var _ik1=_sj1(_fx,_fx);
				var _4D1=_3D1*_3D1-_04*(_ik1-this._jA1);
				if(_4D1>=0)
				{
					var _5D1=_ti1(_4D1);
					var _K5=(-_3D1-_5D1)/_04;
					if(_K5>_T_)
					{
						continue;
					}
					if(_K5<0)
					{
						_K5=(-_3D1+_5D1)/_04;
						if(_K5<0||_K5>_T_)
						{
							continue;
						}
					}
					var _u5=_wi1._ce(_fx,_wi1._Di1(_K5,_Z3));
					_u5._Fi1();
					var _At=_Ae1._dw1(i,_wi1._ce(_xx1,_wi1.Multiply(_K5,_Z3)),_u5,_K5);
					_T_=_Uj1(_T_,_At);
					if(_T_<=0)
					{
						break;
					}
				}
			}
		}
		,_Zy1:
function()
		{
			var _6D1=0;
			for(var _ij=0;_ij<this._Lx1;_ij++)
			{
				var _vu1=this._Ty1[_ij];
				var _i3=_vu1._Zm1;
				var _h3=_vu1.__m1;
				var _u5=_vu1._Pk1;
				var _Z3=_wi1._Di1(this._8A1.data[_h3],this._8A1.data[_i3]);
				var _wC1=_sj1(_Z3,_u5);
				if(_wC1<0)
				{
					_6D1+=_wC1*_wC1;
				}
			}
			return 0.5*this._6A1()*_6D1;
		}
		,__y1:
function()
		{
			return this._BA1;
		}
		,_w_:
function()
		{
			return this._AA1;
		}
		,_9_:
function()
		{
			return this._il1;
		}
	}
	;

	function _7D1(_8D1,_9D1)
	{
		return _ti1(_8D1*_9D1);
	}

	function _aD1(_bD1,_cD1)
	{
		return _bD1>_cD1?_bD1:_cD1;
	}

	function _dD1()
	{
		this._kt1=null;
		this._eD1=false;
	}
	;

	function _fD1()
	{
		this.other=null;
		this._vu1=null;
		this._ej=null;
		this._gj=null;
	}
	;

	function _Qx1()
	{
		this._gD1=new _fD1();
		this._hD1=new _fD1();
		this._iD1=new _po1();
	}
	_Qx1._jD1=new _po1();
	_Qx1.prototype=
	{
		_981:
function(_8y1,_Zm1,_9y1,__m1)
		{
			this._5y1=0;
			this._Jt1=_Qx1._kD1;
			this._Zx1=_8y1||null;
			this._0y1=_9y1||null;
			this._lD1=_Zm1||0;
			this._mD1=__m1||0;
			this._iD1._ro1=0;
			this._Ut1=null;
			this._Vt1=null;
			this._gD1._vu1=null;
			this._gD1._ej=null;
			this._gD1._gj=null;
			this._gD1.other=null;
			this._hD1._vu1=null;
			this._hD1._ej=null;
			this._hD1._gj=null;
			this._hD1.other=null;
			this._4y1=0;
			if(_8y1)
			{
				this._Fv1=_7D1(this._Zx1._Fv1,this._0y1._Fv1);
				this._Gv1=_aD1(this._Zx1._Gv1,this._0y1._Gv1);
			}
			else 
			{
				this._Fv1=0;
				this._Gv1=0;
			}
			this._nD1=0.0;
		}
		,_oD1:
function()
		{
			return this._iD1;
		}
		,_pD1:
function(_qD1)
		{
			var _cx1=this._Zx1._Ov1();
			var _dx1=this._0y1._Ov1();
			var _zr1=this._Zx1._Hv1();
			var _Ar1=this._0y1._Hv1();
			_qD1._Co1(this._iD1,_cx1._oj1(),_zr1._Ek1,_dx1._oj1(),_Ar1._Ek1);
		}
		,_Xx1:
function()
		{
			return(this._Jt1&_Qx1._rD1)==_Qx1._rD1;
		}
		,_gy1:
function(_cv1)
		{
			if(_cv1)
			{
				this._Jt1|=_Qx1._kD1;
			}
			else 
			{
				this._Jt1&=~_Qx1._kD1;
			}
		}
		,_Wx1:
function()
		{
			return(this._Jt1&_Qx1._kD1)==_Qx1._kD1;
		}
		,_ov1:
function()
		{
			return this._Vt1;
		}
		,_xu1:
function()
		{
			return this._Zx1;
		}
		,_px1:
function()
		{
			return this._lD1;
		}
		,_zu1:
function()
		{
			return this._0y1;
		}
		,_rx1:
function()
		{
			return this._mD1;
		}
		,_JX:
function(friction)
		{
			this._Fv1=friction;
		}
		,_DZ:
function()
		{
			return this._Fv1;
		}
		,_sD1:
function()
		{
			this._Fv1=_7D1(this._Zx1._Fv1,this._0y1._Fv1);
		}
		,_HX:
function(_zv1)
		{
			this._Gv1=_zv1;
		}
		,_FZ:
function()
		{
			return this._Gv1;
		}
		,_tD1:
function()
		{
			this._Gv1=_aD1(this._Zx1._Gv1,this._0y1._Gv1);
		}
		,_uD1:
function(speed)
		{
			this._nD1=speed;
		}
		,_vD1:
function()
		{
			return this._nD1;
		}
		,_7k:
function(_so1,_Do1,_Fo1)
		{
		}
		,_Nv1:
function()
		{
			this._Jt1|=_Qx1._wD1;
		}
		,_xD1:null,_te:
function(listener)
		{
			_Qx1._jD1._PG(this._iD1);
			this._Jt1|=_Qx1._kD1;
			var _yD1=false;
			var _zD1=(this._Jt1&_Qx1._rD1)==_Qx1._rD1;
			var _Yx1=this._Zx1._Jv1();
			var __x1=this._0y1._Jv1();
			var _Iv1=_Yx1||__x1;
			var _cx1=this._Zx1._Ov1();
			var _dx1=this._0y1._Ov1();
			var _Do1=_cx1._oj1();
			var _Fo1=_dx1._oj1();
			if(_Iv1)
			{
				var _zr1=this._Zx1._Hv1();
				var _Ar1=this._0y1._Hv1();
				_yD1=_yr1(_zr1,this._lD1,_Ar1,this._mD1,_Do1,_Fo1);
				this._iD1._ro1=0;
			}
			else 
			{
				this._7k(this._iD1,_Do1,_Fo1);
				_yD1=this._iD1._ro1>0;
				for(var i=0;i<this._iD1._ro1;++i)
				{
					var _AD1=this._iD1.points[i];
					_AD1._mo1=0.0;
					_AD1._no1=0.0;
					var _BD1=_AD1.id;
					for(var _05=0;_05<_Qx1._jD1._ro1;++_05)
					{
						var _CD1=_Qx1._jD1.points[_05];
						if(_CD1.id._F4()==_BD1._F4())
						{
							_AD1._mo1=_CD1._mo1;
							_AD1._no1=_CD1._no1;
							break;
						}
					}
				}
				if(_yD1!=_zD1)
				{
					_cx1._SX(true);
					_dx1._SX(true);
				}
			}
			if(_yD1)
			{
				this._Jt1|=_Qx1._rD1;
			}
			else 
			{
				this._Jt1&=~_Qx1._rD1;
			}
			if(_zD1==false&&_yD1==true&&listener)
			{
				listener._6w1(this);
			}
			if(_zD1==true&&_yD1==false&&listener)
			{
				listener._7w1(this);
			}
			if(_Iv1==false&&_yD1&&listener)
			{
				listener._8w1(this,_Qx1._jD1);
			}
		}
	}
	;
	_Qx1._cu1=0x0001;
	_Qx1._rD1=0x0002;
	_Qx1._kD1=0x0004;
	_Qx1._wD1=0x0008;
	_Qx1._DD1=0x0010;
	_Qx1._du1=0x0020;

	function _ED1()
	{
		this.parent.call(this);
	}
	_ED1.prototype=
	{
		_7k:
function(_so1,_Do1,_Fo1)
		{
			_fp1(_so1,this._Zx1._Hv1(),_Do1,this._0y1._Hv1(),_Fo1);
		}
		,_981:
function(_wu1,_FD1,_yu1,_GD1)
		{
			this.parent.prototype._981.call(this,_wu1,0,_yu1,0);
			_Ih1(this._Zx1._9e1()==_Dk1._Qk1);
			_Ih1(this._0y1._9e1()==_Dk1._Qk1);
		}
	}
	;
	_ED1._fh1(_Qx1);
	var _HD1=new _2l1();

	function _ID1()
	{
		this.parent.call(this);
	}
	_ID1.prototype=
	{
		_7k:
function(_so1,_Do1,_Fo1)
		{
			var _Um1=this._Zx1._Hv1();
			_Um1._ul1(_HD1,this._lD1);
			_oq1(_so1,_HD1,_Do1,this._0y1._Hv1(),_Fo1);
		}
		,_981:
function(_wu1,_Zm1,_yu1,__m1)
		{
			this.parent.prototype._981.call(this,_wu1,_Zm1,_yu1,__m1);
			_Ih1(this._Zx1._9e1()==_Dk1._Tk1);
			_Ih1(this._0y1._9e1()==_Dk1._Qk1);
		}
	}
	;
	_ID1._fh1(_Qx1);

	function _JD1()
	{
		this.parent.call(this);
	}
	_JD1.prototype=
	{
		_7k:
function(_so1,_Do1,_Fo1)
		{
			var _Um1=this._Zx1._Hv1();
			_Um1._ul1(_HD1,this._lD1);
			_pr1(_so1,_HD1,_Do1,this._0y1._Hv1(),_Fo1);
		}
		,_981:
function(_wu1,_Zm1,_yu1,__m1)
		{
			this.parent.prototype._981.call(this,_wu1,_Zm1,_yu1,__m1);
			_Ih1(this._Zx1._9e1()==_Dk1._Tk1);
			_Ih1(this._0y1._9e1()==_Dk1._Sk1);
		}
	}
	;
	_JD1._981=
function(_wu1,_Zm1,_yu1,__m1)
	{
		return new _JD1(_wu1,_Zm1,_yu1,__m1);
	}
	;
	_JD1._fh1(_Qx1);

	function _KD1()
	{
		this.parent.call(this);
	}
	_KD1.prototype=
	{
		_7k:
function(_so1,_Do1,_Fo1)
		{
			_oq1(_so1,this._Zx1._Hv1(),_Do1,this._0y1._Hv1(),_Fo1);
		}
		,_981:
function(_wu1,_Zm1,_yu1,__m1)
		{
			this.parent.prototype._981.call(this,_wu1,0,_yu1,0);
			_Ih1(this._Zx1._9e1()==_Dk1._Rk1);
			_Ih1(this._0y1._9e1()==_Dk1._Qk1);
		}
	}
	;
	_KD1._981=
function(_wu1,_Zm1,_yu1,__m1)
	{
		return new _KD1(_wu1,_yu1);
	}
	;
	_KD1._fh1(_Qx1);

	function _LD1()
	{
		this.parent.call(this);
	}
	_LD1.prototype=
	{
		_7k:
function(_so1,_Do1,_Fo1)
		{
			_pr1(_so1,this._Zx1._Hv1(),_Do1,this._0y1._Hv1(),_Fo1);
		}
		,_981:
function(_wu1,_Zm1,_yu1,__m1)
		{
			this.parent.prototype._981.call(this,_wu1,0,_yu1,0);
			_Ih1(this._Zx1._9e1()==_Dk1._Rk1);
			_Ih1(this._0y1._9e1()==_Dk1._Sk1);
		}
	}
	;
	_LD1._981=
function(_wu1,_Zm1,_yu1,__m1)
	{
		return new _LD1(_wu1,_yu1);
	}
	;
	_LD1._fh1(_Qx1);

	function _MD1()
	{
		this.parent.call(this);
	}
	_MD1.prototype=
	{
		_7k:
function(_so1,_Do1,_Fo1)
		{
			_jp1(_so1,this._Zx1._Hv1(),_Do1,this._0y1._Hv1(),_Fo1);
		}
		,_981:
function(_wu1,_Zm1,_yu1,__m1)
		{
			this.parent.prototype._981.call(this,_wu1,0,_yu1,0);
			_Ih1(this._Zx1._9e1()==_Dk1._Sk1);
			_Ih1(this._0y1._9e1()==_Dk1._Qk1);
		}
	}
	;
	_MD1._981=
function(_wu1,_Zm1,_yu1,__m1)
	{
		return new _MD1(_wu1,_yu1);
	}
	;
	_MD1._fh1(_Qx1);

	function _ND1()
	{
		this.parent.call(this);
	}
	_ND1.prototype=
	{
		_7k:
function(_so1,_Do1,_Fo1)
		{
			_Up1(_so1,this._Zx1._Hv1(),_Do1,this._0y1._Hv1(),_Fo1);
		}
		,_981:
function(_wu1,_Zm1,_yu1,__m1)
		{
			this.parent.prototype._981.call(this,_wu1,0,_yu1,0);
			_Ih1(this._Zx1._9e1()==_Dk1._Sk1);
			_Ih1(this._0y1._9e1()==_Dk1._Sk1);
		}
	}
	;
	_ND1._981=
function(_wu1,_Zm1,_yu1,__m1)
	{
		return new _ND1(_wu1,_yu1);
	}
	;
	_ND1._fh1(_Qx1);
	_Qx1._OD1=
function(_kt1,_PD1,_QD1)
	{
		_Ih1(0<=_PD1&&_PD1<_Dk1._Uk1);
		_Ih1(0<=_QD1&&_QD1<_Dk1._Uk1);
		if(!_Qx1._RD1[_PD1])_Qx1._RD1[_PD1]=[];
		_Qx1._RD1[_PD1][_QD1]=new _dD1();
		_Qx1._RD1[_PD1][_QD1]._kt1=_kt1;
		_Qx1._RD1[_PD1][_QD1]._eD1=true;
		if(_PD1!=_QD1)
		{
			if(!_Qx1._RD1[_QD1])_Qx1._RD1[_QD1]=[];
			_Qx1._RD1[_QD1][_PD1]=new _dD1();
			_Qx1._RD1[_QD1][_PD1]._kt1=_kt1;
			_Qx1._RD1[_QD1][_PD1]._eD1=false;
		}
		_kt1._SD1=[];
		_kt1._TD1=2;
	}
	;
	_Qx1._UD1=
function()
	{
		_Qx1._OD1(_ED1,_Dk1._Qk1,_Dk1._Qk1);
		_Qx1._OD1(_MD1,_Dk1._Sk1,_Dk1._Qk1);
		_Qx1._OD1(_ND1,_Dk1._Sk1,_Dk1._Sk1);
		_Qx1._OD1(_KD1,_Dk1._Rk1,_Dk1._Qk1);
		_Qx1._OD1(_LD1,_Dk1._Rk1,_Dk1._Sk1);
		_Qx1._OD1(_ID1,_Dk1._Tk1,_Dk1._Qk1);
		_Qx1._OD1(_JD1,_Dk1._Tk1,_Dk1._Sk1);
	}
	;
	_Qx1._VD1=
function(_kt1)
	{
		var _vu1;
		if(_vu1=_kt1._SD1.pop())return _vu1;
		for(var i=0;i<_kt1._TD1-1;++i)_kt1._SD1.push(new _kt1());

				{
			_kt1._TD1+=32;
		}
		return new _kt1();
	}
	;
	_Qx1._981=
function(_wu1,_Zm1,_yu1,__m1)
	{
		if(_Qx1._WD1==false)
		{
			_Qx1._UD1();
			_Qx1._WD1=true;
		}
		var _PD1=_wu1._9e1();
		var _QD1=_yu1._9e1();
		_Ih1(0<=_PD1&&_PD1<_Dk1._Uk1);
		_Ih1(0<=_QD1&&_QD1<_Dk1._Uk1);
		var _kt1=_Qx1._RD1[_PD1]?_Qx1._RD1[_PD1][_QD1]?_Qx1._RD1[_PD1][_QD1]._kt1:null:null;
		if(_kt1)
		{
			var _vu1=_Qx1._VD1(_kt1);
			if(_Qx1._RD1[_PD1][_QD1]._eD1)_vu1._981(_wu1,_Zm1,_yu1,__m1);
			else _vu1._981(_yu1,__m1,_wu1,_Zm1);
			return _vu1;
		}
		return null;
	}
	;
	_Qx1._Ne1=
function(_vu1)
	{
		_Ih1(_Qx1._WD1==true);
		var _wu1=_vu1._Zx1;
		var _yu1=_vu1._0y1;
		if(_vu1._iD1._ro1>0&&_wu1._Jv1()==false&&_yu1._Jv1()==false)
		{
			_wu1._Ov1()._SX(true);
			_yu1._Ov1()._SX(true);
		}
		var _go1=_wu1._9e1();
		var _ho1=_yu1._9e1();
		_Ih1(0<=_go1&&_ho1<_Dk1._Uk1);
		_Ih1(0<=_go1&&_ho1<_Dk1._Uk1);
		_Qx1._RD1[_go1][_ho1]._kt1._SD1.push(_vu1);
	}
	;
	_Qx1._RD1=[];
	_Qx1._WD1=false;
	var _XD1=new _Zv1();
	var _YD1=new _5w1();

	function _vw1()
	{
		this._nu1=new _dm1();
		this._Tt1=null;
		this._Lx1=0;
		this._Xw1=_XD1;
		this._Zw1=_YD1;
	}
	_vw1.prototype=
	{
		_Im1:
function(_ZD1,__D1)
		{
			var _1n1=_ZD1;
			var _2n1=__D1;
			var _wu1=_1n1._CX;
			var _yu1=_2n1._CX;
			var _Zm1=_1n1._Ik1;
			var __m1=_2n1._Ik1;
			var _cx1=_wu1._Ov1();
			var _dx1=_yu1._Ov1();
			if(_cx1==_dx1)
			{
				return;
			}
			var _vl1=_dx1._nv1();
			while(_vl1) 
			{
				if(_vl1.other==_cx1)
				{
					var _8y1=_vl1._vu1._xu1();
					var _9y1=_vl1._vu1._zu1();
					var _ws1=_vl1._vu1._px1();
					var _xs1=_vl1._vu1._rx1();
					if(_8y1==_wu1&&_9y1==_yu1&&_ws1==_Zm1&&_xs1==__m1)
					{
						return;
					}
					if(_8y1==_yu1&&_9y1==_wu1&&_ws1==__m1&&_xs1==_Zm1)
					{
						return;
					}
				}
				_vl1=_vl1._gj;
			}
			if(_dx1._sv1(_cx1)==false)
			{
				return;
			}
			if(this._Xw1&&this._Xw1._sv1(_wu1,_yu1)==false)
			{
				return;
			}
			var c=_Qx1._981(_wu1,_Zm1,_yu1,__m1);
			if(c==null)
			{
				return;
			}
			_wu1=c._xu1();
			_yu1=c._zu1();
			_Zm1=c._px1();
			__m1=c._rx1();
			_cx1=_wu1._Ov1();
			_dx1=_yu1._Ov1();
			c._Ut1=null;
			c._Vt1=this._Tt1;
			if(this._Tt1!=null)
			{
				this._Tt1._Ut1=c;
			}
			this._Tt1=c;
			c._gD1._vu1=c;
			c._gD1.other=_dx1;
			c._gD1._ej=null;
			c._gD1._gj=_cx1._Tt1;
			if(_cx1._Tt1!=null)
			{
				_cx1._Tt1._ej=c._gD1;
			}
			_cx1._Tt1=c._gD1;
			c._hD1._vu1=c;
			c._hD1.other=_cx1;
			c._hD1._ej=null;
			c._hD1._gj=_dx1._Tt1;
			if(_dx1._Tt1!=null)
			{
				_dx1._Tt1._ej=c._hD1;
			}
			_dx1._Tt1=c._hD1;
			if(_wu1._Jv1()==false&&_yu1._Jv1()==false)
			{
				_cx1._SX(true);
				_dx1._SX(true);
			}
			++this._Lx1;
		}
		,_gx1:
function()
		{
			this._nu1._Bm1(this);
		}
		,_Ne1:
function(c)
		{
			var _wu1=c._xu1();
			var _yu1=c._zu1();
			var _cx1=_wu1._Ov1();
			var _dx1=_yu1._Ov1();
			if(this._Zw1&&c._Xx1())
			{
				this._Zw1._7w1(c);
			}
			if(c._Ut1)
			{
				c._Ut1._Vt1=c._Vt1;
			}
			if(c._Vt1)
			{
				c._Vt1._Ut1=c._Ut1;
			}
			if(c==this._Tt1)
			{
				this._Tt1=c._Vt1;
			}
			if(c._gD1._ej)
			{
				c._gD1._ej._gj=c._gD1._gj;
			}
			if(c._gD1._gj)
			{
				c._gD1._gj._ej=c._gD1._ej;
			}
			if(c._gD1==_cx1._Tt1)
			{
				_cx1._Tt1=c._gD1._gj;
			}
			if(c._hD1._ej)
			{
				c._hD1._ej._gj=c._hD1._gj;
			}
			if(c._hD1._gj)
			{
				c._hD1._gj._ej=c._hD1._ej;
			}
			if(c._hD1==_dx1._Tt1)
			{
				_dx1._Tt1=c._hD1._gj;
			}
			_Qx1._Ne1(c);
			--this._Lx1;
		}
		,_3r1:
function()
		{
			var c=this._Tt1;
			while(c) 
			{
				var _wu1=c._xu1();
				var _yu1=c._zu1();
				var _Zm1=c._px1();
				var __m1=c._rx1();
				var _cx1=_wu1._Ov1();
				var _dx1=_yu1._Ov1();
				if(c._Jt1&_Qx1._wD1)
				{
					if(_dx1._sv1(_cx1)==false)
					{
						var _0E1=c;
						c=_0E1._ov1();
						this._Ne1(_0E1);
						continue;
					}
					if(this._Xw1&&this._Xw1._sv1(_wu1,_yu1)==false)
					{
						var _0E1=c;
						c=_0E1._ov1();
						this._Ne1(_0E1);
						continue;
					}
					c._Jt1&=~_Qx1._wD1;
				}
				var _cy1=_cx1._gv1()&&_cx1._yF!=_vt1._wt1;
				var _dy1=_dx1._gv1()&&_dx1._yF!=_vt1._wt1;
				if(_cy1==false&&_dy1==false)
				{
					c=c._ov1();
					continue;
				}
				var _8m1=_wu1._av1[_Zm1]._om1;
				var _9m1=_yu1._av1[__m1]._om1;
				var _1E1=this._nu1._AZ(_8m1,_9m1);
				if(_1E1==false)
				{
					var _0E1=c;
					c=_0E1._ov1();
					this._Ne1(_0E1);
					continue;
				}
				c._te(this._Zw1);
				c=c._ov1();
			}
		}
	}
	;

	function _2E1()
	{
		this._co1=new _wi1();
		this._do1=new _wi1();
		this._mo1=0;
		this._no1=0;
		this._3E1=0;
		this._4E1=0;
		this._5E1=0;
	}

	function _6E1()
	{
		this._7E1=new Array(_Nh1);
		this._qo1=new _wi1();
		this._lo1=new _wi1();
		this._Zm1=0;
		this.__m1=0;
		this._8E1=0,this._9E1=0;
		this._aE1=new _wi1(),this._bE1=new _wi1();
		this._cE1=0,this._dE1=0;
		this.type=0;
		this._Eo1=0,this._Go1=0;
		this._ro1=0;
	}
	;

	function _eE1()
	{
		this.points=new Array(_Nh1);
		for(var i=0;i<this.points.length;++i)this.points[i]=new _2E1();
		this._Pk1=new _wi1();
		this._3E1=new _Oi1();
		this._fE1=new _Oi1();
		this._Zm1=0;
		this.__m1=0;
		this._8E1=0,this._9E1=0;
		this._cE1=0,this._dE1=0;
		this.friction=0;
		this._zv1=0;
		this._gE1=0;
		this._ro1=0;
		this._hE1=0;
	}

	function _iE1()
	{
		this._Pk1=new _wi1();
		this._oo1=new _wi1();
		this._np1=0;
	}
	_iE1.prototype=
	{
		_Co1:
function(_Dz1,_Do1,_Fo1,index)
		{
			_Ih1(_Dz1._ro1>0);
			switch(_Dz1.type)
			{
				case _po1._to1:
				{
					var _Ho1=(_Do1.q.c*_Dz1._lo1.x-_Do1.q._hg*_Dz1._lo1.y)+_Do1._fx.x;
					var _Io1=(_Do1.q._hg*_Dz1._lo1.x+_Do1.q.c*_Dz1._lo1.y)+_Do1._fx.y;
					var _Jo1=(_Fo1.q.c*_Dz1._7E1[0].x-_Fo1.q._hg*_Dz1._7E1[0].y)+_Fo1._fx.x;
					var _Ko1=(_Fo1.q._hg*_Dz1._7E1[0].x+_Fo1.q.c*_Dz1._7E1[0].y)+_Fo1._fx.y;
					this._oo1.x=0.5*(_Ho1+_Jo1);
					this._oo1.y=0.5*(_Io1+_Ko1);
					this._Pk1.x=_Jo1-_Ho1;
					this._Pk1.y=_Ko1-_Io1;
					var _jE1=this._Pk1.x;
					var _kE1=this._Pk1.y;
					this._Pk1._Fi1();
					this._np1=(_jE1*this._Pk1.x+_kE1*this._Pk1.y)-_Dz1._Eo1-_Dz1._Go1;
				}
				break;
				case _po1._uo1:
				{
					this._Pk1.x=_Do1.q.c*_Dz1._qo1.x-_Do1.q._hg*_Dz1._qo1.y;
					this._Pk1.y=_Do1.q._hg*_Dz1._qo1.x+_Do1.q.c*_Dz1._qo1.y;
					var _Po1=(_Do1.q.c*_Dz1._lo1.x-_Do1.q._hg*_Dz1._lo1.y)+_Do1._fx.x;
					var _Qo1=(_Do1.q._hg*_Dz1._lo1.x+_Do1.q.c*_Dz1._lo1.y)+_Do1._fx.y;
					var _Ro1=(_Fo1.q.c*_Dz1._7E1[index].x-_Fo1.q._hg*_Dz1._7E1[index].y)+_Fo1._fx.x;
					var _So1=(_Fo1.q._hg*_Dz1._7E1[index].x+_Fo1.q.c*_Dz1._7E1[index].y)+_Fo1._fx.y;
					this._np1=((_Ro1-_Po1)*this._Pk1.x+(_So1-_Qo1)*this._Pk1.y)-_Dz1._Eo1-_Dz1._Go1;
					this._oo1.x=_Ro1;
					this._oo1.y=_So1;
				}
				break;
				case _po1._vo1:
				{
					this._Pk1.x=_Fo1.q.c*_Dz1._qo1.x-_Fo1.q._hg*_Dz1._qo1.y;
					this._Pk1.y=_Fo1.q._hg*_Dz1._qo1.x+_Fo1.q.c*_Dz1._qo1.y;
					var _Po1=(_Fo1.q.c*_Dz1._lo1.x-_Fo1.q._hg*_Dz1._lo1.y)+_Fo1._fx.x;
					var _Qo1=(_Fo1.q._hg*_Dz1._lo1.x+_Fo1.q.c*_Dz1._lo1.y)+_Fo1._fx.y;
					var _Ro1=(_Do1.q.c*_Dz1._7E1[index].x-_Do1.q._hg*_Dz1._7E1[index].y)+_Do1._fx.x;
					var _So1=(_Do1.q._hg*_Dz1._7E1[index].x+_Do1.q.c*_Dz1._7E1[index].y)+_Do1._fx.y;
					this._np1=((_Ro1-_Po1)*this._Pk1.x+(_So1-_Qo1)*this._Pk1.y)-_Dz1._Eo1-_Dz1._Go1;
					this._oo1.x=_Ro1;
					this._oo1.y=_So1;
					this._Pk1.x=-this._Pk1.x;
					this._Pk1.y=-this._Pk1.y;
				}
				break;
			}
		}
	}
	;

	function _lE1()
	{
		this.step=new _fw1();
		this._mE1=null;
		this._u7=0;
		this._ow1=null;
		this._pw1=null;
	}

	function _nE1()
	{
		this._oE1=[];
		this._pE1=[];
	}
	_nE1._qE1=new _gj1();
	_nE1._rE1=new _gj1();
	_nE1._sE1=new _iE1();
	_nE1.prototype=
	{
		_FJ:
function(_hu1)
		{
			this._rC1=_hu1.step;
			this._il1=_hu1._u7;
			this._oE1.length=this._il1;
			this._pE1.length=this._il1;
			this._tE1=_hu1._ow1;
			this._uE1=_hu1._pw1;
			this._vE1=_hu1._mE1;
			for(var i=0;i<this._il1;++i)
			{
				var _vu1=this._vE1[i];
				var _wu1=_vu1._Zx1;
				var _yu1=_vu1._0y1;
				var _zr1=_wu1._Hv1();
				var _Ar1=_yu1._Hv1();
				var _Eo1=_zr1._Ek1;
				var _Go1=_Ar1._Ek1;
				var _cx1=_wu1._Ov1();
				var _dx1=_yu1._Ov1();
				var _so1=_vu1._oD1();
				var _ro1=_so1._ro1;
				_Ih1(_ro1>0);
				var _wE1=this._pE1[i]||new _eE1();
				_wE1.friction=_vu1._Fv1;
				_wE1._zv1=_vu1._Gv1;
				_wE1._gE1=_vu1._nD1;
				_wE1._Zm1=_cx1._It1;
				_wE1.__m1=_dx1._It1;
				_wE1._8E1=_cx1._5u1;
				_wE1._9E1=_dx1._5u1;
				_wE1._cE1=_cx1._7u1;
				_wE1._dE1=_dx1._7u1;
				_wE1._hE1=i;
				_wE1._ro1=_ro1;
				_wE1._fE1._xi1();
				_wE1._3E1._xi1();
				this._pE1[i]=_wE1;
				var _Dz1=this._oE1[i]||new _6E1();
				_Dz1._Zm1=_cx1._It1;
				_Dz1.__m1=_dx1._It1;
				_Dz1._8E1=_cx1._5u1;
				_Dz1._9E1=_dx1._5u1;
				_Dz1._aE1.x=_cx1._Rt1._jj1.x;
				_Dz1._aE1.y=_cx1._Rt1._jj1.y;
				_Dz1._bE1.x=_dx1._Rt1._jj1.x;
				_Dz1._bE1.y=_dx1._Rt1._jj1.y;
				_Dz1._cE1=_cx1._7u1;
				_Dz1._dE1=_dx1._7u1;
				_Dz1._qo1.x=_so1._qo1.x;
				_Dz1._qo1.y=_so1._qo1.y;
				_Dz1._lo1.x=_so1._lo1.x;
				_Dz1._lo1.y=_so1._lo1.y;
				_Dz1._ro1=_ro1;
				_Dz1._Eo1=_Eo1;
				_Dz1._Go1=_Go1;
				_Dz1.type=_so1.type;
				this._oE1[i]=_Dz1;
				for(var _05=0;_05<_ro1;++_05)
				{
					var _mq1=_so1.points[_05];
					var _xE1=_wE1.points[_05];
					if(this._rC1._kw1)
					{
						_xE1._mo1=this._rC1._hw1*_mq1._mo1;
						_xE1._no1=this._rC1._hw1*_mq1._no1;
					}
					else 
					{
						_xE1._mo1=0.0;
						_xE1._no1=0.0;
					}
					_xE1._co1._xi1();
					_xE1._do1._xi1();
					_xE1._3E1=0.0;
					_xE1._4E1=0.0;
					_xE1._5E1=0.0;
					_Dz1._7E1[_05]=_mq1._lo1;
				}
			}
		}
		,_yE1:
function()
		{
			for(var i=0;i<this._il1;++i)
			{
				var _wE1=this._pE1[i];
				var _Dz1=this._oE1[i];
				var _Eo1=_Dz1._Eo1;
				var _Go1=_Dz1._Go1;
				var _so1=this._vE1[_wE1._hE1]._oD1();
				var _Zm1=_wE1._Zm1;
				var __m1=_wE1.__m1;
				var _zE1=_wE1._8E1;
				var _AE1=_wE1._9E1;
				var _ws1=_wE1._cE1;
				var _xs1=_wE1._dE1;
				var _aE1=_Dz1._aE1;
				var _bE1=_Dz1._bE1;
				var _ox1=this._tE1[_Zm1].c;
				var _BE1=this._tE1[_Zm1]._i3;
				var _CE1=this._uE1[_Zm1]._Z3;
				var _an1=this._uE1[_Zm1].w;
				var _qx1=this._tE1[__m1].c;
				var _DE1=this._tE1[__m1]._i3;
				var _EE1=this._uE1[__m1]._Z3;
				var _bn1=this._uE1[__m1].w;
				_Ih1(_so1._ro1>0);
				_nE1._qE1.q.Set(_BE1);
				_nE1._rE1.q.Set(_DE1);
				_nE1._qE1._fx.x=_ox1.x-(_nE1._qE1.q.c*_aE1.x-_nE1._qE1.q._hg*_aE1.y);
				_nE1._qE1._fx.y=_ox1.y-(_nE1._qE1.q._hg*_aE1.x+_nE1._qE1.q.c*_aE1.y);
				_nE1._rE1._fx.x=_qx1.x-(_nE1._rE1.q.c*_bE1.x-_nE1._rE1.q._hg*_bE1.y);
				_nE1._rE1._fx.y=_qx1.y-(_nE1._rE1.q._hg*_bE1.x+_nE1._rE1.q.c*_bE1.y);
				var _qD1=new _Ao1();
				_qD1._Co1(_so1,_nE1._qE1,_Eo1,_nE1._rE1,_Go1);
				_wE1._Pk1.x=_qD1._Pk1.x;
				_wE1._Pk1.y=_qD1._Pk1.y;
				var _ro1=_wE1._ro1;
				for(var _05=0;_05<_ro1;++_05)
				{
					var _xE1=_wE1.points[_05];
					_xE1._co1.x=_qD1.points[_05].x-_ox1.x;
					_xE1._co1.y=_qD1.points[_05].y-_ox1.y;
					_xE1._do1.x=_qD1.points[_05].x-_qx1.x;
					_xE1._do1.y=_qD1.points[_05].y-_qx1.y;
					var _FE1=_xE1._co1.x*_wE1._Pk1.y-_xE1._co1.y*_wE1._Pk1.x;
					var _GE1=_xE1._do1.x*_wE1._Pk1.y-_xE1._do1.y*_wE1._Pk1.x;
					var _HE1=_zE1+_AE1+_ws1*_FE1*_FE1+_xs1*_GE1*_GE1;
					_xE1._3E1=_HE1>0.0?1.0/_HE1:0.0;
					var _bq1=1.0*_wE1._Pk1.y;
					var _cq1=-1.0*_wE1._Pk1.x;
					var _IE1=_xE1._co1.x*_cq1-_xE1._co1.y*_bq1;
					var _JE1=_xE1._do1.x*_cq1-_xE1._do1.y*_bq1;
					var _KE1=_zE1+_AE1+_ws1*_IE1*_IE1+_xs1*_JE1*_JE1;
					_xE1._4E1=_KE1>0.0?1.0/_KE1:0.0;
					_xE1._5E1=0.0;
					var _LE1=_wE1._Pk1.x*(((_EE1.x+(-_bn1*_xE1._do1.y))-_CE1.x)-(-_an1*_xE1._co1.y))+_wE1._Pk1.y*(((_EE1.y+(_bn1*_xE1._do1.x))-_CE1.y)-(_an1*_xE1._co1.x));
					if(_LE1<-_Wh1)
					{
						_xE1._5E1=-_wE1._zv1*_LE1;
					}
				}
				if(_wE1._ro1==2)
				{
					var _ME1=_wE1.points[0];
					var _NE1=_wE1.points[1];
					var _OE1=_ME1._co1.x*_wE1._Pk1.y-_ME1._co1.y*_wE1._Pk1.x;
					var _PE1=_ME1._do1.x*_wE1._Pk1.y-_ME1._do1.y*_wE1._Pk1.x;
					var _QE1=_NE1._co1.x*_wE1._Pk1.y-_NE1._co1.y*_wE1._Pk1.x;
					var _RE1=_NE1._do1.x*_wE1._Pk1.y-_NE1._do1.y*_wE1._Pk1.x;
					var _SE1=_zE1+_AE1+_ws1*_OE1*_OE1+_xs1*_PE1*_PE1;
					var _TE1=_zE1+_AE1+_ws1*_QE1*_QE1+_xs1*_RE1*_RE1;
					var _UE1=_zE1+_AE1+_ws1*_OE1*_QE1+_xs1*_PE1*_RE1;
					var _VE1=1000.0;
					if(_SE1*_SE1<_VE1*(_SE1*_TE1-_UE1*_UE1))
					{
						_wE1._fE1._5i.x=_SE1;
						_wE1._fE1._5i.y=_UE1;
						_wE1._fE1._jD.x=_UE1;
						_wE1._fE1._jD.y=_TE1;
						_wE1._3E1._PG(_wE1._fE1._Si1());
					}
					else 
					{
						_wE1._ro1=1;
					}
				}
			}
		}
		,_WE1:
function()
		{
			for(var i=0;i<this._il1;++i)
			{
				var _wE1=this._pE1[i];
				var _Zm1=_wE1._Zm1;
				var __m1=_wE1.__m1;
				var _zE1=_wE1._8E1;
				var _ws1=_wE1._cE1;
				var _AE1=_wE1._9E1;
				var _xs1=_wE1._dE1;
				var _ro1=_wE1._ro1;
				var _CE1=this._uE1[_Zm1]._Z3;
				var _an1=this._uE1[_Zm1].w;
				var _EE1=this._uE1[__m1]._Z3;
				var _bn1=this._uE1[__m1].w;
				var _Pk1=_wE1._Pk1;
				var _bq1=1.0*_Pk1.y;
				var _cq1=-1.0*_Pk1.x;
				for(var _05=0;_05<_ro1;++_05)
				{
					var _xE1=_wE1.points[_05];
					var _Aq1=(_xE1._mo1*_Pk1.x)+(_xE1._no1*_bq1);
					var _Bq1=(_xE1._mo1*_Pk1.y)+(_xE1._no1*_cq1);
					_an1-=_ws1*(_xE1._co1.x*_Bq1-_xE1._co1.y*_Aq1);
					_CE1.x-=_zE1*_Aq1;
					_CE1.y-=_zE1*_Bq1;
					_bn1+=_xs1*(_xE1._do1.x*_Bq1-_xE1._do1.y*_Aq1);
					_EE1.x+=_AE1*_Aq1;
					_EE1.y+=_AE1*_Bq1;
				}
				this._uE1[_Zm1].w=_an1;
				this._uE1[__m1].w=_bn1;
			}
		}
		,_XE1:
function()
		{
			for(var i=0;i<this._il1;++i)
			{
				var _wE1=this._pE1[i];
				var _Zm1=_wE1._Zm1;
				var __m1=_wE1.__m1;
				var _zE1=_wE1._8E1;
				var _ws1=_wE1._cE1;
				var _AE1=_wE1._9E1;
				var _xs1=_wE1._dE1;
				var _ro1=_wE1._ro1;
				var _CE1=this._uE1[_Zm1]._Z3;
				var _an1=this._uE1[_Zm1].w;
				var _EE1=this._uE1[__m1]._Z3;
				var _bn1=this._uE1[__m1].w;
				var _Pk1=_wE1._Pk1;
				var _bq1=1.0*_Pk1.y;
				var _cq1=-1.0*_Pk1.x;
				var friction=_wE1.friction;
				_Ih1(_ro1==1||_ro1==2);
				for(var _05=0;_05<_ro1;++_05)
				{
					var _xE1=_wE1.points[_05];
					var _YE1=_EE1.x+(-_bn1*_xE1._do1.y)-_CE1.x-(-_an1*_xE1._co1.y);
					var _ZE1=_EE1.y+(_bn1*_xE1._do1.x)-_CE1.y-(_an1*_xE1._co1.x);
					var __E1=(_YE1*_bq1+_ZE1*_cq1)-_wE1._gE1;
					var _0F1=_xE1._4E1*(-__E1);
					var _1F1=friction*_xE1._mo1;
					var _2F1=_Yj1(_xE1._no1+_0F1,-_1F1,_1F1);
					_0F1=_2F1-_xE1._no1;
					_xE1._no1=_2F1;
					var _Aq1=_0F1*_bq1;
					var _Bq1=_0F1*_cq1;
					_CE1.x-=_zE1*_Aq1;
					_CE1.y-=_zE1*_Bq1;
					_an1-=_ws1*(_xE1._co1.x*_Bq1-_xE1._co1.y*_Aq1);
					_EE1.x+=_AE1*_Aq1;
					_EE1.y+=_AE1*_Bq1;
					_bn1+=_xs1*(_xE1._do1.x*_Bq1-_xE1._do1.y*_Aq1);
				}
				if(_wE1._ro1==1)
				{
					_xE1=_wE1.points[0];
					_YE1=_EE1.x+(-_bn1*_xE1._do1.y)-_CE1.x-(-_an1*_xE1._co1.y);
					var _wC1=_YE1*_Pk1.x+_ZE1*_Pk1.y;