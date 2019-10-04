import * as THREE from 'three'
import { TweenMax as TM, Power2 } from 'gsap/all'
import Scrollbar from 'smooth-scrollbar'
import vertexShader from '../glsl/vertexShader.glsl'
import circleShader from '../glsl/circleShader.glsl'

import { clamp } from './utils/utils'

export default class Tile {

    constructor($el, scene, index) {
        this.scene = scene
        this.$el = $el
        this.image = this.$el.querySelector('img')
        this.index = index

        this.vertexShader = vertexShader
        this.fragmentShader = circleShader

        this.clock = new THREE.Clock()

        this.mouse = new THREE.Vector2(0, 0)

        this.loader = new THREE.TextureLoader()
        this.loader.load(this.image.src, (t) => { this.initImage(t) })

        this.Scroll = Scrollbar.get(document.querySelector('.scrollarea'))

        this.bindEvent()
    }

    bindEvent() {
        window.addEventListener('resize', () => { this.onResize() })
        window.addEventListener('mousemove', (e) => { this.onMouseMove(e) })

        this.$el.addEventListener('mouseenter', () => { this.onPointerEnter() })
        this.$el.addEventListener('mouseleave', () => { this.onPointerLeave() })

        this.Scroll.addListener((s) => { this.onScroll(s) })
    }

    /* Handlers
    --------------------------------------------------------- */

    onPointerEnter() {
        const idx = clamp([...this.$el.parentElement.children].indexOf(this.$el) + 1, 1, 3)

        document.documentElement.style.setProperty('--color-bg', `var(--color-bg${idx})`)
        document.documentElement.style.setProperty('--color-text', `var(--color-text${idx})`)

        TM.to(this.mesh.material.uniforms.u_progressHover, 0.5, {
            value: 1,
            ease: Power2.easeInOut,
        })
    }

    onPointerLeave() {
        TM.to(this.mesh.material.uniforms.u_progressHover, 0.5, {
            value: 0,
            ease: Power2.easeInOut,
        })
    }

    onResize() {
        this.getBounds()

        this.mesh.scale.set(this.sizes.w, this.sizes.h, 1)
        this.mesh.material.uniforms.u_res.position.set(window.innerWidth, window.innerHeight)
    }

    onScroll(s) {
        //
    }

    onMouseMove(event) {
        TM.to(this.mouse, 0.5, {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1,
        })
    }

    /* Actions
    --------------------------------------------------------- */

    initImage(texture) {
        texture.center.set(0.5, 0.5)
        texture.needsUpdate = true

        this.getBounds()

        this.uniforms = {
            u_map: { type: 't', value: texture },
            u_mouse: { value: this.mouse },
            u_progressHover: { value: 0 },
            u_progressClick: { value: 0 },
            u_progressLoading: { value: 0 },
            u_time: { value: this.clock.getElapsedTime() + THREE.Math.randFloat(1, 1000) },
            u_res: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        }

        this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1)

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            transparent: true,
            defines: {
                PI: Math.PI,
            },
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)

        this.mesh.position.x = this.offset.x
        this.mesh.position.y = this.offset.y

        this.mesh.scale.set(this.sizes.w, this.sizes.h, 1)

        this.scene.mainScene.add(this.mesh)

        this.image.classList.add('is-loaded')

        setTimeout(() => {
            TM.to(this.mesh.material.uniforms.u_progressLoading, 1, {
                value: 1,
                ease: Power2.easeInOut,
            })
        }, 500)
    }

    update() {
        if (!this.mesh) return
        this.getBounds()

        TM.set(this.mesh.position, {
            x: this.offset.x,
            y: this.offset.y,
        })

        this.mesh.material.uniforms.u_time.value += this.clock.getDelta()
    }


    /* Values
    --------------------------------------------------------- */

    getBounds() {
        const { width: w, height: h, left: x, top: y } = this.image.getBoundingClientRect()

        this.sizes = { w, h, x, y }

        this.offset = {
            x: this.sizes.x - window.innerWidth / 2 + this.sizes.w / 2,
            y: -this.sizes.y + window.innerHeight / 2 - this.sizes.h / 2,
        }
    }
}
