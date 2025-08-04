##User Management Dashboard API Documentation
#Overview
This project provides a complete frontend interface for managing users through the reqres.in mock API. It implements full CRUD (Create, Read, Update, Delete) functionality with a responsive UI, local caching, and detailed API response visualization.

##Features
#Core Functionality
User Listing: Paginated display of users with avatar, name, email, and job title

Add New Users: Form with validation for creating new user records

Edit Users: Modify existing user information

Delete Users: Remove users with confirmation

Search: Filter users by name, email, or job title

Pagination: Navigate through user pages

Data Refresh: Force reload from API

##Technical Features
Local Caching: Stores user data in localStorage for offline access

API Response Viewer: Detailed inspection of all API responses

Loading States: Visual feedback during API operations

Error Handling: Graceful fallback to cached data when API fails

#Responsive Design: Works on desktop and mobile devices

##API Endpoints Used
The application interacts with these reqres.in endpoints:

##Endpoint	Method	Description
/api/users?page={page}	GET	Fetch paginated users
/api/users	POST	Create new user
/api/users/{id}	PUT	Update existing user
/api/users/{id}	DELETE	Remove user
