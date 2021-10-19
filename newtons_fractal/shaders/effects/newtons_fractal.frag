uniform sampler2D g_Texture0;
uniform float g_Time;
uniform vec4 g_Texture0Resolution;

varying vec4 v_TexCoord;


uniform float u_hue_range; // {"material":"Hue Range","default":0.125,"range":[0,1]}
uniform float u_hue_offest; // {"material":"Hue base","default":0.0,"range":[0,1]}



#define PI 3.14159265359
#define NUM_ROOTS 5

// complex number library from https://github.com/Quinn-With-Two-Ns/GLSL-Complex-Numbers

#define I vec2(0,1)

vec2 cpx_con(in vec2 z) {
    return vec2(z.x, -z.y);
}

vec2 cpx_mul(in vec2 z, in vec2 w) {
    return vec2(z.x * w.x - z.y * w.y, z.y * w.x + z.x * w.y);
}

float cpx_mag2(in vec2 z) {
    return dot(z,z);
}

vec2 cpx_div(in vec2 z, in vec2 w) {
    return cpx_mul(z, cpx_con(w))/cpx_mag2(w);

}

vec2 random2(vec2 st){
    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0 * frac( sin(st) * 43758.5453123);
}

// Gradient Noise by Inigo Quilez - iq/2013
// https://www.shadertoy.com/view/XdXGW8
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = frac(st);

    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

vec3 hsv2rgb(vec3 c){
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(frac(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
// newtons method functions

// this transforms a point p by the function f 
// found by using the roots of the polynomial
vec2 function(vec2 root[NUM_ROOTS], vec2 p) {
    vec2 f = vec2(1.0,1.0);
    for(int i = 0; i < NUM_ROOTS; i++) {
        f = cpx_mul((p - root[i]), f);
    }
    return f;
}

// since we are using the roots as the base for the polynomial
// the derivate at x is just f(x)*((1/(x-r_1)+(1/(x-r_2)..+(1/(x-r_n))
// pretty neat huh?
vec2 fPrime(vec2 root[NUM_ROOTS], vec2 p) {
    vec2 f = function(root, p);
    vec2 prime = vec2(0.0,0.0);
    for(int i = 0; i < NUM_ROOTS; i++) {
        prime += cpx_div(vec2(1.0,1.0), root[i]);
    }
    return cpx_mul(f, prime);
}

//this takes in the value f, for faster calculation
vec2 fPrime(vec2 root[NUM_ROOTS], vec2 p, vec2 f) {
    vec2 prime = vec2(0.0,0.0);
    for(int i = 0; i < NUM_ROOTS; i++) {
        prime += cpx_div(vec2(1.0,1.0), p - root[i]);
    }

    return cpx_mul(f, prime);
}

vec2 newtons_method(vec2 root[NUM_ROOTS], vec2 p) {
    vec2 f = function(root, p);
    // if(dot(f,f) < 0.0000000000001)
        // return p;
    return p - cpx_div(f, fPrime(root, p, f));
}

// point function
vec2 p_function(vec2 seed, float g_Time) {
    seed += g_Time/10.0;
    vec2 n = vec2(noise(seed), noise(seed + 1.0));

    vec2 p = vec2(sin(g_Time*(1.0+n.x)),cos(g_Time*(1.0+n.y)));
    return p;
} 

void main() {
    vec2 st = v_TexCoord.xy;
    st-=0.5; // centers 0.0
    st.x*=g_Texture0Resolution.x/g_Texture0Resolution.y;        // scales x to be proportional to y
    st/=g_Texture0Resolution.y/g_Texture0Resolution.x;                        // scales y between 0.0 and 1.0

    float x_scale = g_Texture0Resolution.x/g_Texture0Resolution.y * 0.375 * 4.0;
    float y_scale = 0.375 * 2.0;

    vec3 color = CAST3(0.0);
    vec2 root[NUM_ROOTS];
    root[0] = p_function(vec2(10.0,1.0),g_Time/50.0    )*vec2(x_scale,y_scale);
    root[1] = p_function(vec2(1.0,-3.0),g_Time/50.0+2.0)*vec2(x_scale,y_scale);
    root[2] = p_function(vec2(2.0,21.0),g_Time/50.0+7.0)*vec2(x_scale,y_scale);
    root[3] = p_function(vec2(3.0,14.0),g_Time/50.0-9.0)*vec2(x_scale,y_scale);
    root[4] = p_function(vec2(7.0,-9.0),g_Time/50.0+9.0)*vec2(x_scale,y_scale);

    vec3 root_c[NUM_ROOTS];    
    root_c[0] = hsv2rgb(vec3(0.655+u_hue_range/2.0+u_hue_range*sin(g_Time/300.0)+u_hue_offest, 0.68, 0.21));
    root_c[1] = hsv2rgb(vec3(0.697+u_hue_range/2.0+u_hue_range*sin(g_Time/300.0)+u_hue_offest, 0.68, 0.12));
    root_c[2] = hsv2rgb(vec3(0.675+u_hue_range/2.0+u_hue_range*sin(g_Time/300.0)+u_hue_offest, 0.64, 0.16));
    root_c[3] = hsv2rgb(vec3(0.642+u_hue_range/2.0+u_hue_range*sin(g_Time/300.0)+u_hue_offest, 0.88, 0.32));
    root_c[4] = hsv2rgb(vec3(0.594+u_hue_range/2.0+u_hue_range*sin(g_Time/300.0)+u_hue_offest, 0.82, 0.35));

    vec2 p = st;
    for(int i = 0; i < 25; i++)
    {
        p = newtons_method(root, p);
    }

    float m_dist = 100000.0;
    vec3 c_root = root_c[0];
    for (int i = 0; i < NUM_ROOTS; i++) {
        float dist = distance(root[i], p);
        
        // Keep the closer distance
        if(dist < m_dist) {
            m_dist = dist; 
            c_root = root_c[i];
        }
    }
    color.xyz = mix(c_root,vec3(0.0, 0.0, 0.0),0.10);
    
    gl_FragColor = vec4(color,1.0);
}