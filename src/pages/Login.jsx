import React from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

export default function Login() {
  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      console.error(e)
      alert('Login failed. Check your Firebase config.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6">
      <div className="bg-white border border-[#E3DECE] rounded-2xl p-10 max-w-sm w-full text-center shadow-md">
        <h1 className="serif text-[2.4rem] text-[#1A1814] mb-1">Allocate</h1>
        <p className="text-[#9C948A] italic text-[.95rem] mb-3">Your money, intentionally</p>
        <p className="text-[#6B6458] text-[14px] mb-8">
          Track income, allocate spending,<br />and build savings — solo or shared.
        </p>

        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#1A1814] hover:bg-[#2d2a26] text-white rounded-lg font-medium transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="text-[11px] text-[#9C948A] mt-6 leading-relaxed">
          Your data is stored securely in Firebase.<br />
          We never sell or share your information.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
