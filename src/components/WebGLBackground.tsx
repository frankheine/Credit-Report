import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const fragmentShader = `
  uniform float uTime;
  uniform float uScroll;
  uniform float uVelocity;
  uniform vec2 uResolution;
  varying vec2 vUv;

  #define PI 3.14159265359

  // Simplex 2D noise for organic fluid waves
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
      vec2 uv = vUv;
      // Center and correct aspect ratio
      vec2 p = uv * 2.0 - 1.0;
      p.x *= uResolution.x / uResolution.y;
      
      // Velocity adds a subtle ripple intensity
      float scrollFactor = uScroll * PI * 2.0;
      float time = uTime * 0.15 + scrollFactor;
      float intensity = 1.0 + abs(uVelocity) * 0.005; // Swell based on velocity
      
      // Deep sea waves using layered noise
      float wave1 = snoise(p * 1.5 + vec2(time * 0.2, sin(time * 0.1))) * 0.5;
      float wave2 = snoise(p * 3.0 - vec2(cos(time * 0.15), time * 0.3)) * 0.25 * intensity;
      float wave3 = snoise(p * 6.0 + vec2(sin(time * 0.05), -time * 0.4)) * 0.125 * intensity;
      
      float fluid = wave1 + wave2 + wave3;
      
      // Deep Purples and Blues (Deep Sea Liquid)
      vec3 abyssalBlue = vec3(0.005, 0.01, 0.05); // Extremely dark blue abyss
      vec3 deepOcean = vec3(0.02, 0.08, 0.25);    // Deep ocean blue
      vec3 bioluminescentPurple = vec3(0.2, 0.05, 0.4); // Alien/tactical purple glow
      vec3 cyanAccent = vec3(0.0, 0.3, 0.5);      // Subtle cyan highlights
      
      // Mix colors based on fluid depth
      vec3 finalColor = mix(abyssalBlue, deepOcean, smoothstep(-0.5, 0.5, fluid));
      finalColor = mix(finalColor, bioluminescentPurple, smoothstep(0.1, 0.8, fluid) * 0.8);
      finalColor = mix(finalColor, cyanAccent, smoothstep(0.4, 1.0, fluid) * 0.5);
      
      // Soft vignette for immersion
      float dist = length(p);
      float vignette = smoothstep(2.2, 0.2, dist);
      finalColor *= vignette;

      gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ShaderPlane = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const targetVelocity = useRef(0);

  useEffect(() => {
    // GSAP ScrollTrigger to lock scroll precisely to the shader uniform
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // Smooth scrub for the wow-factor easing
        onUpdate: (self) => {
          if (materialRef.current) {
            // Smoothly update the scroll uniform directly tied to GSAP ScrollTrigger progress
            materialRef.current.uniforms.uScroll.value = self.progress;
            // Track velocity for wave intensity
            targetVelocity.current = self.getVelocity();
          }
        }
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      // Time continues to slowly drift for the ambient hypnotic effect
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
      
      // Smoothly interpolate velocity for fluid reaction
      materialRef.current.uniforms.uVelocity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uVelocity.value,
        targetVelocity.current,
        0.05
      );
      
      // Decay velocity slowly back to 0 when not scrolling
      targetVelocity.current = THREE.MathUtils.lerp(targetVelocity.current, 0, 0.1);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uScroll: { value: 0 },
          uVelocity: { value: 0 },
          uResolution: { value: new THREE.Vector2(size.width, size.height) }
        }}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

export default function WebGLBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-black">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        gl={{ antialias: false, alpha: false }} // alpha false for performance
        dpr={[1, 1.5]} // Limit pixel ratio to ensure 60fps
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
