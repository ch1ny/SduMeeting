import Affix from 'antd/lib/affix';
import Anchor from 'antd/lib/anchor';
import Image from 'antd/lib/image';
import Typography from 'antd/lib/typography';
import React, { useEffect } from 'react';
import './App.scss';

const { Link } = Anchor;

export default function App() {
	useEffect(() => {
		document.title = '软件许可及服务协议 - 山大会议';
	}, []);

	return (
		<div id='agreement'>
			<div id='asider'>
				<Affix offsetTop={10}>
					<div>
						<div id='nav'>
							<div id='head'>服务协议</div>
							<Anchor>
								<Link href='#首部及导言' title='导言' />
								<Link href='#协议的范围' title='协议的范围' />
								<Link href='#关于本软件和本服务' title='关于本软件和本服务' />
								<Link href='#软件的获取' title='软件的获取' />
								<Link href='#软件的安装与卸载' title='软件的安装与卸载' />
								<Link href='#软件的更新' title='软件的更新' />
								<Link
									href='#用户信息及个人信息保护'
									title='用户信息及个人信息保护'
								/>
								<Link href='#用户行为规范' title='用户行为规范' />
								<Link href='#知识产权' title='知识产权' />
							</Anchor>
						</div>
						<Image src='../electronAssets/favicon.ico' />
					</div>
				</Affix>
			</div>
			<div id='content'>
				<Typography.Title level={2}>山大会议软件许可及服务协议</Typography.Title>
				<div className='module'>
					<Typography.Title level={4} className='title' id='首部及导言'>
						首部及导言
					</Typography.Title>
					<div style={{ fontWeight: 'bolder' }}>
						<p className='p'>欢迎您使用山大会议软件及服务！</p>
						<p className='p'>
							山大会议是由山东大学2019级软件工程系学生组成的山大会议开发组开发的软件。
						</p>
						<p className='p'>
							为使用山大会议软件（以下统称“本软件”）及服务，您应当阅读并遵守《山大会议软件许可及服务协议》（以下简称“本协议”）。
						</p>
						<p className='p'>
							请您务必审慎阅读、充分理解各条款内容，特别是免除或者限制山大会议开发组责任的条款、对用户权利进行限制的条款、约定争议解决方式和司法管辖的条款等，以及开通或使用某项服务的单独协议。限制、免责条款或者其他涉及您重大权益的条款可能以加粗、加下划线等形式提示您重点注意。
						</p>
						<p className='p'>
							如果您因年龄、智力等因素而不具有完全民事行为能力，请在法定监护人（以下简称"监护人"）的陪同下阅读和判断是否同意本协议。如果您是中国大陆地区以外的用户，您订立或履行本协议以及使用本服务的行为还需要同时遵守您所属和/或所处国家或地区的法律。
						</p>
						<p className='p'>相关定义：</p>
						<p className='p'>
							山大会议用户：指注册、登录、使用山大会议软件及服务并获得管理权限的个人（“个人用户”）。
						</p>
						<p className='p'>
							前述“山大会议会议用户”统称为“用户”或“所有用户”，在本协议中更多地称为“您”。
						</p>
					</div>
				</div>
				<div className='module'>
					<Typography.Title level={4} className='title' id='协议的范围'>
						一、【协议的范围】
					</Typography.Title>
					<div>
						<ul>
							<li>
								<div>
									<strong>1.1</strong>
								</div>
								<div>
									<p>
										本协议是您与山大会议开发组之间关于您下载、安装、使用、登录本软件，以及使用本服务所订立的协议。
									</p>
								</div>
							</li>
							<li>
								<div>
									<strong>1.2</strong>
								</div>
								<div>
									<p>
										本协议的内容，包括但不限于由山大会议开发组发布的与本软件和/或本服务相关的协议、规则、规范以及我们可能不断发布的关于本软件和/或本服务的相关协议、规则、规范等内容，前述内容一经正式发布，即为本协议不可分割的组成部分，与其构成统一整体，您同样应当遵守。
									</p>
								</div>
							</li>
						</ul>
					</div>
				</div>
				<div className='module'>
					<Typography.Title level={4} className='title' id='关于本软件和本服务'>
						二、【关于本软件和本服务】
					</Typography.Title>
					<div>
						<ul>
							<li>
								<div>
									<strong>2.1</strong>
								</div>
								<div>
									<p>
										本协议的内容，包括但不限于由山大会议开发组发布的与本软件和/或本服务相关的协议、规则、规范以及我们可能不断发布的关于本软件和/或本服务的相关协议、规则、规范等内容，前述内容一经正式发布，即为本协议不可分割的组成部分，与其构成统一整体，您同样应当遵守。
									</p>
								</div>
							</li>
							<li>
								<div>
									<strong>2.2</strong>
								</div>
								<div>
									<p>
										您知晓并同意，山大会议开发组可能会根据需要更新或调整本服务的内容。
									</p>
								</div>
							</li>
							<li>
								<div>
									<strong>2.3</strong>
								</div>
								<div>
									<p>
										山大会议可能根据实际需要对本服务中收费服务的收费标准、方式进行修改和变更，也可能会对部分免费服务开始收费。前述修改、变更或开始收费前，山大会议将在相应服务页面进行提前通知或公告。如果您不同意上述修改、变更或付费内容，您可以选择停止使用该服务。
									</p>
								</div>
							</li>
						</ul>
					</div>
				</div>
				<div className='module'>
					<Typography.Title level={4} className='title' id='软件的获取'>
						三、【软件的获取】
					</Typography.Title>
					<div>
						<ul>
							<li>
								<div>
									<strong>3.1</strong>
								</div>
								<div>
									<p>您可以直接从我们的 git 仓库的 Releases 页面获取本软件。</p>
								</div>
							</li>
							<li>
								<div>
									<strong>3.2</strong>
								</div>
								<div>
									<strong>
										如果您从未经山大会议授权的第三方获取本软件或与本软件名称相同的安装程序，我们无法保证该软件能够正常使用，并对因此给您造成的损失不予负责。
									</strong>
								</div>
							</li>
						</ul>
					</div>
				</div>
				<div className='module'>
					<Typography.Title level={4} className='title' id='软件的安装与卸载'>
						四、【软件的安装与卸载】
					</Typography.Title>
					<div>
						<ul>
							<li>
								<div>
									<strong>4.1</strong>
								</div>
								<div>
									<p>下载安装程序后，您需要按照该程序提示的步骤正确安装。</p>
								</div>
							</li>
							<li>
								<div>
									<strong>4.2</strong>
								</div>
								<div>
									<p>
										为提供更加优质、安全的服务，在本软件安装时可能推荐您安装其他软件，您可以选择安装或不安装。
									</p>
								</div>
							</li>
							<li>
								<div>
									<strong>4.3</strong>
								</div>
								<div>
									<p>
										如果您不再需要使用本软件或者需要安装新版软件，可以自行卸载。
									</p>
								</div>
							</li>
						</ul>
					</div>
				</div>
				<div className='module'>
					<Typography.Title level={4} className='title' id='软件的更新'>
						五、【软件的更新】
					</Typography.Title>
					<div>
						<ul>
							<li>
								<div>
									<strong>5.1</strong>
								</div>
								<div>
									<p>
										为了增进用户体验、完善服务内容，山大会议可能不断努力开发新的服务，并为您不时提供软件更新。
									</p>
								</div>
							</li>
							<li>
								<div>
									<strong>5.2</strong>
								</div>
								<div>
									<p>
										<strong>
											为了改善用户体验或提高服务安全性、保证功能的一致性等目的，山大会议有权对本软件进行更新，或者对软件的部分功能效果进行改变。
										</strong>
									</p>
								</div>
							</li>
							<li>
								<div>
									<strong>5.3</strong>
								</div>
								<div>
									<p>
										本软件新版本发布后，旧版本的软件可能无法使用。我们不保证旧版本软件继续可用，也不保证继续对旧版本软件提供相应的维护服务，请您随时核对并下载最新版本。
									</p>
								</div>
							</li>
						</ul>
					</div>
				</div>
				<div className='module'>
					<Typography.Title level={4} className='title' id='用户信息及个人信息保护'>
						六、【用户信息及个人信息保护】
					</Typography.Title>
					<div>
						<ul>
							<li>
								<div>
									<strong>6.1</strong>
								</div>
								<div>
									<strong>
										保护用户信息是山大会议开发组的一项基本原则，我们将在法律允许的范围内收集、使用、储存和分享您的相关信息。
									</strong>
								</div>
							</li>
							<li>
								<div>
									<strong>6.2</strong>
								</div>
								<div>
									<p>
										您在注册帐号或使用本服务的过程中，可能需要填写一些必要的信息。若国家法律法规（本协议中的“法律法规”指用户所属/所处地区、国家现行有效的法律、行政法规、司法解释、地方法规、地方规章、部门规章及其他规范性文件以及对于该等法律法规的不时修改和补充，以及相关政策规定等，下同。）有特殊规定的，您需要填写真实的身份信息（包括但不限于电子邮箱等信息）。若您填写的信息不完整、不真实、不规范、不合法或者山大会议开发组有理由认为您填写的信息不完整、不真实、不规范、不合法，则您可能无法使用本服务或在使用过程中受到限制。
									</p>
								</div>
							</li>
							<li>
								<div>
									<strong>6.3</strong>
								</div>
								<div>
									<p>
										山大会议开发组将运用各种安全技术和程序建立完善的管理制度来保护您的个人信息，以免遭受未经授权的访问、使用或披露。
									</p>
								</div>
							</li>
						</ul>
					</div>
				</div>
				<div className='module'>
					<Typography.Title level={4} className='title' id='用户行为规范'>
						七、【用户行为规范】
					</Typography.Title>
					<div>
						<ul>
							<li>
								<div>
									<strong>7.1</strong>
								</div>
								<div>
									<strong>
										<p>您充分理解并同意：</p>
										<p>
											7.1.1
											用户应当按照法律法规和服务要求，按相应页面的提示准确提供并及时更新用户的资料，以使之真实、及时、完整和准确。用户不得冒充他人进行注册，不得未经许可为他人注册，不得以可能误导其他用户的方式注册帐号，不得使用可能侵犯他人权益的用户名进行注册（包括但不限于涉嫌商标权、名誉权侵权等），不得以批量等方式恶意注册帐号，否则山大会议开发组有权在发现后不予注册或注销该帐号，由此给用户产生的损失应由用户自行承担。
										</p>
										<p>
											7.1.2
											用户须确认，在用户完成注册程序或以其他山大会议允许的方式实际使用本服务时，个人用户应当是具备完全民事行为能力的自然人，如不具备完全民事行为能力，则应征得监护人的明确同意后方能注册成为本服务的个人用户。若用户不具备前述主体资格，请勿使用本服务，否则用户及用户的监护人应承担因此而导致的一切后果，且山大会议有权注销、暂时冻结或永久冻结用户的账户，给山大会议开发组造成损失的，山大会议开发组有权向用户及相关用户的监护人追偿。
										</p>
									</strong>
								</div>
							</li>
							<li>
								<div>
									<strong>7.2</strong>
								</div>
								<div>
									<strong>
										<p>【用户注意事项】</p>
										<p>您充分理解并同意：</p>
										<p>
											7.2.1
											为了向您提供更好的服务或维护软件安全的目的，山大会议将按照法律法规规定的“合法、必要、正当”的原则获取您的相关信息。
										</p>
										<p>
											7.2.2
											您在使用本服务某一特定功能时，可能还需同意单独的协议、规则等，您在使用该项功能前请仔细阅读前述相关协议、规则。
										</p>
										<p>
											7.2.3
											您可以选择不向山大会议提供您的某些信息，或者根据产品设置取消山大会议收集某些信息的权利，但因此可能会导致相关服务功能无法实现。
										</p>
										<p>
											7.2.4
											山大会议将会尽其技术上的合理努力保障您在本服务中的数据存储安全，但是，我们并不能就此提供完全保证，包括但不限于以下情形：
										</p>
										<p className='p'>
											(1)
											山大会议不对由于非山大会议原因造成的您在本软件和/或本服务中相关数据的删除或储存失败负责。
										</p>
										<p className='p'>
											(2)
											您应自行备份存储在本软件和/或本服务中的数据、信息或与本软件和/或本服务相关的数据、信息，双方另有约定的按相应约定执行。
										</p>
										<p className='p'>
											(3)
											如果您停止使用本软件和/或本服务（如注销您的帐号时），或因您违反法律法规或本协议而被取消或终止本服务，山大会议有权从服务器上永久地删除您的数据。您的服务停止、终止或取消后，山大会议没有义务向您返还任何数据，您应自行在服务停止、终止或取消前做好备份。
										</p>
									</strong>
								</div>
							</li>
							<li>
								<div>
									<strong>7.3</strong>
								</div>
								<div>
									<strong>【用户禁止行为】</strong>
									<p>
										您在使用本软件和/或本服务的过程中，应遵守相关法律法规、用户协议、规则规范等，不得从事包括但不限于以下任何行为，也不得为以下任何行为提供便利：
									</p>
									<strong>
										<p>7.3.1 法律法规禁止的行为</p>
										<p>
											您在使用本服务时须遵守法律法规，不得制作、复制、发布、传播含有下列内容的信息或从事相关行为，也不得为制作、复制、发布、传播含有下列内容的信息或从事相关行为提供便利：
										</p>
										<p className='p'>(1) 反对宪法所确定的基本原则的。</p>
										<p className='p'>
											(2)
											危害国家安全，泄露国家秘密，颠覆国家政权，破坏国家统一的。
										</p>
										<p className='p'>(3) 损害国家荣誉和利益的。</p>
										<p className='p'>
											(4) 煽动民族仇恨、民族歧视，破坏民族团结的。。
										</p>
										<p className='p'>
											(5) 破坏国家宗教政策，宣扬邪教和封建迷信的。
										</p>
										<p className='p'>
											(6) 散布谣言，扰乱社会秩序，破坏社会稳定的。
										</p>
										<p className='p'>
											(7)
											散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的。
										</p>
										<p className='p'>
											(8) 侮辱或者诽谤他人，侵害他人合法权益的。
										</p>
										<p className='p'>
											(9)
											违反法律法规底线、社会主义制度底线、国家利益底线、公民合法权益底线、社会公共秩序底线、道德风尚底线和信息真实性底线的“七条底线”要求的。
										</p>
										<p className='p'>(10) 法律法规等禁止的其他行为。</p>
										<p>7.3.2 软件使用</p>
										<p>
											除非法律法规允许或山大会议开发组书面许可，您不得从事下列行为：
										</p>
										<p className='p'>
											(1) 删除本软件及其副本上关于著作权的信息。
										</p>
										<p className='p'>
											(2)
											对本软件进行反向工程、反向汇编、反向编译，或者以其他方式尝试发现本软件的源代码。
										</p>
										<p className='p'>
											(3)
											对山大会议开发组拥有知识产权的内容进行使用、出租、出借、复制、修改、链接、转载、汇编、发表、出版、建立镜像站点等。
										</p>
										<p className='p'>
											(4)
											对本软件或者本软件运行过程中释放到任何终端内存中的数据、软件运行过程中客户端与服务器端的交互数据，以及本软件运行所必需的系统数据，进行复制、修改、增加、删除、挂接运行或创作任何衍生作品，形式包括但不限于使用插件、外挂或非山大会议经授权的第三方工具/服务接入本软件和相关系统。
										</p>
										<p className='p'>
											(5)
											通过修改或伪造软件运行中的指令、数据，增加、删减、变动软件的功能或运行效果，或者将用于上述用途的软件、方法进行运营或向公众传播，无论这些行为是否为商业目的。
										</p>
										<p className='p'>
											(6)
											通过非山大会议开发组开发、授权的第三方软件、插件、外挂、系统，登录或使用本软件和/或本服务，或制作、发布、传播上述工具。
										</p>
										<p className='p'>
											(7) 其他可能影响、干扰本软件和/或本服务正常运行的行为。
										</p>
										<p>7.3.3 危害平台安全内容</p>
										<p>
											您不得从事包括但不限于以下任何行为，也不得为以下任何行为提供便利：
										</p>
										<p className='p'>
											(1)
											传播虚假中奖信息、钓鱼欺诈信息、非法或虚假理财信息等非法、诈骗或虚假信息。
										</p>
										<p className='p'>(2) 利用本软件的漏洞进行恶意攻击。</p>
										<p className='p'>
											(3)
											其他危害山大会议开发组、本软件或其他主体安全的内容、信息或行为。
										</p>
									</strong>
								</div>
							</li>
						</ul>
					</div>
				</div>
				<div className='module'>
					<Typography.Title level={4} className='title' id='知识产权'>
						八、【知识产权】
					</Typography.Title>
					<div>
						<ul>
							<li>
								<div>
									<strong>8.1</strong>
								</div>
								<div>
									<strong>
										山大会议开发组是本软件的知识产权权利人。本软件的著作权、商标权、专利权、商业秘密等知识产权，以及与本软件相关的所有信息内容（包括但不限于文字、图片、音频、视频、图表、界面设计、版面框架、有关数据或电子文档等）均受法律法规和相应的国际条约保护，山大会议开发组依法享有上述相关知识产权，但相关权利人依照法律规定应享有的权利除外。
									</strong>
								</div>
							</li>
							<li>
								<div>
									<strong>8.2</strong>
								</div>
								<div>
									<p>
										未经山大会议开发组或相关权利人书面同意，您不得为任何商业或非商业目的自行或许可任何第三方实施、利用、转让上述知识产权。
									</p>
								</div>
							</li>
						</ul>
					</div>
				</div>
				<div className='foot'>
					<Image
						src={'../electronAssets/favicon177x128.ico'}
						width={'25%'}
						height={'25%'}
					/>
					<div className='footText'>山大会议</div>
					<div className='footText'>SDU Meeting</div>
				</div>
			</div>
		</div>
	);
}
