import { useEffect } from 'react'
import Router from 'next/router'

export default function Home({ locale, onLocale }) {
  useEffect(() => {
    Router.push('/swap')
  })

  return <>Redirecting...</>
}
