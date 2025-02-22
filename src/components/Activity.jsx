import {useEffect, useState} from 'react'
import { axiosPrivate } from '../api/axios'
import { useAuth } from "../components/auth";
const Activity = () => {
    const { getUserEmail } = useAuth()
    const [userInfo, setUserInfo] = useState(null)
    const getBalance = async () => {
      try {
        const response = await axiosPrivate.post('/user/balance', {
            user_email: getUserEmail()   
        })
        setUserInfo(response.data)
      } catch (error) {
        console.log(error)
      }
    }
    useEffect(() => {
        getBalance()
    }, [])
  return (
    <div>
        {userInfo && (
            <div>
                <p>Subscription Plan: {userInfo.subscription_plan}</p>
                <p>Balance:</p>
                {userInfo.balance && (
                    <div>
                        {userInfo.balance.test_quota !== undefined && (
                            userInfo.balance.test_quota === -1 ? (
                                <p>Test Quota: Unlimited</p>
                            ) : (
                                <p>Test Quota: {userInfo.balance.test_quota}</p>
                            )
                        )}
                        {userInfo.balance.audio_quota !== undefined && (
                            <p>Audio Quota: {userInfo.balance.audio_quota / 60} minutes</p>
                        )}
                        {userInfo.balance.video_quota !== undefined && (
                            <p>Video Quota: {userInfo.balance.video_quota / 60} minutes</p>
                        )}
                        {userInfo.balance.process_video_quota !== undefined && (
                            <p>Process Video Quota: {userInfo.balance.process_video_quota}</p>
                        )}
                    </div>
                )}
            </div>
        )}
    </div>
  )
}

export default Activity