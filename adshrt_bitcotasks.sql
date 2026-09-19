-- SQL Script to add the BitcoTasks offerwall
-- Docs: https://bitcotasks.com/documentations
--
-- Postback URL to set in the BitcoTasks dashboard (My Apps -> edit app):
--   https://adshrtpro.com/wh/bitcotasks
--
-- The secret key is NOT sent to the browser. It is used only to verify the
-- md5(subId + transId + reward + secretKey) signature on incoming postbacks.
-- The API key IS public - it appears in the offerwall iframe URL.

INSERT INTO offerwall_settings (id, network, is_enabled, api_key, secret_key, user_id, postback_url, updated_at)
VALUES (
  gen_random_uuid(),
  'bitcotasks',
  true,
  'ficvf6u2w4q2qxqpjwh1ymm81v2ce5',    -- BitcoTasks API Key
  '68c1c4f48c7eb3d7a34a1bd0e9d7c2a0',  -- BitcoTasks Secret Key (postback signature)
  NULL,                                 -- Not used; Sub ID is the AdShrtPro user ID
  'https://adshrtpro.com/wh/bitcotasks',
  NOW()
)
ON CONFLICT (network) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  api_key = EXCLUDED.api_key,
  secret_key = EXCLUDED.secret_key,
  postback_url = EXCLUDED.postback_url,
  updated_at = NOW();

-- Verify
SELECT network, is_enabled, postback_url,
       CASE WHEN api_key IS NOT NULL THEN 'Set' ELSE 'Not Set' END as api_key_status,
       CASE WHEN secret_key IS NOT NULL THEN 'Set' ELSE 'Not Set' END as secret_key_status
FROM offerwall_settings
WHERE network = 'bitcotasks';
