Set voz = CreateObject("SAPI.SpVoice")
For Each v In voz.GetVoices
  WScript.Echo v.GetDescription
Next
