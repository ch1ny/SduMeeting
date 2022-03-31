import React, { useState } from 'react';
import { Checkbox } from 'antd';

export default function AutoLogin() {
	const [autoLogin, setAutoLogin] = useState(localStorage.getItem('autoLogin') === 'true');

	return (
		<>
			<Checkbox
				checked={autoLogin}
				onChange={(e) => {
					setAutoLogin(e.target.checked);
					console.log(autoLogin);
					localStorage.setItem('autoLogin', e.target.checked);
				}}>
				自动登录
			</Checkbox>
		</>
	);
}
