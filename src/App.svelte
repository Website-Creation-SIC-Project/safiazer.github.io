<script>
	import { slide } from 'svelte/transition';
	import Saos from "saos";
	import Footer from "./Components/Footer/Footer.svelte";
	export let HEADER;
	export let FOOTER_DATA;

	let visible = true;
	let sections = [
		{
			id: 1,
			title: "Section 1",
			content: "This is some test content",
			active: false,
		},
		{
			id: 2,
			title: "Section 2",
			content: "Welcome to section 2 test content",
			active: false,
		},
		{
			id: 3,
			title: "Section 3",
			content: "Looks like you have found what is hidden behind door number 3",
			active: false,
		}
	]
	
	const expand = (section) => {
		sections = sections.map(s => {
			s.active = false
			if (s.id === section.id) {
				s.active = true
			}
			return s
		})
	}
</script>

<style>
	:global(body) {
		background-color: #f2eee2;
		color: black;
	}
	@keyframes -global-scale-in-center {
  0% {
    transform: rotateX(50deg) translateX(-200vw) skewX(-50deg);
    opacity: 1;
  }
  100% {
    transform: rotateX(0deg) translateX(0) skewX(0deg);
    opacity: 1;
  }
}
	
button {
  position: relative;
  margin: 0;
  padding: 5px 12px;
  height: 40px;
  width: 150px;
  outline: none;
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  text-transform: uppercase;
  background-color: #ffffff;
  border: 1px solid rgba(22, 76, 167, 0.6);
  border-radius: 10px;
  color: #1d89ff;
  font-weight: 400;
  font-size: 20px;
  font-family: inherit;
  z-index: 0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.02, 0.01, 0.47, 1);
 }
 button span {
    color: #164ca7;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.7px;
  }
  button:hover {
    animation: rotate 0.7s ease-in-out both;
  }
  button  span {
      animation: storm 0.7s ease-in-out both;
      animation-delay: 0.06s;
    }

@keyframes rotate {
  0% {
    transform: rotate(0deg) translate3d(0, 0, 0);
  }
  25% {
    transform: rotate(3deg) translate3d(0, 0, 0);
  }
  50% {
    transform: rotate(-3deg) translate3d(0, 0, 0);
  }
  75% {
    transform: rotate(1deg) translate3d(0, 0, 0);
  }
  100% {
    transform: rotate(0deg) translate3d(0, 0, 0);
  }
}
@keyframes storm {
  0% {
    transform: translate3d(0, 0, 0) translateZ(0);
  }
  25% {
    transform: translate3d(4px, 0, 0) translateZ(0);
  }
  50% {
    transform: translate3d(-3px, 0, 0) translateZ(0);
  }
  75% {
    transform: translate3d(2px, 0, 0) translateZ(0);
  }
  100% {
    transform: translate3d(0, 0, 0) translateZ(0);
  }

}
	.accordion {
		margin-bottom: 10px;
	}
	.slider {
		border: 1px solid #eee;
		border-radius:5px;
		padding: 4px 20px;
		background-color:#c6c1b2;
		color: white;
	}
</style>
<Saos animation={'scale-in-center 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both'}>
<img alt="logo" src="/image31.png" height="200px"/>
</Saos>
{#each sections as section}
<div class="accordion">

      <button  on:click={() => expand(section) } class="btn-slide-line">
        <span>{section.title}</span>
      </button>
	{#if section.active}
		<div class="slider" transition:slide>
			<h3>
				Foo
			</h3>
			<p>{section.content}</p>
		</div>
	{/if}
</div>
{/each}
<Footer footerData={FOOTER_DATA} header={HEADER} />
