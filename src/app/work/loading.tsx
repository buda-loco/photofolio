'use client'

import { computeLayout } from 'boneyard-js'
import { Skeleton } from 'boneyard-js/react'
import type { SkeletonDescriptor, ResponsiveBones } from 'boneyard-js'

/*
 * Hand-authored bone descriptor mirroring the real /work page layout:
 *   .work-page-header  →  h1 "Work" + subtitle
 *   .work-layout       →  sidebar (160px) + bento grid (12-col)
 *
 * Computed at module load for 3 breakpoints (mobile / tablet / desktop).
 */

const descriptor: SkeletonDescriptor = {
  display: 'flex',
  flexDirection: 'column',
  padding: { top: 128, right: 48, bottom: 128, left: 48 },
  gap: 64,
  children: [
    // Header: title + subtitle
    {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      children: [
        { width: 200, height: 52, borderRadius: 4 },
        { width: 380, height: 14, borderRadius: 3 },
      ],
    },
    // Layout: sidebar + bento grid
    {
      display: 'flex',
      flexDirection: 'row',
      gap: 64,
      children: [
        // Sidebar filters
        {
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: 160,
          children: [
            { width: 136, height: 12, borderRadius: 3 },
            { width: 96, height: 12, borderRadius: 3 },
            { width: 152, height: 12, borderRadius: 3 },
            { width: 112, height: 12, borderRadius: 3 },
            { width: 80, height: 12, borderRadius: 3 },
            { width: 128, height: 12, borderRadius: 3 },
            { width: 104, height: 12, borderRadius: 3 },
            { width: 144, height: 12, borderRadius: 3 },
          ],
        },
        // Bento grid
        {
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          children: [
            // Row 1: big + 2 stacked smalls
            {
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              children: [
                { aspectRatio: 4 / 3, borderRadius: 0, width: 640 },
                {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  width: 310,
                  children: [
                    { aspectRatio: 16 / 9, borderRadius: 0 },
                    { aspectRatio: 16 / 9, borderRadius: 0 },
                  ],
                },
              ],
            },
            // Row 2: 3 equal smalls
            {
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              children: [
                { aspectRatio: 16 / 9, borderRadius: 0 },
                { aspectRatio: 16 / 9, borderRadius: 0 },
                { aspectRatio: 16 / 9, borderRadius: 0 },
              ],
            },
            // Row 3: 2 mediums
            {
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              children: [
                { aspectRatio: 16 / 9, borderRadius: 0 },
                { aspectRatio: 16 / 9, borderRadius: 0 },
              ],
            },
          ],
        },
      ],
    },
  ],
}

// Mobile: single-column stacked grid, no sidebar
const mobileDescriptor: SkeletonDescriptor = {
  display: 'flex',
  flexDirection: 'column',
  padding: { top: 80, right: 20, bottom: 80, left: 20 },
  gap: 32,
  children: [
    {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      children: [
        { width: 160, height: 40, borderRadius: 4 },
        { width: 280, height: 12, borderRadius: 3 },
      ],
    },
    // Filter pills
    {
      display: 'flex',
      flexDirection: 'row',
      gap: 8,
      children: [
        { width: 48, height: 28, borderRadius: 999 },
        { width: 88, height: 28, borderRadius: 999 },
        { width: 72, height: 28, borderRadius: 999 },
        { width: 64, height: 28, borderRadius: 999 },
      ],
    },
    // Stacked cards
    {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      children: [
        { aspectRatio: 16 / 9, borderRadius: 0 },
        { aspectRatio: 16 / 9, borderRadius: 0 },
        { aspectRatio: 16 / 9, borderRadius: 0 },
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

export default function WorkLoading() {
  return (
    <div className="page">
      <Skeleton
        name="work-page"
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
