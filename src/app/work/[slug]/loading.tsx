'use client'

import { computeLayout } from 'boneyard-js'
import { Skeleton } from 'boneyard-js/react'
import type { SkeletonDescriptor, ResponsiveBones } from 'boneyard-js'

/*
 * Hand-authored bone descriptor mirroring the real project page layout:
 *   .cover-transition  →  16:9 cover image
 *   .project-header    →  title + meta (date/place/client)
 *   .project-content   →  about text block
 *
 * Computed at module load for 3 breakpoints.
 */

const descriptor: SkeletonDescriptor = {
  display: 'flex',
  flexDirection: 'column',
  padding: { top: 96, right: 0, bottom: 0, left: 0 },
  gap: 0,
  children: [
    // Cover image
    { aspectRatio: 16 / 9, borderRadius: 0 },
    // Header: title + meta labels
    {
      display: 'flex',
      flexDirection: 'row',
      padding: { top: 64, right: 48, bottom: 32, left: 48 },
      gap: 32,
      justifyContent: 'space-between',
      children: [
        { width: 400, height: 44, borderRadius: 4 },
        {
          display: 'flex',
          flexDirection: 'row',
          gap: 64,
          children: [
            {
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              children: [
                { width: 40, height: 10, borderRadius: 3 },
                { width: 70, height: 14, borderRadius: 3 },
              ],
            },
            {
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              children: [
                { width: 40, height: 10, borderRadius: 3 },
                { width: 80, height: 14, borderRadius: 3 },
              ],
            },
            {
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              children: [
                { width: 50, height: 10, borderRadius: 3 },
                { width: 90, height: 14, borderRadius: 3 },
              ],
            },
          ],
        },
      ],
    },
    // About text block
    {
      display: 'flex',
      flexDirection: 'column',
      padding: { top: 0, right: 48, bottom: 0, left: 48 },
      gap: 10,
      children: [
        { height: 14, borderRadius: 3 },
        { height: 14, borderRadius: 3 },
        { height: 14, borderRadius: 3, width: 480 },
      ],
    },
  ],
}

// Mobile: stacked layout, smaller title, meta below title
const mobileDescriptor: SkeletonDescriptor = {
  display: 'flex',
  flexDirection: 'column',
  padding: { top: 64, right: 0, bottom: 0, left: 0 },
  gap: 0,
  children: [
    { aspectRatio: 16 / 9, borderRadius: 0 },
    {
      display: 'flex',
      flexDirection: 'column',
      padding: { top: 32, right: 20, bottom: 24, left: 20 },
      gap: 20,
      children: [
        { width: 240, height: 32, borderRadius: 4 },
        {
          display: 'flex',
          flexDirection: 'row',
          gap: 24,
          children: [
            {
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              children: [
                { width: 36, height: 8, borderRadius: 2 },
                { width: 60, height: 12, borderRadius: 2 },
              ],
            },
            {
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              children: [
                { width: 36, height: 8, borderRadius: 2 },
                { width: 70, height: 12, borderRadius: 2 },
              ],
            },
            {
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              children: [
                { width: 44, height: 8, borderRadius: 2 },
                { width: 80, height: 12, borderRadius: 2 },
              ],
            },
          ],
        },
      ],
    },
    {
      display: 'flex',
      flexDirection: 'column',
      padding: { top: 0, right: 20, bottom: 0, left: 20 },
      gap: 8,
      children: [
        { height: 12, borderRadius: 3 },
        { height: 12, borderRadius: 3 },
        { height: 12, borderRadius: 3, width: 200 },
      ],
    },
  ],
}

const bones: ResponsiveBones = {
  breakpoints: {
    375: computeLayout(mobileDescriptor, 375),
    768: computeLayout(descriptor, 768),
    1280: computeLayout(descriptor, 1280),
  },
}

export default function ProjectLoading() {
  return (
    <div className="project-page">
      <Skeleton
        name="project-page"
        loading={true}
        initialBones={bones}
        color="rgba(255,255,255,0.06)"
        darkColor="rgba(255,255,255,0.06)"
      >
        <div />
      </Skeleton>
    </div>
  )
}
