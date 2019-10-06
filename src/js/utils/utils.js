import * as THREE from 'three'

// eslint-disable-next-line import/prefer-default-export
export const clamp = (val, min = 0, max = 1) => Math.max(min, Math.min(max, val))

export const map = (value, min1, max1, min2, max2) => min2 + (max2 - min2) * (value - min1) / (max1 - min1)

export const getRatio = ({ x: w, y: h }, { width, height }, r = 0) => {
    const m = multiplyMatrixAndPoint(rotateMatrix(THREE.Math.degToRad(r)), [w, h])
    const originalRatio = {
        w: m[0] / width,
        h: m[1] / height,
    }

    const coverRatio = 1 / Math.max(originalRatio.w, originalRatio.h)

    return new THREE.Vector2(
        originalRatio.w * coverRatio,
        originalRatio.h * coverRatio,
    )
}


const rotateMatrix = (a) => [Math.cos(a), -Math.sin(a), Math.sin(a), Math.cos(a)]

const multiplyMatrixAndPoint = (matrix, point) => {
    const c0r0 = matrix[0]
    const c1r0 = matrix[1]
    const c0r1 = matrix[2]
    const c1r1 = matrix[3]
    const x = point[0]
    const y = point[1]
    return [Math.abs(x * c0r0 + y * c0r1), Math.abs(x * c1r0 + y * c1r1)]
}

export const wrap = (el, wrapper) => {
    el.parentNode.insertBefore(wrapper, el)
    wrapper.appendChild(el)
}


export const unwrap = (content) => {
    for (let i = 0; i < content.length; i++) {
        const el     = content[i]
        const parent = el.parentNode

        if (parent.parentNode) parent.outerHTML = el.innerHTML
    }
}

export const ev = (eventName, data, once = false) => {
    const e = new CustomEvent(eventName, { detail: data }, { once })
    document.dispatchEvent(e)
}
