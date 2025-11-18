
let items = [
    { id: 1, name: 'Item 1', description: 'This is item 1' },
    
];

export async function GET(request) {
	return new Response(JSON.stringify(items), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function POST(request) {
	const body = await request.json();
	const newItem = { id: Date.now(), ...body };
	items.push(newItem);
	return new Response(JSON.stringify(newItem), {
		status: 201,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function PUT(request) {
	const body = await request.json();
	const { id, ...rest } = body;
	let item = items.find((i) => i.id === id);
	if (!item) {
		return new Response(JSON.stringify({ error: 'Item not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	Object.assign(item, rest);
	return new Response(JSON.stringify(item), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function DELETE(request) {
	const body = await request.json();
	const { id } = body;
	const index = items.findIndex((i) => i.id === id);
	if (index === -1) {
		return new Response(JSON.stringify({ error: 'Item not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	const deleted = items.splice(index, 1)[0];
	return new Response(JSON.stringify(deleted), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
