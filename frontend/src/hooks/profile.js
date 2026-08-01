import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, uploadFile } from '../lib/client'

// Self-service portfolio profile (backend's app/routes/profile.py) — contact
// info, photo, resume, education. `user` itself (and its `education` array)
// comes from AuthContext's /api/auth/me, so every mutation here just needs
// to trigger AuthContext.refreshUser() afterwards — no separate react-query
// cache to keep in sync.

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (body) => api.put('/api/users/me/profile', body),
  })
}

export function useUploadPhoto() {
  return useMutation({
    mutationFn: (file) => uploadFile('/api/users/me/photo', file),
  })
}

export function useDeletePhoto() {
  return useMutation({
    mutationFn: () => api.del('/api/users/me/photo'),
  })
}

export function useUploadResume() {
  return useMutation({
    mutationFn: (file) => uploadFile('/api/users/me/resume', file),
  })
}

export function useDeleteResume() {
  return useMutation({
    mutationFn: () => api.del('/api/users/me/resume'),
  })
}

export function useAddEducation() {
  return useMutation({
    mutationFn: (body) => api.post('/api/users/me/education', body),
  })
}

export function useUpdateEducation() {
  return useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/api/users/me/education/${id}`, body),
  })
}

export function useDeleteEducation() {
  return useMutation({
    mutationFn: (id) => api.del(`/api/users/me/education/${id}`),
  })
}

// Marks the first-login onboarding wizard done (see features/onboarding/) —
// called once, on its last step.
export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: () => api.post('/api/users/me/complete-onboarding', {}),
  })
}
