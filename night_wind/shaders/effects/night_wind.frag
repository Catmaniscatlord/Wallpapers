
uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform float g_Time;
uniform vec4 g_Texture0Resolution;


varying vec4 v_TexCoord;

#define PI 3.14159265359

/* Math 2D Transformations */
mat2 rotate2d(in float angle){
    return mat2(cos(angle),-sin(angle), sin(angle), cos(angle));
}

float random (vec2 st) {
    return frac(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

vec2 random2(vec2 st){
    st = vec2( dot(st,vec2(1.1,31.7)),
              dot(st,vec2(2.5,183.3)) );
    return -1.0 + 2.0*frac(sin(st)*43758.5453123);
}

float PerlinNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = frac(st);

    vec2 u = f * f * ( 3.0 - 2.0 * f);

    return mix( mix(dot(random2(i                ),f                ),
                    dot(random2(i + vec2(1.0,0.0)),f - vec2(1.0,0.0)),u.x),
                mix(dot(random2(i + vec2(0.0,1.0)),f - vec2(0.0,1.0)),
                    dot(random2(i + vec2(1.0,1.0)),f - vec2(1.0,1.0)),u.x),u.y);
}

float PerlinNoise(vec2 st, float persistance, float octave) {
    float x = 0.0;
    for(float i = 0.0; i < 8.0; i++) {
        x += pow(persistance,i)*PerlinNoise(pow(octave,i)*st);
    }
    return x;
}


void main(){
    vec2 st = v_TexCoord.xy;
	st.x*= g_Texture0Resolution.x/g_Texture0Resolution.y;        // scales x to be proportional to y

    st-=0.5;

    vec3 color = vec3(0.0235, 0.0550, 0.0902);
    st = mul(rotate2d(PerlinNoise(st+vec2(g_Time/2.0,0.0))*0.1625),st); 
    st *= vec2(1.0,100.0);
    st += vec2(g_Time/8.0,0.0);
    color.g += smoothstep(0.35,0.5,PerlinNoise(st*vec2(1.00,1.00) + 1.0));
    color.r += smoothstep(0.35,0.5,PerlinNoise(st*vec2(1.00,1.00) + 1.05));
    color.b += smoothstep(0.35,0.5,PerlinNoise(st*vec2(1.00,1.00) + 0.95));

    color.g += smoothstep(0.55,0.95,PerlinNoise(st*vec2(0.75,1.00) + 1.00))*0.75;
    color.r += smoothstep(0.55,0.95,PerlinNoise(st*vec2(0.75,1.00) + 1.05))*0.75;
    color.b += smoothstep(0.55,0.95,PerlinNoise(st*vec2(0.75,1.00) + 0.95))*0.75;

    color.g += smoothstep(-0.35,-0.55,PerlinNoise(st*vec2(0.25,1.0) + 1.00))*0.65;
    color.r += smoothstep(-0.35,-0.55,PerlinNoise(st*vec2(0.25,1.0) + 1.05))*0.65;
    color.b += smoothstep(-0.35,-0.55,PerlinNoise(st*vec2(0.25,1.0) + 0.95))*0.65;


    gl_FragColor=vec4(color,1.0);
}