const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5558';

const API_BASE_PATH = '/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = localStorage.getItem('auth_token');
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string> | undefined),
	};
	if (token && !headers.Authorization) {
		headers.Authorization = `Bearer ${token}`;
	}

	// Log token status for booking endpoints (for debugging)
	if (path.includes('/bookings')) {
		console.log('Booking API Request:', {
			path,
			hasToken: !!token,
			tokenLength: token?.length || 0,
			method: options.method || 'GET',
			headers: { ...headers, Authorization: token ? `Bearer ${token.substring(0, 20)}...` : 'No token' }
		});
	}

	const fullPath = path.startsWith('/api/') ? path : `${API_BASE_PATH}${path}`;
	const res = await fetch(`${API_BASE_URL}${fullPath}`, { ...options, headers });
	const contentType = res.headers.get('content-type') || '';
	const isJson = contentType.includes('application/json');
	let body: any;
	try {
		body = isJson ? await res.json() : await res.text();
	} catch (e) {
		body = await res.text().catch(() => null);
	}
	if (!res.ok) {
		// Prefer structured error message when available
		const message = isJson ? (body?.message || body?.error || JSON.stringify(body)) : String(body || res.statusText || 'Request failed');
		const err: any = new Error(String(message));
		err.status = res.status;
		err.body = body;
		
		// Log authentication errors for booking endpoints
		if (path.includes('/bookings') && (res.status === 401 || res.status === 403)) {
			console.error('Booking API Authentication Error:', {
				path,
				status: res.status,
				message,
				hasToken: !!token,
				error: body
			});
		}
		
		throw err;
	}
	return body as T;
}

// Public request function without authentication
async function publicRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
	const incomingHeaders = (options.headers as Record<string, string> | undefined) || {};
	// Explicitly remove Authorization header if present (both cases)
	const cleanHeaders: Record<string, string> = {};
	for (const [key, value] of Object.entries(incomingHeaders)) {
		if (key.toLowerCase() !== 'authorization') {
			cleanHeaders[key] = value;
		}
	}
	
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...cleanHeaders,
	};
	// Explicitly ensure Authorization is NOT in headers (check both cases)
	delete headers.Authorization;
	delete headers.authorization;

	const fullPath = path.startsWith('/api/') ? path : `${API_BASE_PATH}${path}`;
	
	// Create clean options without any auth-related headers
	const cleanOptions: RequestInit = {
		method: options.method,
		body: options.body,
		headers,
	};
	
	const res = await fetch(`${API_BASE_URL}${fullPath}`, cleanOptions);
	const contentType = res.headers.get('content-type') || '';
	const isJson = contentType.includes('application/json');
	let body: any;
	try {
		body = isJson ? await res.json() : await res.text();
	} catch (e) {
		body = await res.text().catch(() => null);
	}
	if (!res.ok) {
		// Prefer structured error message when available
		const message = isJson ? (body?.message || body?.error || JSON.stringify(body)) : String(body || res.statusText || 'Request failed');
		const err: any = new Error(String(message));
		err.status = res.status;
		err.body = body;
		throw err;
	}
	return body as T;
}

export interface BackendUser {
	id: string | number;
	name: string;
	email: string;
	phoneNumber?: string;
	role?: string;
	isVerified?: boolean;
}

export interface AuthResponse {
	message?: string;
	user: BackendUser;
	token: string;
}

export const authApi = {
	login: (email: string, password: string) =>
		request<AuthResponse>('/users/login', {
			method: 'POST',
			body: JSON.stringify({ email, password }),
		}),
	register: (payload: {
		name: string;
		email: string;
		phoneNumber: string;
		password: string;
		role?: string;
	}) => request<any>('/users/register', {
		method: 'POST',
		body: JSON.stringify({
			name: payload.name.trim(),
			email: payload.email.trim(),
			phoneNumber: payload.phoneNumber.trim(),
			password: payload.password,
			...(payload.role ? { role: payload.role.trim() } : {}),
		})
	}),
	verifyRegistrationOTP: (verificationToken: string, otp: string) =>
		request<any>('/users/verify-registration-otp', {
			method: 'POST',
			body: JSON.stringify({ otp }),
			headers: { Authorization: `Bearer ${verificationToken}` },
		}),
	resendOTP: (verificationToken: string) =>
		request<any>('/users/resend-otp', {
			method: 'POST',
			body: JSON.stringify({}),
			headers: { Authorization: `Bearer ${verificationToken}` },
		}),
};

