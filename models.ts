export interface User {
	
}

export interface Room {
	owner: User,
	name: string,
	password?: string,
}