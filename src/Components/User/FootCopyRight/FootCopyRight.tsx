import React from 'react';

const thisYear = new Date().getFullYear();

export default function FootCopyRight() {
	return (
		<div className='userInfoCopyRight'>
			<p>
				© {thisYear} <a onClick={openMyBlog}>德布罗煜</a> Powered by
			</p>
			<p>
				<a onClick={openReact}>React.js</a> &amp; <a onClick={openElectron}>Electron.js</a>
			</p>
			<p style={{ fontSize: '1rem' }}>
				<a onClick={openSourceCodeOnGithub} style={{ fontFamily: 'FZZJ-TBPYTJW' }}>
					SDU Meeting
				</a>
				®
			</p>
		</div>
	);
}

const openSourceCodeOnGithub = () => {
	window.open('https://github.com/ch1ny/SduMeeting', 'sourceCode');
};

const openMyBlog = () => {
	window.open('https://aiolia.top/', 'myBlog');
};

const openReact = () => {
	window.open('https://reactjs.org/', 'react');
};

const openElectron = () => {
	window.open('https://www.electronjs.org/', 'electron');
};
