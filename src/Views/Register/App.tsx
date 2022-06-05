import React, { lazy, Suspense } from 'react';
import './App.scss';

const Register = lazy(() => import('./Register/Register'));
const ModifyPassword = lazy(() => import('./ModifyPassword/ModifyPassword'));

const dom = switchDom(getUrlQueryType());

export default function App() {
	return (
		<div
			className='register'
			style={{ backgroundImage: `url(${require('./bg.jpg').default})` }}>
			<div className='container'>
				<Suspense fallback={<></>}>{dom}</Suspense>
			</div>
		</div>
	);
}

function getUrlQueryType() {
	let reg = new RegExp('(^|&)type=([^&]*)(&|$)', 'i');
	let r = location.search.substring(1).match(reg);
	if (r) {
		return decodeURIComponent(r[2]);
	}
	return '';
}

function switchDom(type: string) {
	switch (type) {
		case 'register':
			return <Register />;
		case 'forgetPassword':
			return <ModifyPassword />;
		default:
			return <></>;
	}
}
