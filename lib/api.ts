const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function callSplashGenerateAPI(requestData: any): Promise<any> {
  if (!baseUrl) {
    throw new Error('API base URL is not defined in environment variables');
  }

  try {
    // ${baseUrl} (removed for it to work with vercel)
    const response = await fetch(`/v1/splash-page/generate`, {
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

export async function getSplashHtml(id: string): Promise<any> {
  if (!baseUrl) {
    throw new Error('API base URL is not defined in environment variables');
  }

  try {
    const response = await fetch(`/v1/splash-page/${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to retrieve splash page');
    }

    return await response.json();
  } catch (error: any) {
    console.error('API call error:', error);
    throw error;
  }
}

export async function callEmailGenerateAPI(requestData: any): Promise<any> {
  if (!baseUrl) {
    throw new Error('API base URL is not defined in environment variables');
  }

  try {
    const response = await fetch(`/v1/email/generate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate email');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Email API call error:', error);
    throw error;
  }
}
