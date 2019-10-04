
// eslint-disable-next-line import/prefer-default-export
export const clamp = (val, min = 0, max = 1) => Math.max(min, Math.min(max, val))

export const map = (value, min1, max1, min2, max2) => min2 + (max2 - min2) * (value - min1) / (max1 - min1)