export interface PropertyDto {
	id: string | number;
	title: string;
	description: string;
	price?: number;
	price_per?: 'day' | 'week' | 'month' | 'one_time' | string;
	city?: string;
	state?: string;
	address?: string;
	location?: string;
	latitude?: number | null;
	longitude?: number | null;
	images?: unknown[];
	image_url?: string;
	featured?: boolean;
	bedrooms?: number;
	bathrooms?: number;
	area?: number;
	status?: string;
	listing_type?: string;
	availability_status?: string;
	property_type?: string;
	amenities?: string[];
	categoryId?: string | number | null;
	category?: { id: string | number; name: string } | null;
}


export const propertiesApi = {
	// Accept arbitrary query params (page, limit, category, categoryId, filters...)
	list: (params?: Record<string, any>) =>
		request<{ success: boolean; properties: PropertyDto[]; total?: number; page?: number; limit?: number }>(
			`/properties${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`
		),

	// Get properties by category id (optionally with page/limit/other filters)
	getByCategory: (categoryId: string | number, params?: Record<string, any>) =>
		request<{ success: boolean; properties: PropertyDto[]; total?: number; page?: number; limit?: number }>(
			`/properties/category/${categoryId}${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`
		),
	getById: (id: string | number) =>
		request<{ success: boolean; property: PropertyDto }>(`/properties/${id}`),
};

export interface BookingDto {
	id: string | number;
	status: string;
	startDate?: string;
	endDate?: string;
	totalAmount?: number;
	property?: PropertyDto;
}

export const bookingsApi = {
	list: (params?: { page?: number; limit?: number; status?: string; all?: string }) =>
		request<{ success: boolean; data: { bookings: BookingDto[] } }>(
			`/bookings${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`
		),
	getUserBookings: (params?: { page?: number; limit?: number; status?: string }) =>
		request<{ success: boolean; data: { bookings: BookingDto[] } }>(
			`/bookings/user-bookings${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`
		),
	create: (payload: { propertyId: string | number; startDate: string; endDate: string; durationType: 'days' | 'weeks' | 'months'; totalAmount?: number }) => {
		const token = localStorage.getItem('auth_token');
		if (!token) {
			console.error('No auth token found for booking create');
			return Promise.reject(new Error('Authentication required. Please login again.'));
		}
		// Map frontend durationType to backend enum values used in the Sequelize model
		// Backend expects: 'daily', 'weekly', 'monthly'
		const map: Record<string, string> = {
			'days': 'daily', 'day': 'daily',
			'weeks': 'weekly', 'week': 'weekly',
			'months': 'monthly', 'month': 'monthly',
		};
		const dt = map[String(payload.durationType)] || String(payload.durationType);
		const body = { ...payload, durationType: dt } as any;
		console.log('Creating booking with payload:', { ...body, tokenPresent: !!token });
		return request<{ success: boolean; booking: BookingDto }>(`/bookings`, {
			method: 'POST',
			body: JSON.stringify(body),
		});
	},
	confirm: (id: string | number) => {
		const token = localStorage.getItem('auth_token');
		if (!token) {
			console.error('No auth token found for booking confirm');
			return Promise.reject(new Error('Authentication required. Please login again.'));
		}
		return request(`/bookings/${id}/confirm`, { method: 'POST' });
	},
	decline: (id: string | number) => {
		const token = localStorage.getItem('auth_token');
		if (!token) {
			console.error('No auth token found for booking decline');
			return Promise.reject(new Error('Authentication required. Please login again.'));
		}
		return request(`/bookings/${id}/decline`, { method: 'POST' });
	},
	cancel: (id: string | number) => {
		const token = localStorage.getItem('auth_token');
		if (!token) {
			console.error('No auth token found for booking cancel');
			return Promise.reject(new Error('Authentication required. Please login again.'));
		}
		return request(`/bookings/${id}/cancel`, { method: 'POST' });
	},
	availability: (propertyId: string | number) => request(`/bookings/property/${propertyId}/availability`),
};

