import React from 'react'
import CompletedProjectsComp from '../components/CurrentProject/CompletedProjectsComp'
import MainLayout from '../components/Layout/MainLayout'

export default function CompletedProjects() {
  return (
    <MainLayout mainBackgroundClass="bg-transparent">
        <CompletedProjectsComp/>
    </MainLayout>
  )
}
