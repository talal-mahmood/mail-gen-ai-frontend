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

export async function callBannerGenerateAPI(requestData: any): Promise<any> {
  if (!baseUrl) {
    throw new Error('API base URL is not defined in environment variables');
  }

  try {
    const response = await fetch(`/v1/banner/generate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate banner');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Banner API call error:', error);
    throw error;
  }
}

export async function callBlurbGenerateAPI(requestData: any): Promise<any> {
  if (!baseUrl) {
    throw new Error('API base URL is not defined in environment variables');
  }

  try {
    const response = await fetch(`/v1/powerblurb/generate`, {
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

export async function callAutocompleteAPI(
  query: string,
  service_type: number = 1,
  style_type: string = ''
): Promise<{ completion: string }> {
  if (!baseUrl) {
    throw new Error('API base URL is not defined in environment variables');
  }

  try {
    const response = await fetch(`/v1/autocomplete/generate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, service_type, style_type }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || 'Failed to get autocomplete suggestions'
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error('Autocomplete API call error:', error);
    throw error;
  }
}
