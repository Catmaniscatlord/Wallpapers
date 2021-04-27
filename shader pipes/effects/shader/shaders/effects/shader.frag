
#include "common.h"


uniform float g_Time;
uniform vec2 g_PointerPosition;
uniform vec4 g_Texture0Resolution;

varying vec4 v_TexCoord;

float random (vec2 st) {
    return frac(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = frac(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float tile1(vec2 st) {
    float x = 0.0;
    x += smoothstep(0.365,0.375,st.x)*smoothstep(0.635,0.625,st.x);
    x += smoothstep(0.365,0.375,st.y)*smoothstep(0.635,0.625,st.y);
    return clamp(0.0,1.0,x);
}

float tile1balls(vec2 st, float time) {
    float x = 0.0;
    time=frac(time);
    // ball1
    x += smoothstep(0.085,0.075,(length(st-vec2(0.5,2.0-time))));
    x += smoothstep(0.085,0.075,(length(st-vec2(0.5,1.0-time))));
    x += smoothstep(0.085,0.075,(length(st-vec2(0.5,0.0-time))));

    //ball2
    x += smoothstep(0.085,0.075,length(st-vec2(time-1.0,0.5)));
    x += smoothstep(0.085,0.075,length(st-vec2(time    ,0.5)));
    x += smoothstep(0.085,0.075,length(st-vec2(time+1.0,0.5)));
    
    return clamp(0.0,1.0,x);
}

float tile2(vec2 st) {
    float x = 0.0;
    x += smoothstep(0.365,0.375,length(st    ))*smoothstep(0.635,0.625,length(st    ));
    x += smoothstep(0.365,0.375,length(1.0-st))*smoothstep(0.635,0.625,length(1.0-st));
    return clamp(0.0,1.0,x);
}

float tile2balls(vec2 st, float time) {
    float x = 0.0;
    time=frac(time)*M_PI/2.0;
    // ball1
    x += smoothstep(0.085,0.075,(length(st-vec2(cos(-time+M_PI    ),sin(-time+M_PI    ))*.5)));
    x += smoothstep(0.085,0.075,(length(st-vec2(cos(-time+M_PI/2.0),sin(-time+M_PI/2.0))*.5)));
    x += smoothstep(0.085,0.075,(length(st-vec2(cos(-time       ),sin(-time       ))*.5)));


    //ball2
    x += smoothstep(0.085,0.075,(length(1.0-st-vec2(cos(time+M_PI/2.0),sin(time+M_PI/2.0))*.5)));
    x += smoothstep(0.085,0.075,(length(1.0-st-vec2(cos(time+0.0   ),sin(time+0.0   ))*.5)));
    x += smoothstep(0.085,0.075,(length(1.0-st-vec2(cos(time-M_PI/2.0),sin(time-M_PI/2.0))*.5)));
    return clamp(0.0,1.0,x);
}

// this fixes a bug where the circular paths for tile 2 dont align properly
// when connecting
float tile(vec2 st) {
    float x = tile1(st);
    vec2 uv =  smoothstep(CAST2(.005),
                            CAST2(.01),
                            st);
          uv *= smoothstep(CAST2(.005),
                            CAST2(.01),
                            1.0-st);
    x*=1.0-uv.x*uv.y;
    return x;
}

vec3 pipes(vec2 st,float tiles,vec2 mouse) {
    vec2 velocity = vec2(g_Time,-g_Time)*0.025;
    vec2 ipos = floor((st+velocity)*tiles);
    vec2 fpos = frac((st+velocity)*tiles);

    vec3 pipecolor = hsv2rgb(
                vec3(
                min(0.4,length(st-mouse)*1.5) + noise(st*.5+g_Time/50.0) + g_Time*0.001,
                1.0,0.1));
    vec3 ballcolor = hsv2rgb(vec3(noise(st*5.0+g_Time/4.0),1.0,1.0));

    float index = random(ipos); 

    vec3 d = CAST3(0.0);
    if(index<0.5){
        d = mix(d,pipecolor,tile1(fpos));
        d = mix(d,ballcolor,tile1balls(fpos,g_Time/8.0));
    } else  {
        d = mix(d,pipecolor,tile2(fpos));
        d = mix(d,ballcolor,tile2balls(fpos,g_Time/8.0));
    }
    d = mix(d,(1.0-ballcolor)*0.1,tile(fpos));
    return d;
}

void main() {
	vec2 st = v_TexCoord.xy;
	st.x*= g_Texture0Resolution.x/g_Texture0Resolution.y;        // scales x to be proportional to y

	vec2 mouse = g_PointerPosition;
	mouse.x*= g_Texture0Resolution.x/g_Texture0Resolution.y;        // scales x to be proportional to y
    
	vec3 color = CAST3(0.0);
	color += pipes(st,6.0,mouse);
	gl_FragColor = vec4(color,1.0);
}