export const usersApi = {
	getProfile: () => request<{ id: string | number; name: string; email: string; phoneNumber?: string; role?: string; isVerified?: boolean }>(`/users/profile`),
	updateProfile: (payload: { name?: string; email?: string; phoneNumber?: string }) =>
		request(`/users/profile`, { method: 'PATCH', body: JSON.stringify(payload) }),
	// Admin endpoints
	list: (params?: { page?: number; limit?: number }) =>
		request<{ success: boolean; users: BackendUser[] }>(`/users${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`),
	get: (id: string | number) => request<{ user: BackendUser }>(`/users/${id}`),
	create: (payload: { name: string; email: string; password: string; role?: string }) => request(`/users`, { method: 'POST', body: JSON.stringify(payload) }),
	update: (id: string | number, payload: any) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	remove: (id: string | number) => request(`/users/${id}`, { method: 'DELETE' }),
	updatePassword: (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
		request(`/users/update-password`, { method: 'PATCH', body: JSON.stringify(payload) }),
	forgotPassword: (email: string) => request(`/users/forgot-password`, { method: 'POST', body: JSON.stringify({ email }) }),
	verifyResetOTP: (email: string, otp: string) => request(`/users/verify-reset-otp`, { method: 'POST', body: JSON.stringify({ email, otp }) }),
	resetPassword: (payload: { newPassword: string; confirmPassword: string }, resetToken?: string) =>
		request(`/users/reset-password`, { method: 'POST', body: JSON.stringify(payload), headers: resetToken ? { Authorization: `Bearer ${resetToken}` } : undefined }),
	verifyEmail: (email: string) => request(`/users/verify-email`, { method: 'POST', body: JSON.stringify({ email }) }),
	verifyRegistrationOTP: (verificationToken: string, otp: string) =>
		request<{ message: string; user: any; token: string }>(
			'/users/verify-registration-otp',
			{
				method: 'POST',
				body: JSON.stringify({ otp }),
				headers: { Authorization: `Bearer ${verificationToken}` },
			},
		),
	// Public endpoint to count users by role (no auth required)
	count: (params?: { role?: string }) =>
		publicRequest<{ success: boolean; count: number; role?: string }>(
			`/users/count${params?.role ? `?role=${encodeURIComponent(params.role)}` : ''}`
		),
};

export const adminUsersApi = {
	list: (params?: { page?: number; limit?: number; role?: string }) =>
		request<{ success: boolean; users: BackendUser[]; pagination?: { total: number; page: number; limit: number } }>(
			`/admin/users${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`
		),
	get: (id: string | number) => request<{ user: BackendUser }>(`/admin/users/${id}`),
	create: (payload: { name: string; email: string; password: string; role?: string }) =>
		request(`/admin/users`, { method: 'POST', body: JSON.stringify(payload) }),
	update: (id: string | number, payload: any) => request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	remove: (id: string | number) => request(`/admin/users/${id}`, { method: 'DELETE' }),
	analytics: () => request(`/admin/analytics`),
	count: (params?: { role?: string }) =>
		publicRequest<{ success: boolean; total: number }>(
			`/admin/users/count${params?.role ? `?role=${encodeURIComponent(params.role)}` : ''}`
		),
};

export const adminListingsApi = {
	list: (params?: { page?: number; limit?: number }) =>
		request<{ success: boolean; properties: PropertyDto[]; pagination?: { total: number; page: number; limit: number } }>(
			`/admin/listings${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`
		),
	get: (id: string | number) => request<{ success: boolean; property: PropertyDto }>(`/admin/listings/${id}`),
	update: (id: string | number, payload: any) => request(`/admin/listings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	remove: (id: string | number) => request(`/admin/properties/${id}`, { method: 'DELETE' }),
	// Approve a listing (admin action)
	approve: (id: string | number) => request(`/admin/listings/${id}/approve`, { method: 'POST' }),
	// Decline/reject a listing (admin action)
	decline: (id: string | number) => request(`/admin/listings/${id}/decline`, { method: 'POST' }),
};

export const adminBookingsApi = {
	list: (params?: { page?: number; limit?: number; status?: string }) =>
		request<{ success: boolean; bookings: BookingDto[] }>(
			`/admin/bookings${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`
		),
	updateStatus: (id: string | number, payload: { status: string }) => request(`/admin/bookings/${id}/status`, { method: 'POST', body: JSON.stringify(payload) }),
	refund: (id: string | number) => request(`/admin/bookings/${id}/refund`, { method: 'POST' }),
};

export const adminPaymentsApi = {
	transactions: (params?: { page?: number; limit?: number }) =>
		request<{ success: boolean; payments: any[] }>(
			`/admin/payments/transactions${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`
		),
	revenueByMonth: () => request<{ success: boolean; data: any }>(`/admin/payments/revenue-by-month`),
};

export const propertiesApiExtended = {
	create: (payload: any) => request(`/properties`, { method: 'POST', body: JSON.stringify(payload) }),
	update: (id: string | number, payload: any) => request(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	remove: (id: string | number) => request(`/properties/${id}`, { method: 'DELETE' }),
	getByUser: (userId: string | number, params?: { page?: number; limit?: number }) =>
		request<{ success: boolean; properties: PropertyDto[] }>(`/properties/user/${userId}${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`),
	uploadMedia: async (id: string | number, formData: FormData) => {
		const token = localStorage.getItem('auth_token');
		const headers: Record<string, string> = {};
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}
		// Don't set Content-Type - let browser set it with boundary for FormData
		const fullPath = `${API_BASE_PATH}/properties/${id}/media`;
		const res = await fetch(`${API_BASE_URL}${fullPath}`, {
			method: 'POST',
			body: formData,
			headers
		});
		const contentType = res.headers.get('content-type') || '';
		const isJson = contentType.includes('application/json');
		const body = isJson ? await res.json() : await res.text();
		if (!res.ok) {
			const message = (isJson ? (body?.message || body?.error) : body) || 'Upload failed';
			throw new Error(String(message));
		}
		return body as any;
	},
	deleteMedia: (id: string | number, params: { type: 'image' | 'video'; filename?: string }) =>
		request(`/properties/${id}/media?${new URLSearchParams(params as any)}`, { method: 'DELETE' }),
};

export const paymentsApi: any = {
	initiate: (payload: { provider: string; amount: number; phone?: string }) =>
		request(`/payments/initiate`, { method: 'POST', body: JSON.stringify(payload) }),
	status: (paymentId: string | number) => request(`/payments/${paymentId}/status`),
};

// Optional: list past payments for the current user
paymentsApi.list = (params?: { limit?: number }) =>
	request<{ success: boolean; payments: any[] }>(`/payments${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`);

export const subscriptionsApi = {
	list: () => request<{ success: boolean; subscriptions: any[] }>(`/subscriptions`),
	renew: (id: string | number) => request(`/subscriptions/${id}/renew`, { method: 'POST' }),
	getStatus: (id: string | number) => request(`/subscriptions/${id}/status`),
};

export const inquiriesApi = {
	create: (propertyId: string | number, payload: { message: string; name?: string; email?: string }) =>
		request<{ success: boolean; inquiry: any }>(`/properties/${propertyId}/inquiries`, {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	listByProperty: (propertyId: string | number) =>
		request<{ success: boolean; inquiries: any[] }>(`/properties/${propertyId}/inquiries`),
};

export const favoritesApi = {
	create: (payload: { propertyId: string | number; note?: string }) =>
		request<{ success: boolean; favorite: any }>(`/favorites`, { method: 'POST', body: JSON.stringify(payload) }),
	list: (params?: { page?: number; limit?: number }) =>
		request<{ success: boolean; total: number; favorites: Array<{ id: string | number; property: PropertyDto }> }>(
			`/favorites${params ? `?${new URLSearchParams(Object.entries(params).reduce((a, [k,v]) => (v!=null ? (a[k]=String(v), a) : a), {} as Record<string,string>))}` : ''}`
		),
	remove: (id: string | number) => request(`/favorites/${id}`, { method: 'DELETE' }),
};

export interface CategoryDto {
	id: string | number;
	name: string;
	description?: string;
}

export const categoriesApi = {
	list: (params?: { includeProperties?: boolean }) =>
		request<{ success: boolean; categories: CategoryDto[] }>(
			`/categories${params?.includeProperties ? '?includeProperties=true' : ''}`
		),
	get: (id: string | number) => request<{ category: CategoryDto }>(`/categories/${id}`),
};

export const adminCategoriesApi = {
	list: (params?: { includeProperties?: boolean }) =>
		request<{ success: boolean; categories: CategoryDto[] }>(
			`/categories${params?.includeProperties ? '?includeProperties=true' : ''}`
		),
	get: (id: string | number) => request<{ success: boolean; category: CategoryDto }>(`/categories/${id}`),
	create: (payload: { name: string; description?: string }) =>
		request<{ message: string; category: CategoryDto }>(`/categories`, { method: 'POST', body: JSON.stringify(payload) }),
	update: (id: string | number, payload: { name?: string; description?: string }) =>
		request<{ message: string; category: CategoryDto }>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	remove: (id: string | number) => request<{ message: string }>(`/categories/${id}`, { method: 'DELETE' }),
};

export interface ReviewDto {
	id: string | number;
	rating: number;
	comment: string;
	createdAt?: string;
	user?: { id: string | number; name: string };
}

export const reviewsApi = {
	list: (propertyId: string | number) =>
		request<{ reviews: ReviewDto[] }>(`/reviews?propertyId=${propertyId}`),
	create: (propertyId: string | number, payload: { rating: number; comment: string }) =>
		request<{ message: string; review: ReviewDto }>(`/reviews`, {
			method: 'POST',
			body: JSON.stringify({ propertyId, ...payload }),
		}),
};


