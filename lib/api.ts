const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function callSplashGenerateAPI(requestData: any): Promise<any> {
  if (!baseUrl) {
    throw new Error('API base URL is not defined in environment variables');
  }

  try {
    // ${baseUrl} (removed for it to work with vercel)
    const response = await fetch(`/v1/chat/splash-generate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate HTML');
    }

    return await response.json();
  } catch (error: any) {
    console.error('API call error:', error);
    throw error;
  }
}
