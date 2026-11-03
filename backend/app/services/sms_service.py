import os
import logging
import httpx

logger = logging.getLogger(__name__)

async def send_sms_otp(mobile: str, otp_code: str) -> dict:
    """
    Sends a 4-digit OTP code to an Indian mobile number.
    Supports Fast2SMS (recommended for India) and generic logging fallback.
    
    To activate real SMS delivery:
    Add FAST2SMS_API_KEY to Render Environment Variables.
    """
    clean_mobile = mobile.strip().replace("+91", "").replace(" ", "").replace("-", "")
    if len(clean_mobile) > 10:
        clean_mobile = clean_mobile[-10:]

    fast2sms_key = os.getenv("FAST2SMS_API_KEY")

    # 1. If Fast2SMS API Key is configured, send real SMS
    if fast2sms_key and fast2sms_key.strip():
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": fast2sms_key.strip(),
                "Content-Type": "application/json"
            }
            payload = {
                "route": "otp",
                "variables_values": otp_code,
                "numbers": clean_mobile
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                data = res.json()
                logger.info(f"Fast2SMS Response for {clean_mobile}: {data}")
                
                if data.get("return") is True:
                    return {
                        "sent": True,
                        "provider": "fast2sms",
                        "message": f"Real SMS sent to +91 {clean_mobile}"
                    }
                else:
                    logger.warning(f"Fast2SMS returned error: {data}")
                    return {
                        "sent": False,
                        "provider": "fast2sms",
                        "error": str(data.get("message", "Fast2SMS error"))
                    }
        except Exception as e:
            logger.error(f"Failed to send SMS via Fast2SMS: {e}")
            return {"sent": False, "error": str(e)}

    # 2. Twilio Fallback if configured
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_auth = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_FROM_NUMBER")

    if twilio_sid and twilio_auth and twilio_from:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    url,
                    auth=(twilio_sid, twilio_auth),
                    data={
                        "From": twilio_from,
                        "To": f"+91{clean_mobile}",
                        "Body": f"Your ShopEzy COD Verification Code is: {otp_code}. Valid for 10 minutes."
                    }
                )
                if res.status_code in (200, 201):
                    return {"sent": True, "provider": "twilio"}
        except Exception as e:
            logger.error(f"Failed to send SMS via Twilio: {e}")

    # 3. No SMS Gateway configured - Development / Mock mode
    logger.info(f"[MOCK SMS] OTP for +91 {clean_mobile}: {otp_code}")
    return {
        "sent": False,
        "is_mock": True,
        "message": "No SMS gateway configured. Add FAST2SMS_API_KEY in Render to send live SMS."
    }
