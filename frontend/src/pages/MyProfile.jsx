import React from 'react'
import MyProfileComp from '../components/Profile/MyProfileComp'
import MainLayout from '../components/Layout/MainLayout'

export default function MyProfile() {
  return (
    <MainLayout mainBackgroundClass="bg-transparent">
        <MyProfileComp/>
    </MainLayout>
  )
}
