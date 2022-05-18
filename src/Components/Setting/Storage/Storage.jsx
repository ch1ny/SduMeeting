import React, { useEffect, useState } from 'react';

export default function Storage() {
	const [nowStorageSize, setNowStorageSize] = useState(0);
	useEffect(() => {
		window.ipc.invoke('NOW_STORAGE_SIZE').then((data) => {
			console.log(data);
		});
	}, []);

	return (
		<>
			<div>当前已占用: {}</div>
		</>
	);
}
