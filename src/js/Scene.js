import * as THREE from 'three'
import Tile from './Tile'
import DetailView from './Detail'
import { ev } from './utils/utils'

import trippyShader from '../glsl/trippyShader.glsl'
import shapeShader from '../glsl/shapeShader.glsl'
import revealShader from '../glsl/revealShader.glsl'
import gooeyShader from '../glsl/gooeyShader.glsl'
import waveShader from '../glsl/waveShader.glsl'

const perspective = 800

const shaders = [
    trippyShader,
    shapeShader,
    gooeyShader,
    waveShader,
    revealShader,
]

const durations = [
    0.5,
    0.5,
    0.5,
    0.8,
    0.8,
]

export default class Scene {

    constructor($scene) {
        this.container = $scene
        this.$tiles = document.querySelectorAll('.slideshow-list__el')

        this.W = window.innerWidth
        this.H = window.innerHeight

        this.mouse = new THREE.Vector2(0, 0)
        this.activeTile = null

        this.start()

        this.detailview = new DetailView()


        this.bindEvent()
    }

    bindEvent() {
        document.addEventListener('toggleDetail', ({ detail: shouldOpen }) => { this.onToggleView(shouldOpen) })

        window.addEventListener('resize', () => { this.onResize() })
    }


    start() {
        this.mainScene = new THREE.Scene()
        this.initCamera()
        this.initLights()

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            alpha: true,
        })
        this.renderer.setSize(this.W, this.H)
        this.renderer.setPixelRatio(window.devicePixelRatio)

        this.tiles = Array.from(this.$tiles).map(($el, i) => new Tile($el, this, durations[i], shaders[i]))

        this.update()
    }

    initCamera() {
        const fov = (180 * (2 * Math.atan(this.H / 2 / perspective))) / Math.PI

        this.camera = new THREE.PerspectiveCamera(fov, this.W / this.H, 1, 10000)
        this.camera.position.set(0, 0, perspective)
    }

    initLights() {
        const ambientlight = new THREE.AmbientLight(0xffffff, 2)
        this.mainScene.add(ambientlight)
    }




    /* Handlers
    --------------------------------------------------------- */

    onResize() {
        this.W = window.innerWidth
        this.H = window.innerHeight

        this.camera.aspect = this.W / this.H

        this.camera.updateProjectionMatrix()
        this.renderer.setSize(this.W, this.H)
    }

    onToggleView({ target, open }) {
        this.activeTile = target // !== undefined ? target : this.activeTile

        ev('lockScroll', { lock: open })
        ev('tile:zoom', { tile: this.activeTile, open })
    }

    /* Actions
    --------------------------------------------------------- */

    update() {
        requestAnimationFrame(this.update.bind(this))

        this.tiles.forEach((tile) => {
            tile.update()
        })

        this.renderer.render(this.mainScene, this.camera)
    }

}
